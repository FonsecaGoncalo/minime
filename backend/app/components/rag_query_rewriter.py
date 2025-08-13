import logging

from haystack import component

from tracing_utils import log_ctx

logger = logging.getLogger(__name__)


@component
class RagQueryRewriter:

    @component.output_types(search_query=str)
    def run(self, memory_snapshot: dict, session_id: str, message: str) -> dict:
        logger.info(f"RAG search query: {message}", **log_ctx(session_id=session_id))
        return {"search_query": message}
