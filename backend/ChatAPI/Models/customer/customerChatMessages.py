from sqlalchemy import Boolean, Table, Column, Integer, String, DateTime, ForeignKey, Text
from datetime import datetime
from Config.dbConnection import meta, engine

customerChatMessages = Table(
    "CUSTOMER_CHAT_MESSAGES", meta,
    Column("ID", Integer, primary_key=True, autoincrement=False),
    Column("USER", String(500)),
    Column("MESSAGE", Text),
    Column("CREATED_AT", DateTime, default=datetime.now),
    Column("IS_BOT", Boolean), 
    Column("RESPONSE_TO", Integer, ForeignKey("CUSTOMER_CHAT_MESSAGES.ID")),
)


meta.create_all(bind=engine)
