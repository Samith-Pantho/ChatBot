import hashlib
import traceback
from Schemas.shared import SystemLogErrorSchema
from Services.CallChatBotSPServices import sp_get_table_sl
from .LogServices import AddLogOrError
from sqlalchemy.ext.asyncio import AsyncSession
from Config.dbConnection import AsyncSessionLocalChatBot

async def GetSha1Hash(raw_data: str) -> str:
    try:
        sha1_hash = hashlib.sha1()
        sha1_hash.update(raw_data.encode('utf-8'))
        return sha1_hash.hexdigest()
    except Exception as ex:
        error_msg = f"{str(ex)}\n{traceback.format_exc()}"
        await AddLogOrError(SystemLogErrorSchema(
            Msg=error_msg,
            Type = "ERROR",
            ModuleName = "CommonServices/GetSha1Hash",
            CreatedBy = ""
        ))
        raise Exception(ex)

async def GetErrorMessage(ex:Exception):
    default_message = "Something went wrong, please try again later."
    try:
        message = str(ex)
        if hasattr(ex, 'args') and len(ex.args) > 1:
            # ex.args[1] usually holds MySQL error message
            message = ex.args[1]

        if "MySQL" in message or "SQLSTATE" in message or "pymysql" in message:
            return _GetMysqlException(message)
        else:
            return message
    except Exception as inner_ex:
        return f"{default_message} - {str(inner_ex)}"

def _GetMysqlException(msg):
    if "Insufficient Balance" in msg:
        return "Insufficient Balance."
    elif "Invalid Account" in msg:
        return "Invalid Account."
    elif "no data found" in msg or "empty result" in msg:
        return "No data found in database."
    elif "packet sequence number wrong" in msg or "Lost connection" in msg:
        return "Database connection issue. Please try again."
    elif "Data too long for column" in msg:
        return "Column size isn't sufficient in database."
    else:
        return "Exception occurred in database."

async def GetTableSl(tableNm:str):
    db_session = None
    try:
        db_session = AsyncSessionLocalChatBot()
        return await sp_get_table_sl(db_session, tableNm)
    except Exception as ex:
        error_msg = f"{str(ex)}\n{traceback.format_exc()}"
        await AddLogOrError(SystemLogErrorSchema(
            Msg=error_msg,
            Type = "ERROR",
            ModuleName = "CommonServices/GetTableSl",
            CreatedBy = ""
        ))
        return None
    finally:
        if db_session:
            await db_session.close()