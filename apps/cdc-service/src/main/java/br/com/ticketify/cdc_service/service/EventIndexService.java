package br.com.ticketify.cdc_service.service;

import co.elastic.clients.elasticsearch.ElasticsearchClient;
import co.elastic.clients.elasticsearch.core.DeleteRequest;
import co.elastic.clients.elasticsearch.core.IndexRequest;
import co.elastic.clients.elasticsearch.indices.CreateIndexRequest;
import co.elastic.clients.elasticsearch.indices.ExistsRequest;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.StringReader;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class EventIndexService {

    private final ElasticsearchClient esClient;

    @Value("${elasticsearch.index}")
    private String indexName;

    private static final String INDEX_MAPPING = """
        {
          "settings": {
            "analysis": {
              "analyzer": {
                "portuguese_analyzer": {
                  "type": "custom",
                  "tokenizer": "standard",
                  "filter": ["lowercase", "portuguese_stemmer"]
                },
                "edge_ngram_analyzer": {
                  "type": "custom",
                  "tokenizer": "edge_ngram_tokenizer",
                  "filter": ["lowercase"]
                }
              },
              "tokenizer": {
                "edge_ngram_tokenizer": {
                  "type": "edge_ngram",
                  "min_gram": 2,
                  "max_gram": 20,
                  "token_chars": ["letter", "digit"]
                }
              },
              "filter": {
                "portuguese_stemmer": {
                  "type": "stemmer",
                  "language": "portuguese"
                }
              }
            }
          },
          "mappings": {
            "properties": {
              "title": {
                "type": "text",
                "analyzer": "portuguese_analyzer",
                "fields": {
                  "suggest": {
                    "type": "text",
                    "analyzer": "edge_ngram_analyzer",
                    "search_analyzer": "standard"
                  }
                }
              },
              "description": {
                "type": "text",
                "analyzer": "portuguese_analyzer"
              },
              "city": { "type": "keyword" },
              "category": { "type": "keyword" },
              "date_from": { "type": "date" },
              "available_seats": { "type": "integer" }
            }
          }
        }
        """;

    @PostConstruct
    public void ensureIndex() {
        try {
            boolean exists = esClient.indices()
                .exists(ExistsRequest.of(e -> e.index(indexName)))
                .value();

            if (!exists) {
                esClient.indices().create(
                    CreateIndexRequest.of(c -> c
                        .index(indexName)
                        .withJson(new StringReader(INDEX_MAPPING))
                    )
                );
                log.info("Elasticsearch index '{}' created", indexName);
            } else {
                log.info("Elasticsearch index '{}' already exists", indexName);
            }
        } catch (Exception e) {
            log.error("Failed to ensure Elasticsearch index '{}': {}", indexName, e.getMessage());
            throw new RuntimeException(e);
        }
    }

    public void upsert(String id, Map<String, Object> document) {
        try {
            esClient.index(IndexRequest.of(r -> r
                .index(indexName)
                .id(id)
                .document(document)
            ));
            log.debug("Upserted document id={} into index '{}'", id, indexName);
        } catch (Exception e) {
            log.error("Failed to upsert document id={}: {}", id, e.getMessage());
            throw new RuntimeException(e);
        }
    }

    public void delete(String id) {
        try {
            esClient.delete(DeleteRequest.of(r -> r
                .index(indexName)
                .id(id)
            ));
            log.debug("Deleted document id={} from index '{}'", id, indexName);
        } catch (Exception e) {
            log.error("Failed to delete document id={}: {}", id, e.getMessage());
            throw new RuntimeException(e);
        }
    }
}
