USE BKPEE_DB;
GO

SET NOCOUNT ON;

IF @@TRANCOUNT <> 0
BEGIN
    RAISERROR(N'Use a connection with no open transaction.', 16, 1);
    RETURN;
END;
IF DB_NAME() <> N'BKPEE_DB'
    THROW 51000, 'Select the local BKPEE_DB database.', 1;
IF COL_LENGTH(N'dbo.Shop_Order', N'Stock_Deducted') IS NULL
   OR COL_LENGTH(N'dbo.Payment_Information', N'Is_Simulated') IS NULL
    THROW 51002, 'Run order_migration.sql first.', 1;

SET XACT_ABORT ON;
BEGIN TRY
    BEGIN TRANSACTION;
    IF COL_LENGTH(N'dbo.Shop_Order', N'Buyer_Received_At') IS NULL
        ALTER TABLE dbo.Shop_Order ADD Buyer_Received_At DATETIME2 NULL;
    COMMIT TRANSACTION;
END TRY
BEGIN CATCH
    IF XACT_STATE() <> 0 ROLLBACK TRANSACTION;
    THROW;
END CATCH;

SELECT DB_NAME() AS Database_Name, N'BUYER_RECEIPT_SCHEMA_READY' AS Setup_Status;
