package br.com.ticketify.cdc_service.consumer;

import br.com.ticketify.cdc_service.service.EventIndexService;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.kafka.clients.consumer.ConsumerRecord;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.kafka.support.Acknowledgment;
import org.springframework.stereotype.Component;

import java.util.Map;

@Slf4j
@Component
@RequiredArgsConstructor
public class EventChangeConsumer {

    private final EventIndexService eventIndexService;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @KafkaListener(topics = "${kafka.topic.events}", groupId = "cdc-service")
    public void consume(ConsumerRecord<String, String> record, Acknowledgment ack) {
        String value = record.value();

        // Tombstone (null value) — skip
        if (value == null) {
            ack.acknowledge();
            return;
        }

        try {
            Map<String, Object> payload = objectMapper.readValue(value, new TypeReference<>() {});

            String op = (String) payload.get("__op");
            String id = extractId(payload, record.key());

            if (id == null) {
                log.warn("Could not determine document id for record offset={}, skipping", record.offset());
                ack.acknowledge();
                return;
            }

            if ("d".equals(op)) {
                eventIndexService.delete(id);
                log.info("Deleted event id={} from Elasticsearch", id);
            } else if ("c".equals(op) || "u".equals(op) || "r".equals(op)) {
                eventIndexService.upsert(id, payload);
                log.info("Upserted event id={} into Elasticsearch (op={})", id, op);
            } else {
                log.debug("Skipping record with op='{}' offset={}", op, record.offset());
            }

            // Commit offset only after successful ES write
            ack.acknowledge();

        } catch (Exception e) {
            log.error("Failed to process Kafka record offset={}: {}", record.offset(), e.getMessage(), e);
            // Do not ack — let Kafka retry on restart
        }
    }

    private String extractId(Map<String, Object> payload, String recordKey) {
        Object id = payload.get("id");
        if (id != null) {
            return String.valueOf(id);
        }
        // Fallback: try to parse from Debezium JSON key {"id": "..."}
        if (recordKey != null) {
            try {
                Map<String, Object> keyMap = objectMapper.readValue(recordKey, new TypeReference<>() {});
                Object keyId = keyMap.get("id");
                if (keyId != null) return String.valueOf(keyId);
            } catch (Exception ignored) {
                return recordKey;
            }
        }
        return null;
    }
}
