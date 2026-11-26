-- BKPEE | SQL INDEXING DEMO | T1: Do thoi gian CREATE INDEX Price
USE BKPEE_INDEX_DB;
GO
SET NOCOUNT ON;
IF DB_NAME() <> N'BKPEE_INDEX_DB' THROW 51000, 'Sai database.', 1;
IF (SELECT COUNT_BIG(*) FROM dbo.Product_Variant) NOT IN (10000, 50000)
    THROW 51001, 'Can nap seed Indexing 10K hoac 50K truoc.', 1;

-- 1. Index hien tai
SELECT i.name AS IndexName, i.type_desc, i.is_primary_key, i.is_unique
FROM sys.indexes AS i
WHERE i.object_id = OBJECT_ID(N'dbo.Product_Variant') AND i.index_id > 0
ORDER BY i.index_id;

-- 2. Don index T1 cu (neu con), khong dung vao index khac.
DROP INDEX IF EXISTS IX_EXP_T1_Price ON dbo.Product_Variant;

-- 3. Do CREATE INDEX DUY NHAT 1 LAN
DECLARE @start DATETIME2(7) = SYSUTCDATETIME();
CREATE NONCLUSTERED INDEX IX_EXP_T1_Price ON dbo.Product_Variant(Price);
SELECT CAST(DATEDIFF_BIG(MICROSECOND, @start, SYSUTCDATETIME()) / 1000.0 AS DECIMAL(18,3)) AS CreateIndexMs;

-- 4. Xem index vua tao va dung luong
SELECT i.name AS IndexName, i.type_desc, i.is_primary_key, i.is_unique
FROM sys.indexes AS i
WHERE i.object_id = OBJECT_ID(N'dbo.Product_Variant') AND i.index_id > 0
ORDER BY i.index_id;
SELECT i.name AS IndexName, SUM(ps.reserved_page_count)*8 AS ReservedKiB
FROM sys.indexes AS i
JOIN sys.dm_db_partition_stats AS ps ON ps.object_id=i.object_id AND ps.index_id=i.index_id
WHERE i.object_id=OBJECT_ID(N'dbo.Product_Variant') AND i.name=N'IX_EXP_T1_Price'
GROUP BY i.name;

-- 5. Don index T1 va kiem tra lan cuoi
DROP INDEX IX_EXP_T1_Price ON dbo.Product_Variant;
SELECT i.name AS IndexName, i.type_desc, i.is_primary_key, i.is_unique
FROM sys.indexes AS i
WHERE i.object_id = OBJECT_ID(N'dbo.Product_Variant') AND i.index_id > 0
ORDER BY i.index_id;
