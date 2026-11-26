-- BKPEE INDEXING | SQL Server | T4 - Chi phi INSERT 100 + UPDATE 100 khi co/khong co 3 index
-- CHI thuc hien tren BKPEE_INDEX_DB. Khong sua BKPEE_DB goc.
-- F5 toan bo file trong SSMS. 1 warmup + 3 lan do moi cau hinh.
-- Xem tab Messages de lay so do; median cua 3 lan do.
USE BKPEE_INDEX_DB;
GO
SET NOCOUNT ON;
IF DB_NAME() <> N'BKPEE_INDEX_DB' THROW 51000, 'Wrong database.', 1;
IF (SELECT COUNT_BIG(*) FROM dbo.Product_Variant) NOT IN (10000,50000)
    THROW 51001, 'Can seed 10K hoac 50K truoc.', 1;

-- 1. Kiem tra index tren Product_Variant.
SELECT OBJECT_NAME(i.object_id) AS TableName, i.name AS IndexName, i.type_desc,
       i.is_unique, i.is_primary_key
FROM sys.indexes AS i
WHERE i.object_id = OBJECT_ID(N'dbo.Product_Variant') AND i.index_id > 0
ORDER BY i.index_id;

-- Chi xoa 3 index T4 cua bai nay neu con tu lan chay truoc.
IF EXISTS (SELECT 1 FROM sys.indexes WHERE object_id=OBJECT_ID(N'dbo.Product_Variant') AND name=N'IX_EXP_T4_Price')
    DROP INDEX IX_EXP_T4_Price ON dbo.Product_Variant;
IF EXISTS (SELECT 1 FROM sys.indexes WHERE object_id=OBJECT_ID(N'dbo.Product_Variant') AND name=N'IX_EXP_T4_Product')
    DROP INDEX IX_EXP_T4_Product ON dbo.Product_Variant;
IF EXISTS (SELECT 1 FROM sys.indexes WHERE object_id=OBJECT_ID(N'dbo.Product_Variant') AND name=N'IX_EXP_T4_PriceProduct')
    DROP INDEX IX_EXP_T4_PriceProduct ON dbo.Product_Variant;
-- 2. Tao danh sach 100 product/variant co that de dung chung cho moi lan.
SELECT TOP (100) Product_ID INTO #T4Products FROM dbo.Product ORDER BY Product_ID;
SELECT TOP (100) Variant_ID INTO #T4Variants FROM dbo.Product_Variant ORDER BY Variant_ID;
IF (SELECT COUNT(*) FROM #T4Products)<>100 OR (SELECT COUNT(*) FROM #T4Variants)<>100
    THROW 51002, 'Khong du 100 product/variant.', 1;

-- Moi lan do trong TRANSACTION + ROLLBACK: khong thay doi so dong hay gia tri da seed.
-- IDENTITY Product_Variant co the tang du sau rollback (khong anh huong phep do).
DECLARE @stage INT=0, @run INT, @t DATETIME2(7), @insertUs BIGINT, @updateUs BIGINT;
WHILE @stage <= 1
BEGIN
    IF @stage=1
    BEGIN
        CREATE NONCLUSTERED INDEX IX_EXP_T4_Price ON dbo.Product_Variant(Price);
        CREATE NONCLUSTERED INDEX IX_EXP_T4_Product ON dbo.Product_Variant(Product_ID);
        CREATE NONCLUSTERED INDEX IX_EXP_T4_PriceProduct ON dbo.Product_Variant(Price, Product_ID);
    END;
    PRINT CONCAT('T4 | ',CASE WHEN @stage=0 THEN 'BASELINE' ELSE '3_INDEXES' END);
    -- Kiem tra index tai moi trang thai.
    SELECT i.name, i.type_desc FROM sys.indexes AS i
    WHERE i.object_id=OBJECT_ID(N'dbo.Product_Variant') AND i.index_id>0 ORDER BY i.index_id;
    SET @run=0;
    WHILE @run<=3
    BEGIN
        BEGIN TRY
            BEGIN TRANSACTION;
            SET @t=SYSUTCDATETIME();
            INSERT INTO dbo.Product_Variant (Product_ID,Price,Is_Active,Quantity_Stock,Variant_Name,Image)
            SELECT Product_ID,CAST(150000 AS DECIMAL(18,2)),1,20,N'T4 insert test',NULL
            FROM #T4Products;
            IF @@ROWCOUNT<>100 THROW 51003, 'T4 INSERT count mismatch.', 1;
            SET @insertUs=DATEDIFF_BIG(MICROSECOND,@t,SYSUTCDATETIME());

            SET @t=SYSUTCDATETIME();
            UPDATE v SET Price=Price+1
            FROM dbo.Product_Variant AS v
            JOIN #T4Variants AS x ON x.Variant_ID=v.Variant_ID;
            IF @@ROWCOUNT<>100 THROW 51004, 'T4 UPDATE count mismatch.', 1;
            SET @updateUs=DATEDIFF_BIG(MICROSECOND,@t,SYSUTCDATETIME());
            ROLLBACK TRANSACTION;
            PRINT CONCAT('T4 | ',CASE WHEN @stage=0 THEN 'BASELINE' ELSE '3_INDEXES' END,
                ' | ',CASE WHEN @run=0 THEN 'WARMUP' ELSE CONCAT('RUN ',@run) END,
                ' | Insert100Ms=',CAST(@insertUs/1000.0 AS DECIMAL(18,3)),
                ' | Update100Ms=',CAST(@updateUs/1000.0 AS DECIMAL(18,3)));
        END TRY
        BEGIN CATCH
            IF XACT_STATE()<>0 ROLLBACK TRANSACTION;
            THROW;
        END CATCH;
        SET @run+=1;
    END;
    SET @stage+=1;
END;
-- 3. Don dung 3 index cua T4, giu nguyen du lieu seed.
DROP INDEX IX_EXP_T4_Price ON dbo.Product_Variant;
DROP INDEX IX_EXP_T4_Product ON dbo.Product_Variant;
DROP INDEX IX_EXP_T4_PriceProduct ON dbo.Product_Variant;
DROP TABLE #T4Products;
DROP TABLE #T4Variants;
SELECT OBJECT_NAME(i.object_id) AS TableName, i.name AS IndexName, i.type_desc,
       i.is_unique, i.is_primary_key
FROM sys.indexes AS i
WHERE i.object_id = OBJECT_ID(N'dbo.Product_Variant') AND i.index_id > 0
ORDER BY i.index_id;

SELECT COUNT_BIG(*) AS VariantCountAfterT4 FROM dbo.Product_Variant;
