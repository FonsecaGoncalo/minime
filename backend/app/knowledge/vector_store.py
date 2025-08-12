import logging
import os
from typing import TypedDict, List

from pinecone import Pinecone
from pinecone.db_data import _Index as Index

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

PINECONE_API_KEY = os.environ.get("PINECONE_API_KEY")
INDEX_NAME = "ragtest"
NAMESPACE = "test"
EMBEDDED_MODEL = "llama-text-embed-v2"

pc = Pinecone(api_key=PINECONE_API_KEY)


class SearchResult(TypedDict):
    id: str
    text: str
    score: float


def get_or_create_index(index_name: str) -> Index:
    if not pc.has_index(index_name):
        logger.info(f"Creating index '{index_name}'")
        pc.create_index_for_model(
            name=index_name,
            cloud="aws",
            region="us-east-1",
            embed={
                "model": EMBEDDED_MODEL,
                "field_map": {"text": "text"}
            }
        )
    return pc.Index(index_name)


index = get_or_create_index(INDEX_NAME)


def search(query: str, top_k: int = 100, top_n=35) -> List[SearchResult]:
    search_payload = {"top_k": top_k, "inputs": {"text": query}}
    rerank_payload = {
        "model": "bge-reranker-v2-m3",
        "top_n": top_n,
        "rank_fields": ["text"],
        "parameters": {
            "truncate": "END"
        }
    }
    search_response = index.search(namespace=NAMESPACE, query=search_payload, rerank=rerank_payload)

    return [
        SearchResult(
            id=hit["_id"],
            text=hit["fields"]["text"],
            score=hit["_score"]
        ) for hit in search_response.result["hits"]
    ]


def upsert_records(records: List[dict]):
    index.upsert_records(NAMESPACE, records)
    logger.info(f"Upserted {len(records)} records into namespace '{NAMESPACE}'.")
