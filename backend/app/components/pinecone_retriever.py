import logging

from haystack import component

from knowledge import rag
from tracing_utils import log_ctx

logger = logging.getLogger(__name__)


@component
class PineconeRetriever:

    @component.output_types(documents=[str])
    def run(self, session_id: str, search_query: str, top_k: int, top_n: int) -> dict:
        results = rag.search(search_query, top_k, top_n)
        logger.info("RAG hits: %s", len(results), **log_ctx(session_id=session_id))
        return {"documents": rag.format_results(results)}
