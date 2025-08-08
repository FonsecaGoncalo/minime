from contextlib import contextmanager
from tracing import tracer


def log_ctx(**kw):
    return {"extra": {"ctx": kw}}


@contextmanager
def span(name: str, **attrs):
    with tracer.start_as_current_span(name) as s:
        for k, v in attrs.items():
            s.set_attribute(k, v)
        yield
