import logging

from haystack import component

from rag import rewrite_with_history
from tracing_utils import log_ctx

logger = logging.getLogger(__name__)


@component
class RagQueryRewriter:

    @component.output_types(search_query=str)
    def run(self, memory_snapshot: dict, session_id: str, message: str) -> dict:
        search_query = rewrite_with_history(memory_snapshot, message)
        logger.info(f"RAG search query: {search_query}", **log_ctx(session_id=session_id))
        return {"search_query": search_query}
