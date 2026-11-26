-- BKPEE | SQL INDEXING DEMO | T4: Chi phi ghi INSERT/UPDATE khi co va khong co index
USE BKPEE_INDEX_DB;
GO
SET NOCOUNT ON;
IF DB_NAME() <> N'BKPEE_INDEX_DB' THROW 51000, 'Sai database.', 1;
IF (SELECT COUNT_BIG(*) FROM dbo.Product_Variant) NOT IN (10000, 50000)
    THROW 51001, 'Can nap seed Indexing 10K hoac 50K truoc.', 1;

-- 100 INSERT + 100 UPDATE, moi cau hinh do 1 LAN.
-- Transaction + ROLLBACK de giu nguyen du lieu (IDENTITY van co the tang).
SELECT i.name AS IndexName, i.type_desc, i.is_primary_key, i.is_unique
FROM sys.indexes AS i
WHERE i.object_id = OBJECT_ID(N'dbo.Product_Variant') AND i.index_id > 0
ORDER BY i.index_id;
DROP INDEX IF EXISTS IX_EXP_T4_Price ON dbo.Product_Variant;
DROP INDEX IF EXISTS IX_EXP_T4_Product ON dbo.Product_Variant;
DROP INDEX IF EXISTS IX_EXP_T4_PriceProduct ON dbo.Product_Variant;

SELECT TOP (100) Product_ID INTO #T4Products FROM dbo.Product ORDER BY Product_ID;
SELECT TOP (100) Variant_ID INTO #T4Variants FROM dbo.Product_Variant ORDER BY Variant_ID;
IF (SELECT COUNT(*) FROM #T4Products) <> 100 OR (SELECT COUNT(*) FROM #T4Variants) <> 100
    THROW 51002, 'Khong du 100 san pham/bien the.', 1;

DECLARE @start DATETIME2(7), @insertMs DECIMAL(18,3), @updateMs DECIMAL(18,3);

-- 1. BEFORE: khong co 3 index thu nghiem
BEGIN TRY
    BEGIN TRANSACTION;
    SET @start=SYSUTCDATETIME();
    INSERT INTO dbo.Product_Variant (Product_ID, Price, Is_Active, Quantity_Stock, Variant_Name, Image)
    SELECT Product_ID, CAST(150000 AS DECIMAL(18,2)), 1, 20, N'T4 demo', NULL FROM #T4Products;
    IF @@ROWCOUNT <> 100 THROW 51003, 'So dong INSERT khong dung.', 1;
    SET @insertMs=CAST(DATEDIFF_BIG(MICROSECOND,@start,SYSUTCDATETIME())/1000.0 AS DECIMAL(18,3));

    SET @start=SYSUTCDATETIME();
    UPDATE v SET Price=v.Price+1
    FROM dbo.Product_Variant AS v
    JOIN #T4Variants AS x ON x.Variant_ID=v.Variant_ID;
    IF @@ROWCOUNT <> 100 THROW 51004, 'So dong UPDATE khong dung.', 1;
    SET @updateMs=CAST(DATEDIFF_BIG(MICROSECOND,@start,SYSUTCDATETIME())/1000.0 AS DECIMAL(18,3));
    ROLLBACK TRANSACTION;
    SELECT 'BEFORE' AS Stage, @insertMs AS Insert100Ms, @updateMs AS Update100Ms;
END TRY
BEGIN CATCH
    IF XACT_STATE()<>0 ROLLBACK TRANSACTION;
    THROW;
END CATCH;

-- 2. Tao 3 index phu de quan sat chi phi ghi
CREATE NONCLUSTERED INDEX IX_EXP_T4_Price ON dbo.Product_Variant(Price);
CREATE NONCLUSTERED INDEX IX_EXP_T4_Product ON dbo.Product_Variant(Product_ID);
CREATE NONCLUSTERED INDEX IX_EXP_T4_PriceProduct ON dbo.Product_Variant(Price, Product_ID);
SELECT i.name AS IndexName, i.type_desc, i.is_primary_key, i.is_unique
FROM sys.indexes AS i
WHERE i.object_id = OBJECT_ID(N'dbo.Product_Variant') AND i.index_id > 0
ORDER BY i.index_id;

-- 3. AFTER: co 3 index, van 100 INSERT + 100 UPDATE
BEGIN TRY
    BEGIN TRANSACTION;
    SET @start=SYSUTCDATETIME();
    INSERT INTO dbo.Product_Variant (Product_ID, Price, Is_Active, Quantity_Stock, Variant_Name, Image)
    SELECT Product_ID, CAST(150000 AS DECIMAL(18,2)), 1, 20, N'T4 demo', NULL FROM #T4Products;
    IF @@ROWCOUNT <> 100 THROW 51005, 'So dong INSERT khong dung.', 1;
    SET @insertMs=CAST(DATEDIFF_BIG(MICROSECOND,@start,SYSUTCDATETIME())/1000.0 AS DECIMAL(18,3));

    SET @start=SYSUTCDATETIME();
    UPDATE v SET Price=v.Price+1
    FROM dbo.Product_Variant AS v
    JOIN #T4Variants AS x ON x.Variant_ID=v.Variant_ID;
    IF @@ROWCOUNT <> 100 THROW 51006, 'So dong UPDATE khong dung.', 1;
    SET @updateMs=CAST(DATEDIFF_BIG(MICROSECOND,@start,SYSUTCDATETIME())/1000.0 AS DECIMAL(18,3));
    ROLLBACK TRANSACTION;
    SELECT 'AFTER_3_INDEXES' AS Stage, @insertMs AS Insert100Ms, @updateMs AS Update100Ms;
END TRY
BEGIN CATCH
    IF XACT_STATE()<>0 ROLLBACK TRANSACTION;
    THROW;
END CATCH;

-- 4. Don index demo. Khong xoa PK/UNIQUE.
DROP INDEX IX_EXP_T4_Price ON dbo.Product_Variant;
DROP INDEX IX_EXP_T4_Product ON dbo.Product_Variant;
DROP INDEX IX_EXP_T4_PriceProduct ON dbo.Product_Variant;
DROP TABLE #T4Products;
DROP TABLE #T4Variants;
SELECT i.name AS IndexName, i.type_desc, i.is_primary_key, i.is_unique
FROM sys.indexes AS i
WHERE i.object_id = OBJECT_ID(N'dbo.Product_Variant') AND i.index_id > 0
ORDER BY i.index_id;
SELECT COUNT_BIG(*) AS VariantCountAfterT4 FROM dbo.Product_Variant;
