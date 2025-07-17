import logging
from opentelemetry import trace
from opentelemetry.instrumentation.botocore import BotocoreInstrumentor

logger = logging.getLogger(__name__)
_initialized = False


def init_tracing(service_name: str = "minime") -> None:
    """Initialize OpenTelemetry tracing if not already configured."""
    global _initialized
    if _initialized:
        return
    _initialized = True
    try:
        BotocoreInstrumentor().instrument()
        logger.info("Tracing initialised")
    except Exception as exc:
        logger.warning("Tracing setup failed: %s", exc)


tracer = trace.get_tracer("minime")
