"""Plain-text email through SES. Off (and silent) unless SES_SENDER is configured."""
from __future__ import annotations

import os


def enabled() -> bool:
    return bool(os.environ.get("SES_SENDER"))


def send(to: str, subject: str, body: str) -> None:
    import boto3
    boto3.client("ses").send_email(
        Source=os.environ["SES_SENDER"], Destination={"ToAddresses": [to]},
        Message={"Subject": {"Data": subject, "Charset": "UTF-8"},
                 "Body": {"Text": {"Data": body, "Charset": "UTF-8"}}})


def site_link(fragment: str) -> str:
    """Absolute link into the website (hash route), or "" when SITE_URL is not configured."""
    base = os.environ.get("SITE_URL", "").rstrip("/")
    return f"{base}/#/{fragment}" if base else ""
