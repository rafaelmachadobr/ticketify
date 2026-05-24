from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    elasticsearch_url: str = "http://localhost:9200"
    elasticsearch_index: str = "events"
    otel_exporter_otlp_endpoint: str = "http://localhost:4317"
    service_name: str = "search-service"

    model_config = {"env_file": ".env"}


settings = Settings()
