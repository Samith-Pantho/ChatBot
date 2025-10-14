from sqlalchemy import Table, Column, Integer, String, DateTime
from Config.dbConnection import meta, engine

systemLogError = Table(
    "SYSTEM_LOG_ERROR", meta,
    Column("SL", Integer, primary_key=True, autoincrement=True),
    Column("ERR_DT", DateTime),
    Column("ERR_TYPE", String(10)),
    Column("ERR_MSG", String(length=4000)),
    Column("MODULE_NAME", String(100)),
    Column("CREATED_BY", String(100))
)


meta.create_all(bind=engine)