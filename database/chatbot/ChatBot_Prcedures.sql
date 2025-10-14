DELIMITER $$

CREATE PROCEDURE CHATBOT_GetTableSl (
    IN input_table_nm VARCHAR(500)
)
BEGIN
    DECLARE current_sl INT;

    SELECT TABLE_SL INTO current_sl
    FROM SYSTEM_TABLE_SL
    WHERE TABLE_NM = input_table_nm
    FOR UPDATE;

    IF current_sl IS NULL THEN
        SET current_sl = 1;
        INSERT INTO SYSTEM_TABLE_SL (TABLE_NM, TABLE_SL) VALUES (input_table_nm, current_sl + 1);
    ELSE
        UPDATE SYSTEM_TABLE_SL SET TABLE_SL = current_sl + 1 WHERE TABLE_NM = input_table_nm;
    END IF;

    SELECT current_sl AS output_sl;

    COMMIT;
END $$

DELIMITER ;


