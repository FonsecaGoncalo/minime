import logging

import knowledge.vector_store as vector_store
from knowledge.vector_store import SearchResult

logger = logging.getLogger(__name__)

REWRITE_SYS = """You are a search-query generator for a RAG system.
Rewrite the last user message into a concise search query for retrieving the most relevant docs.
Use recent conversation only when it is about the same topic as the last message; if the topic has changed, ignore unrelated history.

Rules:
- Output only the search query (no explanations).
- Keep it short (<= 120 characters, aim for <= 90).
- Use context from earlier messages only if it shares the same subject or entity as the last message.
- Resolve pronouns or vague references ("it", "them", "diagrams") using relevant context.
- Include concrete nouns, project/service names, error codes, dates, and technical terms.
- If context is unrelated, treat the last message as standalone.
- Never invent details not present in the conversation
"""


def search(query: str, top_k: int = 100, top_n=35) -> list[SearchResult]:
    return vector_store.search(query, top_k, top_n)


def format_results(results):
    if not results:
        return "<doc rank='0' score='0.000'>NO_RESULTS</doc>"
    return "\n".join(
        f"<doc rank='{i + 1}' score='{r['score']:.3f}'>\n{r['text']}\n</doc>"
        for i, r in enumerate(results)
    )
