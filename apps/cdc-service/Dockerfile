FROM eclipse-temurin:21-jdk-alpine AS builder
WORKDIR /app
COPY pom.xml .
COPY src ./src
RUN apk add --no-cache maven && mvn package -DskipTests -q

FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

# OpenTelemetry Java agent
ADD https://github.com/open-telemetry/opentelemetry-java-instrumentation/releases/download/v2.9.0/opentelemetry-javaagent.jar /app/opentelemetry-javaagent.jar

COPY --from=builder /app/target/cdc-service-*.jar app.jar

ENV JAVA_TOOL_OPTIONS="-javaagent:/app/opentelemetry-javaagent.jar"
ENV OTEL_SERVICE_NAME=cdc-service
ENV OTEL_EXPORTER_OTLP_ENDPOINT=http://jaeger:4317
ENV OTEL_EXPORTER_OTLP_PROTOCOL=grpc

EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
