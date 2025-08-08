import llm_provider
import vector_store
from llm_provider import Model

REWRITE_MODEL = Model.NOVA_MICRO

REWRITE_SYS = """You are a search query generator for a RAG system.
Rewrite the user message into a concise search query that will retrieve the most relevant docs.
Use the recent conversation to resolve pronouns or vague references.
Rules:
- Keep the query short (<= 120 characters).
- Include key nouns, project names, dates, and technical terms from recent turns.
- Do not add explanations or extra text — output only the search query.
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
        f"[CurrentUser]\n{user_msg}"
    )
    return [
        {"role": "system", "content": REWRITE_SYS},
        {"role": "user", "content": user_block},
    ]

def rewrite_with_history(memory: dict, user_msg: str) -> str:
    llm = llm_provider.llm(REWRITE_MODEL, max_tokens=64, temperature=0.0, top_p=0.9)
    query = llm.invoke(build_rewrite_messages(memory, user_msg),
                       max_tokens=64, temperature=0.0, top_p=0.9)
    return query.strip()[:120] or user_msg[:120]


def search(query: str):
    return vector_store.search(query)


def format_results(results):
    if not results:
        return "<doc rank='0' score='0.000'>NO_RESULTS</doc>"
    return "\n".join(
        f"<doc rank='{i + 1}' score='{r['score']:.3f}'>\n{r['text']}\n</doc>"
        for i, r in enumerate(results)
    )
