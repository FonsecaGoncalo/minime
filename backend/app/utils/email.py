import logging

import boto3

logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)
_ses = boto3.client("ses")


def send_email(from_addr: str, to_addr: str, sub: str, body: str) -> None:
    """Send email using AWS SES."""
    try:
        _ses.send_email(
            Source=from_addr,
            Destination={"ToAddresses": [to_addr]},
            Message={
                "Subject": {"Data": sub},
                "Body": {"Text": {"Data": body}},
            },
        )
        logger.info("Sent email summary to %s via SES", to_addr)
        logger.info("Body sent: %s", body)
    except Exception as exc:
        logger.warning("Failed to send email via SES: %s", exc)
