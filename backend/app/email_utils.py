from flask import render_template, current_app
from flask_mail import Message
from . import mail
import os

def send_email(to, subject, template, **kwargs):
    """Send an email using a template."""
    msg = Message(subject=subject, 
                  recipients=[to],
                  html=render_template(template, **kwargs),
                  sender=current_app.config['MAIL_DEFAULT_SENDER'])
    mail.send(msg) 