from datetime import datetime
import traceback
from typing import Optional
from fastapi import APIRouter, Depends
from sqlalchemy import desc, func, select
from Models.shared import customerChatMessages
from Schemas.shared import SystemLogErrorSchema, StatusResult, CustomerChatMessageSchema, ChatRequestSchema
from Services.CommonServices import GetErrorMessage, GetTableSl
from Services.KafkaMessageProducer import SendMessage
from Services.LogServices import AddLogOrError
from Services.GenericCRUDServices import GenericInserter
from Services.VerifyAuth import GetCurrentUser
from sqlalchemy.ext.asyncio import AsyncSession
from Config.dbConnection import AsyncSessionLocalChatBot

ChatRoutes = APIRouter(prefix="/Chat")

@ChatRoutes.post("/PostMessage")
async def PostMessage(data: ChatRequestSchema, user: dict = Depends(GetCurrentUser))-> StatusResult:
    status = StatusResult()
    try:
        
        chat_response_msg = CustomerChatMessageSchema(
            id= await GetTableSl("customerChatMessages"),
            user=user.get("email"),
            message = data.message,
            is_bot = False,
            response_to = None,
            created_at = datetime.now()
        )
        await GenericInserter[CustomerChatMessageSchema].insert_record(
            table=customerChatMessages,
            schema_model=CustomerChatMessageSchema,
            data=chat_response_msg,
            returning_fields=[]
        )
        
        await SendMessage(chat_response_msg)
        status.Status = "OK"
        status.Message = None
        status.Result = chat_response_msg
    except Exception as ex:
        error_msg = f"{str(ex)}\n{traceback.format_exc()}"
        await AddLogOrError(SystemLogErrorSchema(
            Msg=error_msg,
            Type="ERROR",
            ModuleName="ChatRoutes/PostMessage",
            CreatedBy=""
        ))
        status.Status = "FAILED"
        status.Message = await GetErrorMessage(ex)
    return status


@ChatRoutes.get("/ChatHistory")
async def ChatHistory(previous_id: Optional[int] = None, user: dict = Depends(GetCurrentUser)) -> StatusResult:
    status = StatusResult()
    db_session = None
    try:
        user_id = user.get("email")
        if not user_id:
            status.Status = "FAILED"
            status.Message = "User not authenticated"
            return status
        
        db_session = AsyncSessionLocalChatBot()
        chatList = []
        
        stmt = (
            select(
                customerChatMessages.c.ID,
                customerChatMessages.c.USER,
                customerChatMessages.c.MESSAGE,
                customerChatMessages.c.CREATED_AT,
                customerChatMessages.c.IS_BOT,
                customerChatMessages.c.RESPONSE_TO
            )
            .where(func.lower(customerChatMessages.c.USER) == user_id.lower())
            .order_by(desc(customerChatMessages.c.ID))
            .limit(10)
        )

        if previous_id is not None and previous_id > 0:
            stmt = stmt.where(customerChatMessages.c.ID < previous_id)

        result = await db_session.execute(stmt)
        rows = result.fetchall()

        reversed_rows = list(reversed(rows))

        if reversed_rows:
            chatList = [CustomerChatMessageSchema(**dict(row._mapping)) for row in reversed_rows]
        else:
            chatList = []
        
        status.Status = "OK"
        status.Message = None
        status.Result = {
            "messages": chatList,
            "last_id": chatList[0].id if chatList else 0
        }
        
    except Exception as ex:
        error_msg = f"{str(ex)}\n{traceback.format_exc()}"
        await AddLogOrError(SystemLogErrorSchema(
            Msg=error_msg,
            Type="ERROR",
            ModuleName="ChatRoutes/ChatHistory",
            CreatedBy=user_id or ""
        ))
        status.Status = "FAILED"
        status.Message = await GetErrorMessage(ex)
        
    finally:
        if db_session:
            await db_session.close()
            
    return status