import os

from notion2md.exporter.block import StringExporter
from notion_client import Client as NotionClient
from pinecone import Pinecone
import time

NOTION_API_KEY = os.environ.get("NOTION_API_KEY")
NOTION_DB_ID = os.environ.get("NOTION_DB_ID")
PINECONE_API_KEY = os.environ.get("PINECONE_API_KEY")
INDEX_NAME = "ragtest"

notion = NotionClient(auth=NOTION_API_KEY)
pc = Pinecone(api_key=PINECONE_API_KEY)

all_pages = []
next_cursor = None
while True:
    response = notion.databases.query(database_id=NOTION_DB_ID, start_cursor=None)

    all_pages.extend(response["results"])

    if response.get("has_more"):
        next_cursor = response["next_cursor"]
    else:
        break

if not pc.has_index(INDEX_NAME):
    pc.create_index_for_model(
        name=INDEX_NAME,
        cloud="aws",
        region="us-east-1",
        embed={
            "model": "llama-text-embed-v2",
            "field_map": {"text": "text"}
        }
    )

records = []
for page in all_pages:
    page_id = page["id"]
    page_title = page["properties"]["Title"]["title"][0]["plain_text"]
    exporter = StringExporter(block_id=page_id, token=NOTION_API_KEY)
    markdown = exporter.export()

    records.append({"id": page_id, "title": page_title, "text": markdown})
    print(page_title)

dense_index = pc.Index(INDEX_NAME)

dense_index.upsert_records("test", records)

time.sleep(10)

# View stats for the index
stats = dense_index.describe_index_stats()
print(stats)
