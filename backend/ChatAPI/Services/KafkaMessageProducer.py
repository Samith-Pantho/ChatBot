import json
import os
import traceback
from kafka import KafkaProducer
from Schemas.shared import SystemLogErrorSchema, CustomerChatMessageSchema
from Services.LogServices import AddLogOrError

producer = KafkaProducer(
    bootstrap_servers=os.getenv('KAFKA_BOOTSTRAP_SERVERS', 'kafka:9092'),
    value_serializer=lambda v: json.dumps(v).encode("utf-8"),
    acks='all'
)

async def SendMessage(data:CustomerChatMessageSchema):
    try:
        # Send to Kafka
        if data:
            kafkaAck = producer.send(
                "Chat_message",
                value=data.model_dump_json()
            )
            try:
                kafkaAck.get(timeout=10) 
            except Exception as kafka_ex:
                raise RuntimeError(f"Failed to send message to Kafka: {str(kafka_ex)}")
        else:
            raise ValueError("Topic or data is missing for kafka.")
        
    except Exception as ex:
        error_msg = f"{str(ex)}\n{traceback.format_exc()}"
        await AddLogOrError(SystemLogErrorSchema(
            Msg=error_msg,
            Type="ERROR",
            ModuleName="KafkaMessageProducer/SendMessage",
            CreatedBy=""
        ))
    return