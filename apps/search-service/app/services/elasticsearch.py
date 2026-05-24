from elasticsearch import AsyncElasticsearch
from app.config import settings

INDEX = settings.elasticsearch_index

INDEX_BODY = {
    "settings": {
        "analysis": {
            "tokenizer": {
                "edge_ngram_tokenizer": {
                    "type": "edge_ngram",
                    "min_gram": 2,
                    "max_gram": 20,
                    "token_chars": ["letter", "digit"],
                }
            },
            "analyzer": {
                "edge_ngram_analyzer": {
                    "type": "custom",
                    "tokenizer": "edge_ngram_tokenizer",
                    "filter": ["lowercase"],
                }
            },
        }
    },
    "mappings": {
        "properties": {
            "id":          {"type": "keyword"},
            "title": {
                "type": "text",
                "analyzer": "portuguese",
                "fields": {
                    "suggest": {
                        "type": "text",
                        "analyzer": "edge_ngram_analyzer",
                        "search_analyzer": "standard",
                    }
                },
            },
            "description": {"type": "text", "analyzer": "portuguese"},
            "venue":       {"type": "text", "analyzer": "portuguese"},
            "city":        {"type": "keyword"},
            "category":    {"type": "keyword"},
            "date_from":   {"type": "date"},
            "min_price":   {"type": "float"},
            "available_seats": {"type": "integer"},
            "image_url":   {"type": "keyword", "index": False},
            "published":   {"type": "boolean"},
        }
    },
}


def get_client() -> AsyncElasticsearch:
    return AsyncElasticsearch(settings.elasticsearch_url)


async def ensure_index(client: AsyncElasticsearch) -> None:
    exists = await client.indices.exists(index=INDEX)
    if not exists:
        await client.indices.create(index=INDEX, body=INDEX_BODY)
