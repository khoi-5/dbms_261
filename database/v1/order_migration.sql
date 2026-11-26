SET NOCOUNT ON;

IF @@TRANCOUNT <> 0
BEGIN
    RAISERROR(N'An existing transaction is open. Use a fresh SSMS query connection.', 16, 1);
    RETURN;
END;

SET IMPLICIT_TRANSACTIONS OFF;

IF DB_NAME() <> N'BKPEE_DB'
    THROW 51000, 'Select BKPEE_DB in SSMS and run the entire file.', 1;

IF OBJECT_ID(N'dbo.[Order]', N'U') IS NULL
   OR OBJECT_ID(N'dbo.Shop_Order', N'U') IS NULL
   OR OBJECT_ID(N'dbo.Shop_Order_Item', N'U') IS NULL
   OR OBJECT_ID(N'dbo.Payment_Information', N'U') IS NULL
   OR OBJECT_ID(N'dbo.Product_Variant', N'U') IS NULL
   OR OBJECT_ID(N'dbo.Cart_Item', N'U') IS NULL
    THROW 51002, 'Required base tables are missing from the selected database.', 1;

SET XACT_ABORT ON;
SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
SET ANSI_PADDING ON;
SET ANSI_WARNINGS ON;
SET ARITHABORT ON;
SET CONCAT_NULL_YIELDS_NULL ON;
SET NUMERIC_ROUNDABORT OFF;

BEGIN TRY
    BEGIN TRANSACTION;

    IF EXISTS (
        SELECT Order_ID
        FROM dbo.Payment_Information
        GROUP BY Order_ID
        HAVING COUNT_BIG(*) > 1
    )
        THROW 51003, 'Some orders have multiple payments. Review the payment model before applying this migration.', 1;

    DECLARE @Before TABLE (Table_Name SYSNAME PRIMARY KEY, Row_Count BIGINT);
    INSERT INTO @Before (Table_Name, Row_Count)
    SELECT N'Order', COUNT_BIG(*) FROM dbo.[Order]
    UNION ALL SELECT N'Shop_Order', COUNT_BIG(*) FROM dbo.Shop_Order
    UNION ALL SELECT N'Shop_Order_Item', COUNT_BIG(*) FROM dbo.Shop_Order_Item
    UNION ALL SELECT N'Payment_Information', COUNT_BIG(*) FROM dbo.Payment_Information
    UNION ALL SELECT N'Product_Variant', COUNT_BIG(*) FROM dbo.Product_Variant
    UNION ALL SELECT N'Cart_Item', COUNT_BIG(*) FROM dbo.Cart_Item;

    IF COL_LENGTH(N'dbo.[Order]', N'Checkout_Key') IS NULL
        EXEC(N'ALTER TABLE dbo.[Order] ADD Checkout_Key VARCHAR(64) NULL;');

    IF COL_LENGTH(N'dbo.[Order]', N'Checkout_Request_Hash') IS NULL
        EXEC(N'ALTER TABLE dbo.[Order] ADD Checkout_Request_Hash BINARY(32) NULL;');

    IF COL_LENGTH(N'dbo.[Order]', N'Receiver_Name') IS NULL
        EXEC(N'ALTER TABLE dbo.[Order] ADD Receiver_Name NVARCHAR(100) NULL;');

    IF COL_LENGTH(N'dbo.[Order]', N'Receiver_Phone') IS NULL
        EXEC(N'ALTER TABLE dbo.[Order] ADD Receiver_Phone VARCHAR(20) NULL;');

    IF COL_LENGTH(N'dbo.Shop_Order_Item', N'Product_Name_Snapshot') IS NULL
        EXEC(N'ALTER TABLE dbo.Shop_Order_Item ADD Product_Name_Snapshot NVARCHAR(255) NULL;');

    IF COL_LENGTH(N'dbo.Shop_Order', N'Stock_Deducted') IS NULL
        EXEC(N'ALTER TABLE dbo.Shop_Order ADD Stock_Deducted BIT NOT NULL CONSTRAINT DF_ShopOrder_StockDeducted DEFAULT (0) WITH VALUES;');

    IF COL_LENGTH(N'dbo.Payment_Information', N'Paid_At') IS NULL
        EXEC(N'ALTER TABLE dbo.Payment_Information ADD Paid_At DATETIME2 NULL;');

    IF NOT EXISTS (
        SELECT 1 FROM sys.indexes
        WHERE object_id = OBJECT_ID(N'dbo.Shop_Order')
          AND name = N'UX_ShopOrder_Tracking_NotNull'
    )
        EXEC(N'CREATE UNIQUE INDEX UX_ShopOrder_Tracking_NotNull ON dbo.Shop_Order(Tracking_Number) WHERE Tracking_Number IS NOT NULL;');

    DECLARE @TrackingConstraint SYSNAME;
    DECLARE @DropConstraintSql NVARCHAR(MAX);
    WHILE 1 = 1
    BEGIN
        SET @TrackingConstraint = NULL;
        SELECT TOP (1) @TrackingConstraint = kc.name
        FROM sys.key_constraints AS kc
        JOIN sys.index_columns AS ic
          ON ic.object_id = kc.parent_object_id
         AND ic.index_id = kc.unique_index_id
         AND ic.key_ordinal = 1
        JOIN sys.columns AS c
          ON c.object_id = ic.object_id
         AND c.column_id = ic.column_id
        WHERE kc.parent_object_id = OBJECT_ID(N'dbo.Shop_Order')
          AND kc.type = N'UQ'
          AND c.name = N'Tracking_Number'
          AND NOT EXISTS (
              SELECT 1 FROM sys.index_columns AS more_keys
              WHERE more_keys.object_id = ic.object_id
                AND more_keys.index_id = ic.index_id
                AND more_keys.key_ordinal > 1
          )
        ORDER BY kc.name;

        IF @TrackingConstraint IS NULL
            BREAK;

        SET @DropConstraintSql = N'ALTER TABLE dbo.Shop_Order DROP CONSTRAINT '
                               + QUOTENAME(@TrackingConstraint) + N';';
        EXEC sys.sp_executesql @DropConstraintSql;
    END;

    IF NOT EXISTS (
        SELECT 1 FROM sys.indexes
        WHERE object_id = OBJECT_ID(N'dbo.[Order]')
          AND name = N'UX_Order_Buyer_CheckoutKey'
    )
        EXEC(N'CREATE UNIQUE INDEX UX_Order_Buyer_CheckoutKey ON dbo.[Order](Buyer_ID, Checkout_Key) WHERE Checkout_Key IS NOT NULL;');

    IF NOT EXISTS (
        SELECT 1 FROM sys.indexes
        WHERE object_id = OBJECT_ID(N'dbo.Payment_Information')
          AND name = N'UX_Payment_Order'
    )
        EXEC(N'CREATE UNIQUE INDEX UX_Payment_Order ON dbo.Payment_Information(Order_ID);');

    -- Distinguish test-only simulated payments from COD and historical seed rows.
    IF COL_LENGTH(N'dbo.Payment_Information', N'Is_Simulated') IS NULL
        EXEC(N'ALTER TABLE dbo.Payment_Information ADD Is_Simulated BIT NOT NULL CONSTRAINT DF_Payment_IsSimulated DEFAULT (0) WITH VALUES;');

    -- A fully cancelled, unpaid COD order is distinct from a failed charge.
    IF EXISTS (SELECT 1 FROM sys.check_constraints WHERE parent_object_id=OBJECT_ID(N'dbo.Payment_Information') AND name=N'CK_Payment_Status' AND definition NOT LIKE N'%CANCELLED%')
        EXEC(N'ALTER TABLE dbo.Payment_Information DROP CONSTRAINT CK_Payment_Status;');
    IF NOT EXISTS (SELECT 1 FROM sys.check_constraints WHERE parent_object_id=OBJECT_ID(N'dbo.Payment_Information') AND name=N'CK_Payment_Status')
        EXEC(N'ALTER TABLE dbo.Payment_Information WITH CHECK ADD CONSTRAINT CK_Payment_Status CHECK (Payment_Status IN (N''PENDING'',N''COMPLETED'',N''FAILED'',N''REFUNDED'',N''CANCELLED''));');

    IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id=OBJECT_ID(N'dbo.[Order]') AND name=N'IX_Order_Buyer_Time')
        EXEC(N'CREATE INDEX IX_Order_Buyer_Time ON dbo.[Order](Buyer_ID,Order_Time DESC,Order_ID DESC);');
    IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id=OBJECT_ID(N'dbo.Shop_Order') AND name=N'IX_ShopOrder_Seller_Status_Order')
        EXEC(N'CREATE INDEX IX_ShopOrder_Seller_Status_Order ON dbo.Shop_Order(Seller_ID,Delivery_Status,Order_ID);');

    IF COL_LENGTH(N'dbo.Shop_Order', N'Buyer_Received_At') IS NULL
        EXEC(N'ALTER TABLE dbo.Shop_Order ADD Buyer_Received_At DATETIME2 NULL;');

    IF COL_LENGTH(N'dbo.Product_Variant', N'Variant_Name') IS NULL
        EXEC(N'ALTER TABLE dbo.Product_Variant ADD Variant_Name NVARCHAR(100) NULL;');

    IF COL_LENGTH(N'dbo.Shop_Order_Item', N'Variant_Name_Snapshot') IS NULL
        EXEC(N'ALTER TABLE dbo.Shop_Order_Item ADD Variant_Name_Snapshot NVARCHAR(100) NULL;');

    IF COL_LENGTH(N'dbo.Shop_Order', N'Promotion_ID_Snapshot') IS NULL
        EXEC(N'ALTER TABLE dbo.Shop_Order ADD Promotion_ID_Snapshot INT NULL;');

    IF COL_LENGTH(N'dbo.Shop_Order', N'Discount_Amount') IS NULL
        EXEC(N'ALTER TABLE dbo.Shop_Order ADD Discount_Amount DECIMAL(18,2) NOT NULL
            CONSTRAINT DF_ShopOrder_DiscountAmount DEFAULT (0) WITH VALUES;');

    IF NOT EXISTS (SELECT 1 FROM sys.check_constraints
                   WHERE parent_object_id = OBJECT_ID(N'dbo.Shop_Order') AND name = N'CK_ShopOrder_DiscountAmount')
        EXEC(N'ALTER TABLE dbo.Shop_Order WITH CHECK ADD CONSTRAINT CK_ShopOrder_DiscountAmount
            CHECK (Discount_Amount >= 0);');

    DECLARE @After TABLE (Table_Name SYSNAME PRIMARY KEY, Row_Count BIGINT);
    INSERT INTO @After (Table_Name, Row_Count)
    SELECT N'Order', COUNT_BIG(*) FROM dbo.[Order]
    UNION ALL SELECT N'Shop_Order', COUNT_BIG(*) FROM dbo.Shop_Order
    UNION ALL SELECT N'Shop_Order_Item', COUNT_BIG(*) FROM dbo.Shop_Order_Item
    UNION ALL SELECT N'Payment_Information', COUNT_BIG(*) FROM dbo.Payment_Information
    UNION ALL SELECT N'Product_Variant', COUNT_BIG(*) FROM dbo.Product_Variant
    UNION ALL SELECT N'Cart_Item', COUNT_BIG(*) FROM dbo.Cart_Item;

    IF EXISTS (
        SELECT 1 FROM @Before AS b
        JOIN @After AS a ON a.Table_Name = b.Table_Name
        WHERE a.Row_Count <> b.Row_Count
    )
        THROW 51004, 'Row counts changed unexpectedly. Schema changes have been rolled back.', 1;

    COMMIT TRANSACTION;
END TRY
BEGIN CATCH
    IF XACT_STATE() <> 0
        ROLLBACK TRANSACTION;
    THROW;
END CATCH;

DECLARE @RequiredColumns TABLE (Table_Name SYSNAME, Column_Name SYSNAME);
INSERT INTO @RequiredColumns (Table_Name, Column_Name)
VALUES
    (N'dbo.[Order]', N'Checkout_Key'),
    (N'dbo.[Order]', N'Checkout_Request_Hash'),
    (N'dbo.[Order]', N'Receiver_Name'),
    (N'dbo.[Order]', N'Receiver_Phone'),
    (N'dbo.Shop_Order', N'Stock_Deducted'),
    (N'dbo.Shop_Order_Item', N'Product_Name_Snapshot'),
    (N'dbo.Payment_Information', N'Paid_At'),
    (N'dbo.Payment_Information', N'Is_Simulated'),
    (N'dbo.Shop_Order', N'Buyer_Received_At'),
    (N'dbo.Product_Variant', N'Variant_Name'),
    (N'dbo.Shop_Order_Item', N'Variant_Name_Snapshot'),
    (N'dbo.Shop_Order', N'Promotion_ID_Snapshot'),
    (N'dbo.Shop_Order', N'Discount_Amount');

IF EXISTS (
    SELECT 1
    FROM @RequiredColumns AS r
    WHERE COL_LENGTH(r.Table_Name, r.Column_Name) IS NULL
)
BEGIN
    SELECT r.Table_Name, r.Column_Name AS Missing_Column
    FROM @RequiredColumns AS r
    WHERE COL_LENGTH(r.Table_Name, r.Column_Name) IS NULL;
    THROW 51005, 'Some required order columns are still missing or unreadable.', 1;
END;

SELECT @@SERVERNAME AS Server_Name, DB_NAME() AS Database_Name,
       N'ORDERS_SCHEMA_READY' AS Migration_Status;

SELECT b.Table_Name, b.Row_Count AS Rows_Before, a.Row_Count AS Rows_After
FROM @Before AS b
JOIN @After AS a ON a.Table_Name = b.Table_Name
ORDER BY b.Table_Name;

SELECT r.Table_Name, r.Column_Name, TYPE_NAME(c.user_type_id) AS Data_Type,
       c.is_nullable AS Is_Nullable
FROM @RequiredColumns AS r
JOIN sys.columns AS c ON c.object_id = OBJECT_ID(r.Table_Name, N'U')
                     AND c.name = r.Column_Name
ORDER BY r.Table_Name, r.Column_Name;

SELECT OBJECT_NAME(object_id) AS Table_Name, name AS Index_Name, is_unique AS Is_Unique
FROM sys.indexes
WHERE (object_id = OBJECT_ID(N'dbo.Shop_Order') AND name IN
          (N'UX_ShopOrder_Tracking_NotNull', N'IX_ShopOrder_Seller_Status_Order'))
   OR (object_id = OBJECT_ID(N'dbo.[Order]') AND name IN
          (N'UX_Order_Buyer_CheckoutKey', N'IX_Order_Buyer_Time'))
   OR (object_id = OBJECT_ID(N'dbo.Payment_Information') AND name = N'UX_Payment_Order')
ORDER BY Table_Name, Index_Name;
