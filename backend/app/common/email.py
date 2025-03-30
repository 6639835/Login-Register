from flask import current_app, render_template
from flask_mail import Message
from threading import Thread
from .. import mail
import logging

logger = logging.getLogger(__name__)

def send_async_email(app, msg):
    """Send email asynchronously."""
    with app.app_context():
        try:
            mail.send(msg)
        except Exception as e:
            logger.error(f"Failed to send email: {str(e)}")

def send_email(subject, recipients, template_name, **context):
    """
    Send email using a template.
    
    Args:
        subject: Email subject
        recipients: List of recipient email addresses
        template_name: Name of the template (without extension)
        **context: Template variables
    """
    app = current_app._get_current_object()
    
    # Create message
    msg = Message(
        subject=subject,
        recipients=recipients,
        sender=app.config.get('MAIL_DEFAULT_SENDER')
    )
    
    # Render templates
    msg.body = render_template(f'emails/{template_name}.txt', **context)
    msg.html = render_template(f'emails/{template_name}.html', **context)
    
    # Send asynchronously
    thread = Thread(target=send_async_email, args=(app, msg))
    thread.start()
    
    return thread

def send_verification_email(user):
    """Send email verification."""
    token = user.generate_verification_token()
    app_name = current_app.config.get('APP_NAME', 'SecureAuth')
    verification_url = f"{current_app.config.get('FRONTEND_URL')}/verify-email/{token}"
    
    send_email(
        subject=f"Please verify your {app_name} account",
        recipients=[user.email],
        template_name='verification',
        user=user,
        verification_url=verification_url,
        app_name=app_name
    )

def send_password_reset_email(user, token):
    """Send password reset email."""
    app_name = current_app.config.get('APP_NAME', 'SecureAuth')
    reset_url = f"{current_app.config.get('FRONTEND_URL')}/reset-password/{token}"
    
    send_email(
        subject=f"Reset your {app_name} password",
        recipients=[user.email],
        template_name='password_reset',
        user=user,
        reset_url=reset_url,
        app_name=app_name
    )

def send_account_activity_notification(user, activity_type, details=None):
    """Send notification about account activity."""
    app_name = current_app.config.get('APP_NAME', 'SecureAuth')
    
    activities = {
        'login': {
            'subject': f"New login to your {app_name} account",
            'template': 'login_activity',
        },
        'password_change': {
            'subject': f"Your {app_name} password was changed",
            'template': 'password_changed',
        },
        '2fa_enabled': {
            'subject': f"Two-factor authentication enabled on your {app_name} account",
            'template': '2fa_enabled',
        },
        '2fa_disabled': {
            'subject': f"Two-factor authentication disabled on your {app_name} account",
            'template': '2fa_disabled',
        }
    }
    
    if activity_type not in activities:
        logger.error(f"Unknown activity type: {activity_type}")
        return
    
    activity = activities[activity_type]
    
    send_email(
        subject=activity['subject'],
        recipients=[user.email],
        template_name=activity['template'],
        user=user,
        details=details,
        app_name=app_name
    ) 