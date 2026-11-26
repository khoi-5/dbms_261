-- BKPEE INDEXING | SQL Server | T1 - Thoi gian tao va dung luong index Price
-- CHI thuc hien tren BKPEE_INDEX_DB. Khong sua BKPEE_DB goc.
-- F5 toan bo file trong SSMS. 1 warmup + 3 lan do moi cau hinh.
-- Xem tab Messages de lay so do; median cua 3 lan do.
USE BKPEE_INDEX_DB;
GO
SET NOCOUNT ON;
IF DB_NAME() <> N'BKPEE_INDEX_DB' THROW 51000, 'Wrong database.', 1;
IF (SELECT COUNT_BIG(*) FROM dbo.Product_Variant) NOT IN (10000,50000)
    THROW 51001, 'Can seed 10K hoac 50K truoc.', 1;

-- 1. Kiem tra index tren Product_Variant
SELECT OBJECT_NAME(i.object_id) AS TableName, i.name AS IndexName, i.type_desc,
       i.is_unique, i.is_primary_key
FROM sys.indexes AS i
WHERE i.object_id = OBJECT_ID(N'dbo.Product_Variant') AND i.index_id > 0
ORDER BY i.index_id;

-- 2. Chay 1 warmup + 3 lan do CREATE INDEX; moi lan xoa index sau do.
-- Index thu nghiem la IX_EXP_T1_Price, khong xoa index khac.
IF EXISTS (SELECT 1 FROM sys.indexes WHERE object_id=OBJECT_ID(N'dbo.Product_Variant') AND name=N'IX_EXP_T1_Price')
    DROP INDEX IX_EXP_T1_Price ON dbo.Product_Variant;
DECLARE @run INT=0, @start DATETIME2(7), @microseconds BIGINT;
WHILE @run <= 3
BEGIN
    SET @start=SYSUTCDATETIME();
    CREATE NONCLUSTERED INDEX IX_EXP_T1_Price ON dbo.Product_Variant(Price);
    SET @microseconds=DATEDIFF_BIG(MICROSECOND,@start,SYSUTCDATETIME());
    PRINT CONCAT('T1 | ',CASE WHEN @run=0 THEN 'WARMUP' ELSE CONCAT('RUN ',@run) END,
                 ' | CreateIndexMs=',CAST(@microseconds/1000.0 AS DECIMAL(18,3)));
    IF @run=3
    BEGIN
        SELECT i.name, SUM(ps.reserved_page_count)*8 AS ReservedKiB
        FROM sys.indexes AS i
        JOIN sys.dm_db_partition_stats AS ps ON ps.object_id=i.object_id AND ps.index_id=i.index_id
        WHERE i.object_id=OBJECT_ID(N'dbo.Product_Variant') AND i.name=N'IX_EXP_T1_Price'
        GROUP BY i.name;
    END;
    DROP INDEX IX_EXP_T1_Price ON dbo.Product_Variant;
    SET @run += 1;
END;
-- 3. Kiem tra index sau khi don: khong con IX_EXP_T1_Price.
SELECT OBJECT_NAME(i.object_id) AS TableName, i.name AS IndexName, i.type_desc,
       i.is_unique, i.is_primary_key
FROM sys.indexes AS i
WHERE i.object_id = OBJECT_ID(N'dbo.Product_Variant') AND i.index_id > 0
ORDER BY i.index_id;
