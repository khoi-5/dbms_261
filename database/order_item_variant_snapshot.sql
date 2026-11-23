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
IF COL_LENGTH(N'dbo.Product_Variant', N'Variant_Name') IS NULL
    THROW 51001, 'The test database needs the latest team schema with Product_Variant.Variant_Name.', 1;
IF COL_LENGTH(N'dbo.Shop_Order_Item', N'Product_Name_Snapshot') IS NULL
   OR COL_LENGTH(N'dbo.Shop_Order', N'Buyer_Received_At') IS NULL
    THROW 51002, 'Run order_migration.sql and buyer_receipt.sql first.', 1;

SET XACT_ABORT ON;
BEGIN TRY
    BEGIN TRANSACTION;
    IF COL_LENGTH(N'dbo.Shop_Order_Item', N'Variant_Name_Snapshot') IS NULL
        ALTER TABLE dbo.Shop_Order_Item ADD Variant_Name_Snapshot NVARCHAR(100) NULL;
    COMMIT TRANSACTION;
END TRY
BEGIN CATCH
    IF XACT_STATE() <> 0 ROLLBACK TRANSACTION;
    THROW;
END CATCH;

SELECT DB_NAME() AS Database_Name, N'ORDER_VARIANT_SNAPSHOT_READY' AS Setup_Status;
