"""WSGI compatibility shim for Render default command.

Supports deployments that still use:
    gunicorn your_application.wsgi
"""

from app import app

# Gunicorn uses `application` by default when no :callable is specified.
application = app
