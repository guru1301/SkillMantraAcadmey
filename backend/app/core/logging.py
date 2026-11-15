import logging
import re
import sys
from typing import Any
from backend.app.core.config import settings


class SensitiveDataRedactionFilter(logging.Filter):
    """
    Redacts sensitive credentials, tokens, codes, and Authorization headers
    from all log records, messages, arguments, and query strings.
    """
    # Regex 1: Query string parameters (e.g. ?password=..., &token=..., &code=...)
    _QUERY_PARAM_RE = re.compile(
        r"([?&](?:password|token|activation_code|code|secret|api_key|auth)=)[^&#\s]+",
        re.IGNORECASE,
    )
    # Regex 2: Authorization headers (e.g. Authorization: Bearer <token>)
    _AUTH_HEADER_RE = re.compile(
        r"((?:Authorization|auth_token)\s*[:=]\s*(?:Bearer\s+)?)[^\s,;'\"]+",
        re.IGNORECASE,
    )
    # Regex 3: Key-value / JSON pairs (e.g. password=..., password: ..., "password": "...", token=..., code=...)
    _KEY_VALUE_RE = re.compile(
        r"""(?i)(["']?(?:password(?:_hash)?|passwd|pwd|token|csrf_token|session_token|activation_code|activation_token|code|secret)["']?\s*[:=]\s*["']?)[^"',\s;]+(["']?)"""
    )

    def redact_text(self, text: str) -> str:
        if not isinstance(text, str):
            return text
        res = self._QUERY_PARAM_RE.sub(r"\1[REDACTED]", text)
        res = self._AUTH_HEADER_RE.sub(r"\1[REDACTED]", res)
        res = self._KEY_VALUE_RE.sub(r"\1[REDACTED]\2", res)
        return res

    def filter(self, record: logging.LogRecord) -> bool:
        if isinstance(record.msg, str):
            record.msg = self.redact_text(record.msg)
        if record.args:
            if isinstance(record.args, dict):
                record.args = {k: (self.redact_text(v) if isinstance(v, str) else v) for k, v in record.args.items()}
            elif isinstance(record.args, tuple):
                record.args = tuple(self.redact_text(arg) if isinstance(arg, str) else arg for arg in record.args)
        return True


def setup_logging() -> None:
    """
    Configures structured logging for the application.
    Ensures safe formatting without leaking sensitive authentication tokens or credentials.
    """
    log_level = logging.DEBUG if settings.DEBUG else logging.INFO
    log_format = "%(asctime)s [%(levelname)s] [%(name)s:%(lineno)d] - %(message)s"
    date_format = "%Y-%m-%d %H:%M:%S"

    redaction_filter = SensitiveDataRedactionFilter()
    handler = logging.StreamHandler(sys.stdout)
    handler.addFilter(redaction_filter)

    # Configure root logger
    logging.basicConfig(
        level=log_level,
        format=log_format,
        datefmt=date_format,
        handlers=[handler],
        force=True,
    )

    # Attach filter to root logger
    logging.getLogger().addFilter(redaction_filter)

    # Silence noisy third-party loggers
    logging.getLogger("uvicorn.access").setLevel(logging.WARNING if not settings.DEBUG else logging.INFO)
    logging.getLogger("sqlalchemy.engine").setLevel(logging.INFO if settings.DB_ECHO else logging.WARNING)


logger = logging.getLogger("skillmantra.backend")
logger.addFilter(SensitiveDataRedactionFilter())
