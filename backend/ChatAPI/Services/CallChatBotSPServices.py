import traceback
from sqlalchemy.sql import text
from Schemas.shared import SystemLogErrorSchema
from .LogServices import AddLogOrError

async def sp_get_table_sl(conn, table_nm: str) -> int | None:
    try:
        result = await conn.execute(text("CALL CHATBOT_GetTableSl(:table_nm)"), {"table_nm": table_nm})
        row = result.fetchone()
        sl = row.output_sl if row else None
        print(f"{table_nm}-{sl}")
        return sl
            
    except Exception as ex:
        error_msg = f"{str(ex)}\n{traceback.format_exc()}"
        await AddLogOrError(SystemLogErrorSchema(
            Msg=error_msg,
            Type="ERROR",
            ModuleName="CallChatBotSPServices/sp_get_table_sl",
            CreatedBy=""
        ))
        return None