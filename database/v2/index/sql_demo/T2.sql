-- BKPEE | SQL INDEXING DEMO | T2: Sap xep gia truoc / sau index
USE BKPEE_INDEX_DB;
GO
SET NOCOUNT ON;
IF DB_NAME() <> N'BKPEE_INDEX_DB' THROW 51000, 'Sai database.', 1;
IF (SELECT COUNT_BIG(*) FROM dbo.Product_Variant) NOT IN (10000, 50000)
    THROW 51001, 'Can nap seed Indexing 10K hoac 50K truoc.', 1;

-- Ctrl+M truoc F5 de xem Actual Execution Plan (neu can).
-- SORT_ALL hien thi 10K/50K dong, co the mat thoi gian hien thi tren SSMS.
-- Xem CPU time / elapsed time va logical reads trong tab Messages.
SELECT i.name AS IndexName, i.type_desc, i.is_primary_key, i.is_unique
FROM sys.indexes AS i
WHERE i.object_id = OBJECT_ID(N'dbo.Product_Variant') AND i.index_id > 0
ORDER BY i.index_id;
DROP INDEX IF EXISTS IX_EXP_T2_Price ON dbo.Product_Variant;
SET STATISTICS TIME ON;
SET STATISTICS IO ON;

PRINT 'T2 | BEFORE | SORT_ALL';
SELECT Variant_ID, Price FROM dbo.Product_Variant ORDER BY Price ASC, Variant_ID ASC;

PRINT 'T2 | BEFORE | TOP100_ASC';
SELECT TOP (100) Variant_ID, Price FROM dbo.Product_Variant ORDER BY Price ASC, Variant_ID ASC;

PRINT 'T2 | BEFORE | TOP100_DESC';
SELECT TOP (100) Variant_ID, Price FROM dbo.Product_Variant ORDER BY Price DESC, Variant_ID DESC;

-- Tao index gia
CREATE NONCLUSTERED INDEX IX_EXP_T2_Price ON dbo.Product_Variant(Price);
SELECT i.name AS IndexName, i.type_desc, i.is_primary_key, i.is_unique
FROM sys.indexes AS i
WHERE i.object_id = OBJECT_ID(N'dbo.Product_Variant') AND i.index_id > 0
ORDER BY i.index_id;

PRINT 'T2 | AFTER | SORT_ALL';
SELECT Variant_ID, Price FROM dbo.Product_Variant ORDER BY Price ASC, Variant_ID ASC;

PRINT 'T2 | AFTER | TOP100_ASC';
SELECT TOP (100) Variant_ID, Price FROM dbo.Product_Variant ORDER BY Price ASC, Variant_ID ASC;

PRINT 'T2 | AFTER | TOP100_DESC';
SELECT TOP (100) Variant_ID, Price FROM dbo.Product_Variant ORDER BY Price DESC, Variant_ID DESC;

SET STATISTICS TIME OFF;
SET STATISTICS IO OFF;
DROP INDEX IX_EXP_T2_Price ON dbo.Product_Variant;
SELECT i.name AS IndexName, i.type_desc, i.is_primary_key, i.is_unique
FROM sys.indexes AS i
WHERE i.object_id = OBJECT_ID(N'dbo.Product_Variant') AND i.index_id > 0
ORDER BY i.index_id;
