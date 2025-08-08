import vector_store

def search(query: str):
    return vector_store.search(query)

def format_results(results):
    if not results:
        return "<doc rank='0' score='0.000'>NO_RESULTS</doc>"
    return "\n".join(
        f"<doc rank='{i+1}' score='{r['score']:.3f}'>\n{r['text']}\n</doc>"
        for i, r in enumerate(results)
    )
