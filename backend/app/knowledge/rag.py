import logging

import llm_provider
import vector_store
from llm_provider import Model
from vector_store import SearchResult

logger = logging.getLogger(__name__)

REWRITE_MODEL = Model.NOVA_MICRO

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


def _recent_turns(memory: dict, max_msgs: int = 6) -> str:
    """Return the last 3 user/assistant turns as plain text."""
    convo = memory.get("conversation", [])[-max_msgs:]
    return "\n".join(f"{m['role']}: {m['message']}" for m in convo if m.get("message"))


def build_rewrite_messages(memory: dict, user_msg: str) -> list[dict[str, str]]:
    summary = (memory.get("summary") or "")[:800]
    recent = _recent_turns(memory)[:1200]
    user_block = (
        f"[Summary]\n{summary}\n\n"
        f"[RecentConversation]\n{recent}\n\n"
        f"[LastUserMessage]\n{user_msg}"
    )
    return [
        {"role": "system", "content": REWRITE_SYS},
        {"role": "user", "content": user_block},
    ]

def rewrite_with_history(memory: dict, user_msg: str) -> str:
    logger.info("Rewriting conversation history")
    llm = llm_provider.llm(REWRITE_MODEL, max_tokens=64, temperature=0.0, top_p=0.9)
    query = llm.invoke(build_rewrite_messages(memory, user_msg),
                       max_tokens=64, temperature=0.0, top_p=0.9)
    logger.info(f"RAG rewrite query: {query}")
    return query.strip()[:120] or user_msg[:120]


def search(query: str, top_k: int = 100, top_n=35) -> list[SearchResult]:
    return vector_store.search(query, top_k, top_n)


def format_results(results):
    if not results:
        return "<doc rank='0' score='0.000'>NO_RESULTS</doc>"
    return "\n".join(
        f"<doc rank='{i + 1}' score='{r['score']:.3f}'>\n{r['text']}\n</doc>"
        for i, r in enumerate(results)
    )
