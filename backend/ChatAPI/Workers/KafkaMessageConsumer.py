from datetime import datetime
import json
import os
import traceback
from aiokafka import AIOKafkaConsumer
from sqlalchemy import select
from Models.shared import customerChatMessages
from Schemas.shared import SystemLogErrorSchema, CustomerChatMessageSchema
from Services.CommonServices import GetSha1Hash, GetTableSl
from Services.GenericCRUDServices import GenericInserter
from Services.LogServices import AddLogOrError
from Config.dbConnection import ws_connections

consumer = AIOKafkaConsumer(
    'ai_response',
    bootstrap_servers=os.getenv('KAFKA_BOOTSTRAP_SERVERS', 'kafka:9092'),
    value_deserializer=lambda m: json.loads(m.decode('utf-8')),
    group_id="ai_consumer_group"
)

async def ConsumeResponse():
    await consumer.start()
    try:
        async for msg in consumer:
            try:
                response_data = msg.value
                if response_data:
                    chat_response_msg = CustomerChatMessageSchema(
                        id= await GetTableSl("customerChatMessages"),
                        user=response_data['user'],
                        message = response_data['response'],
                        is_bot = True,
                        response_to = response_data['request_id'],
                        created_at = datetime.now()
                    )
                    await GenericInserter[CustomerChatMessageSchema].insert_record(
                        table=customerChatMessages,
                        schema_model=CustomerChatMessageSchema,
                        data=chat_response_msg,
                        returning_fields=[]
                    )
                    
                    # Send response over websocket
                    ws = ws_connections.get(await GetSha1Hash(chat_response_msg.user))
                    if ws:
                        payload = json.dumps(chat_response_msg)
                        await ws.send_text(payload)
            except Exception as ex:
                print(f"Error consuming Kafka message: {str(ex)}")
                continue
    except Exception as ex:
        error_msg = f"{str(ex)}\n{traceback.format_exc()}"
        await AddLogOrError(SystemLogErrorSchema(
            Msg=error_msg,
            Type="ERROR",
            ModuleName="KafkaMessageConsumer/ConsumeResponse",
            CreatedBy=""
        ))
    
    finally:
        await consumer.stop()