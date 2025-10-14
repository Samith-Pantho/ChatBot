from sqlalchemy import Table, Column, String, Integer
from Config.dbConnection import meta, engine

systemTableSl = Table(
    "SYSTEM_TABLE_SL", meta,
    Column("TABLE_NM", String(500), primary_key=True),
    Column("TABLE_SL", Integer, nullable=False, default=1)
)

# Create the table in the DB
meta.create_all(bind=engine)
