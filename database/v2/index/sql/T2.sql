-- BKPEE INDEXING | SQL Server | T2 - SORT_ALL, TOP100 ASC/DESC truoc/sau Price index
-- CHI thuc hien tren BKPEE_INDEX_DB. Khong sua BKPEE_DB goc.
-- F5 toan bo file trong SSMS. 1 warmup + 3 lan do moi cau hinh.
-- Xem tab Messages de lay so do; median cua 3 lan do.
USE BKPEE_INDEX_DB;
GO
SET NOCOUNT ON;
IF DB_NAME() <> N'BKPEE_INDEX_DB' THROW 51000, 'Wrong database.', 1;
IF (SELECT COUNT_BIG(*) FROM dbo.Product_Variant) NOT IN (10000,50000)
    THROW 51001, 'Can seed 10K hoac 50K truoc.', 1;

-- 1. Kiem tra index hien tai; xoa CHI index T2 neu lan chay truoc con sot.
SELECT OBJECT_NAME(i.object_id) AS TableName, i.name AS IndexName, i.type_desc,
       i.is_unique, i.is_primary_key
FROM sys.indexes AS i
WHERE i.object_id = OBJECT_ID(N'dbo.Product_Variant') AND i.index_id > 0
ORDER BY i.index_id;

IF EXISTS (SELECT 1 FROM sys.indexes WHERE object_id=OBJECT_ID(N'dbo.Product_Variant') AND name=N'IX_EXP_T2_Price')
    DROP INDEX IX_EXP_T2_Price ON dbo.Product_Variant;

-- 2. Mo Ctrl+M (Include Actual Execution Plan) NEU can chup plan.
-- SET STATISTICS TIME/IO in so do SQL Server trong tab Messages.
-- SORT_ALL tra ve 10K/50K dong moi lan, SSMS co the hien thi lau.
SET STATISTICS TIME ON;
SET STATISTICS IO ON;

-- BEFORE: warmup 1 lan + 3 lan do. Moi cau SELECT tra ve du ket qua.
PRINT 'T2 | BEFORE | SORT_ALL | WARMUP';
SELECT Variant_ID, Price FROM dbo.Product_Variant ORDER BY Price ASC, Variant_ID ASC;
PRINT 'T2 | BEFORE | SORT_ALL | RUN 1';
SELECT Variant_ID, Price FROM dbo.Product_Variant ORDER BY Price ASC, Variant_ID ASC;
PRINT 'T2 | BEFORE | SORT_ALL | RUN 2';
SELECT Variant_ID, Price FROM dbo.Product_Variant ORDER BY Price ASC, Variant_ID ASC;
PRINT 'T2 | BEFORE | SORT_ALL | RUN 3';
SELECT Variant_ID, Price FROM dbo.Product_Variant ORDER BY Price ASC, Variant_ID ASC;
PRINT 'T2 | BEFORE | TOP100_ASC | WARMUP';
SELECT TOP (100) Variant_ID, Price FROM dbo.Product_Variant ORDER BY Price ASC, Variant_ID ASC;
PRINT 'T2 | BEFORE | TOP100_ASC | RUN 1';
SELECT TOP (100) Variant_ID, Price FROM dbo.Product_Variant ORDER BY Price ASC, Variant_ID ASC;
PRINT 'T2 | BEFORE | TOP100_ASC | RUN 2';
SELECT TOP (100) Variant_ID, Price FROM dbo.Product_Variant ORDER BY Price ASC, Variant_ID ASC;
PRINT 'T2 | BEFORE | TOP100_ASC | RUN 3';
SELECT TOP (100) Variant_ID, Price FROM dbo.Product_Variant ORDER BY Price ASC, Variant_ID ASC;
PRINT 'T2 | BEFORE | TOP100_DESC | WARMUP';
SELECT TOP (100) Variant_ID, Price FROM dbo.Product_Variant ORDER BY Price DESC, Variant_ID DESC;
PRINT 'T2 | BEFORE | TOP100_DESC | RUN 1';
SELECT TOP (100) Variant_ID, Price FROM dbo.Product_Variant ORDER BY Price DESC, Variant_ID DESC;
PRINT 'T2 | BEFORE | TOP100_DESC | RUN 2';
SELECT TOP (100) Variant_ID, Price FROM dbo.Product_Variant ORDER BY Price DESC, Variant_ID DESC;
PRINT 'T2 | BEFORE | TOP100_DESC | RUN 3';
SELECT TOP (100) Variant_ID, Price FROM dbo.Product_Variant ORDER BY Price DESC, Variant_ID DESC;

-- 4. Tao index gia, xem danh sach index truoc khi do AFTER.
CREATE NONCLUSTERED INDEX IX_EXP_T2_Price ON dbo.Product_Variant(Price);
SELECT OBJECT_NAME(i.object_id) AS TableName, i.name AS IndexName, i.type_desc,
       i.is_unique, i.is_primary_key
FROM sys.indexes AS i
WHERE i.object_id = OBJECT_ID(N'dbo.Product_Variant') AND i.index_id > 0
ORDER BY i.index_id;

-- AFTER: warmup 1 lan + 3 lan do. Moi cau SELECT tra ve du ket qua.
PRINT 'T2 | AFTER | SORT_ALL | WARMUP';
SELECT Variant_ID, Price FROM dbo.Product_Variant ORDER BY Price ASC, Variant_ID ASC;
PRINT 'T2 | AFTER | SORT_ALL | RUN 1';
SELECT Variant_ID, Price FROM dbo.Product_Variant ORDER BY Price ASC, Variant_ID ASC;
PRINT 'T2 | AFTER | SORT_ALL | RUN 2';
SELECT Variant_ID, Price FROM dbo.Product_Variant ORDER BY Price ASC, Variant_ID ASC;
PRINT 'T2 | AFTER | SORT_ALL | RUN 3';
SELECT Variant_ID, Price FROM dbo.Product_Variant ORDER BY Price ASC, Variant_ID ASC;
PRINT 'T2 | AFTER | TOP100_ASC | WARMUP';
SELECT TOP (100) Variant_ID, Price FROM dbo.Product_Variant ORDER BY Price ASC, Variant_ID ASC;
PRINT 'T2 | AFTER | TOP100_ASC | RUN 1';
SELECT TOP (100) Variant_ID, Price FROM dbo.Product_Variant ORDER BY Price ASC, Variant_ID ASC;
PRINT 'T2 | AFTER | TOP100_ASC | RUN 2';
SELECT TOP (100) Variant_ID, Price FROM dbo.Product_Variant ORDER BY Price ASC, Variant_ID ASC;
PRINT 'T2 | AFTER | TOP100_ASC | RUN 3';
SELECT TOP (100) Variant_ID, Price FROM dbo.Product_Variant ORDER BY Price ASC, Variant_ID ASC;
PRINT 'T2 | AFTER | TOP100_DESC | WARMUP';
SELECT TOP (100) Variant_ID, Price FROM dbo.Product_Variant ORDER BY Price DESC, Variant_ID DESC;
PRINT 'T2 | AFTER | TOP100_DESC | RUN 1';
SELECT TOP (100) Variant_ID, Price FROM dbo.Product_Variant ORDER BY Price DESC, Variant_ID DESC;
PRINT 'T2 | AFTER | TOP100_DESC | RUN 2';
SELECT TOP (100) Variant_ID, Price FROM dbo.Product_Variant ORDER BY Price DESC, Variant_ID DESC;
PRINT 'T2 | AFTER | TOP100_DESC | RUN 3';
SELECT TOP (100) Variant_ID, Price FROM dbo.Product_Variant ORDER BY Price DESC, Variant_ID DESC;

SET STATISTICS TIME OFF;
SET STATISTICS IO OFF;
-- 5. Xoa CHI index T2, kiem tra lai index.
DROP INDEX IX_EXP_T2_Price ON dbo.Product_Variant;
SELECT OBJECT_NAME(i.object_id) AS TableName, i.name AS IndexName, i.type_desc,
       i.is_unique, i.is_primary_key
FROM sys.indexes AS i
WHERE i.object_id = OBJECT_ID(N'dbo.Product_Variant') AND i.index_id > 0
ORDER BY i.index_id;
