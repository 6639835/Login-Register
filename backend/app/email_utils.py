from flask import render_template, current_app
from flask_mail import Message
from . import mail
import os
from .common.email import send_verification_email, send_password_reset_email, send_account_activity_notification

def send_email(to, subject, template, **kwargs):
    """Send an email using a template."""
    msg = Message(subject=subject, 
                  recipients=[to],
                  html=render_template(template, **kwargs),
                  sender=current_app.config['MAIL_DEFAULT_SENDER'])
    mail.send(msg) 