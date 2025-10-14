from typing import List, Optional, Type, TypeVar, Generic, Any
from pydantic import BaseModel
from sqlalchemy import Table, insert, update, select
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.ext.asyncio import AsyncSession
from Config.dbConnection import AsyncSessionLocalChatBot
from Schemas.shared import SystemLogErrorSchema
from Services.LogServices import AddLogOrError

T = TypeVar('T', bound=BaseModel)
TableType = TypeVar('TableType', bound=Table)

class GenericInserter(Generic[T]):
    @staticmethod
    async def insert_record(
        table: TableType,
        schema_model: Type[T],
        data: T,
        returning_fields=None,
        async_session: AsyncSession = None
    ) -> Optional[T]:
        """
        Async generic function to insert any record
        
        Args:
            table: SQLAlchemy Table object
            schema_model: Pydantic model class
            data: Pydantic model instance with data to insert
            returning_fields: List of columns to return after insert
            async_session: Optional existing async session
            
        Returns:
            Inserted record as Pydantic model if successful
        """
        local_session = None
        try:
            if not async_session:
                local_session = AsyncSessionLocalChatBot()
                session = local_session
            else:
                session = async_session

            insert_data = data.model_dump(exclude_unset=True, by_alias=True)
            stmt = insert(table).values(**insert_data)
            
            if returning_fields:
                stmt = stmt.returning(*returning_fields)
            
            result = await session.execute(stmt)
            
            # Auto-commit only when using local session
            if local_session:
                await session.commit()
            
            if returning_fields:
                inserted = result.first()
                return schema_model(**inserted._mapping) if inserted else None
            return None
            
        except SQLAlchemyError as ex:
            if local_session:
                await local_session.rollback()
            await AddLogOrError(SystemLogErrorSchema(
                Msg=str(ex),
                Type="ERROR",
                ModuleName="GenericCRUDServices/insert_record",
                CreatedBy=""
            ))
            raise ValueError(f"Database insert failed: {str(ex)}")
        finally:
            if local_session:
                await local_session.close()

class GenericUpdater(Generic[T, TableType]):
    @staticmethod
    async def update_record(
        table: TableType,
        schema_model: Type[T],
        record_id: Any,
        update_data: T,
        id_column: str = "id",
        exclude_fields: set = None,
        async_session: AsyncSession = None
    ) -> Optional[T]:
        """
        Async generic function to update any record
        
        Args:
            table: SQLAlchemy Table object
            schema_model: Pydantic model class
            record_id: ID of the record to update
            update_data: Pydantic model instance with update values
            id_column: Name of the primary key column (default: "id")
            exclude_fields: Set of field names to exclude from update
            async_session: Optional existing async session
            
        Returns:
            Updated record as Pydantic model if successful
        """
        if exclude_fields is None:
            exclude_fields = set()
            
        local_session = None
        try:
            if not async_session:
                local_session = AsyncSessionLocalChatBot()
                session = local_session
            else:
                session = async_session

            update_dict = update_data.model_dump(
                exclude_unset=True,
                exclude_none=True,
                exclude=exclude_fields,
                by_alias=True
            )
            update_dict.pop(id_column, None)
            
            if not update_dict:
                raise ValueError("No valid fields provided for update")
            
            stmt = (
                update(table)
                .where(getattr(table.c, id_column) == record_id)
                .values(**update_dict)
            )
            
            result = await session.execute(stmt)
            
            if result.rowcount == 0:
                raise ValueError(f"No record found with {id_column}: {record_id}")
            
            updated_record = (await session.execute(
                select(table).where(getattr(table.c, id_column) == record_id)
            )).mappings().first()

            # Auto-commit only when using local session
            if local_session:
                await session.commit()
            
            if updated_record:
                return schema_model(**updated_record)
            return None
            
        except SQLAlchemyError as ex:
            if local_session:
                await local_session.rollback()
            await AddLogOrError(SystemLogErrorSchema(
                Msg=str(ex),
                Type="ERROR",
                ModuleName="GenericCRUDServices/update_record",
                CreatedBy=""
            ))
            raise ValueError(f"Database error: {str(ex)}")
        except Exception as ex:
            if local_session:
                await local_session.rollback()
            await AddLogOrError(SystemLogErrorSchema(
                Msg=str(ex),
                Type="ERROR",
                ModuleName="GenericCRUDServices/update_record",
                CreatedBy=""
            ))
            raise ValueError(f"Error updating record: {str(ex)}")
        finally:
            if local_session:
                await local_session.close()