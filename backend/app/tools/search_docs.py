from typing import Annotated

from haystack import Pipeline
from haystack.tools import tool

from components.pinecone_retriever import PineconeRetriever
from components.rag_query_rewriter import RagQueryRewriter


def make_search_docs(session_id, memory_snapshot):
    @tool(name="search_docs",
          description="Retrieve relevant documents/snippets from the KB")
    def search_docs(
            query: Annotated[str, "Query to Search"],
    ) -> str:
        rag_pipeline = Pipeline()
        rag_pipeline.add_component("rag_query_retriever", RagQueryRewriter())
        rag_pipeline.add_component("pinecone_retriever", PineconeRetriever())
        rag_pipeline.connect("rag_query_retriever", "pinecone_retriever")
        return rag_pipeline.run(
            data={
                "rag_query_retriever": {
                    "memory_snapshot": memory_snapshot,
                    "session_id": session_id,
                    "message": query
                },
                "pinecone_retriever": {
                    "search_query": query,
                    "memory_snapshot": memory_snapshot,
                    "session_id": session_id,
                    "top_k": 40,
                    "top_n": 20,
                }
            })["documents"]

    return search_docs
