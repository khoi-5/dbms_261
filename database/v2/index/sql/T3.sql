-- BKPEE INDEXING | SQL Server | T3 - Thu tu khoa (Seller,Name) va (Name,Seller)
-- CHI thuc hien tren BKPEE_INDEX_DB. Khong sua BKPEE_DB goc.
-- F5 toan bo file trong SSMS. 1 warmup + 3 lan do moi cau hinh.
-- Xem tab Messages de lay so do; median cua 3 lan do.
USE BKPEE_INDEX_DB;
GO
SET NOCOUNT ON;
IF DB_NAME() <> N'BKPEE_INDEX_DB' THROW 51000, 'Wrong database.', 1;
IF (SELECT COUNT_BIG(*) FROM dbo.Product_Variant) NOT IN (10000,50000)
    THROW 51001, 'Can seed 10K hoac 50K truoc.', 1;

-- 1. Index tren Product, khong phai Product_Variant.
SELECT OBJECT_NAME(i.object_id) AS TableName, i.name AS IndexName, i.type_desc,
       i.is_unique, i.is_primary_key
FROM sys.indexes AS i
WHERE i.object_id = OBJECT_ID(N'dbo.Product') AND i.index_id > 0
ORDER BY i.index_id;

IF EXISTS (SELECT 1 FROM sys.indexes WHERE object_id=OBJECT_ID(N'dbo.Product') AND name=N'IX_EXP_T3_SellerName')
    DROP INDEX IX_EXP_T3_SellerName ON dbo.Product;
IF EXISTS (SELECT 1 FROM sys.indexes WHERE object_id=OBJECT_ID(N'dbo.Product') AND name=N'IX_EXP_T3_NameSeller')
    DROP INDEX IX_EXP_T3_NameSeller ON dbo.Product;
SET STATISTICS TIME ON;
SET STATISTICS IO ON;
PRINT 'T3 | BASELINE | EQ_SELLER | WARMUP';
SELECT Product_ID, Seller_ID, Product_Name FROM dbo.Product WHERE Seller_ID=2 ORDER BY Product_Name ASC, Product_ID ASC;
PRINT 'T3 | BASELINE | EQ_SELLER | RUN 1';
SELECT Product_ID, Seller_ID, Product_Name FROM dbo.Product WHERE Seller_ID=2 ORDER BY Product_Name ASC, Product_ID ASC;
PRINT 'T3 | BASELINE | EQ_SELLER | RUN 2';
SELECT Product_ID, Seller_ID, Product_Name FROM dbo.Product WHERE Seller_ID=2 ORDER BY Product_Name ASC, Product_ID ASC;
PRINT 'T3 | BASELINE | EQ_SELLER | RUN 3';
SELECT Product_ID, Seller_ID, Product_Name FROM dbo.Product WHERE Seller_ID=2 ORDER BY Product_Name ASC, Product_ID ASC;
PRINT 'T3 | BASELINE | MULTI_SELLER | WARMUP';
SELECT Product_ID, Seller_ID, Product_Name FROM dbo.Product WHERE Seller_ID BETWEEN 2 AND 51 ORDER BY Product_Name ASC, Product_ID ASC;
PRINT 'T3 | BASELINE | MULTI_SELLER | RUN 1';
SELECT Product_ID, Seller_ID, Product_Name FROM dbo.Product WHERE Seller_ID BETWEEN 2 AND 51 ORDER BY Product_Name ASC, Product_ID ASC;
PRINT 'T3 | BASELINE | MULTI_SELLER | RUN 2';
SELECT Product_ID, Seller_ID, Product_Name FROM dbo.Product WHERE Seller_ID BETWEEN 2 AND 51 ORDER BY Product_Name ASC, Product_ID ASC;
PRINT 'T3 | BASELINE | MULTI_SELLER | RUN 3';
SELECT Product_ID, Seller_ID, Product_Name FROM dbo.Product WHERE Seller_ID BETWEEN 2 AND 51 ORDER BY Product_Name ASC, Product_ID ASC;

-- Tao (Seller_ID, Product_Name): tot cho loc chinh xac 1 seller.
CREATE NONCLUSTERED INDEX IX_EXP_T3_SellerName ON dbo.Product(Seller_ID, Product_Name);
SELECT OBJECT_NAME(i.object_id) AS TableName, i.name AS IndexName, i.type_desc,
       i.is_unique, i.is_primary_key
FROM sys.indexes AS i
WHERE i.object_id = OBJECT_ID(N'dbo.Product') AND i.index_id > 0
ORDER BY i.index_id;
PRINT 'T3 | SELLER_NAME | EQ_SELLER | WARMUP';
SELECT Product_ID, Seller_ID, Product_Name FROM dbo.Product WHERE Seller_ID=2 ORDER BY Product_Name ASC, Product_ID ASC;
PRINT 'T3 | SELLER_NAME | EQ_SELLER | RUN 1';
SELECT Product_ID, Seller_ID, Product_Name FROM dbo.Product WHERE Seller_ID=2 ORDER BY Product_Name ASC, Product_ID ASC;
PRINT 'T3 | SELLER_NAME | EQ_SELLER | RUN 2';
SELECT Product_ID, Seller_ID, Product_Name FROM dbo.Product WHERE Seller_ID=2 ORDER BY Product_Name ASC, Product_ID ASC;
PRINT 'T3 | SELLER_NAME | EQ_SELLER | RUN 3';
SELECT Product_ID, Seller_ID, Product_Name FROM dbo.Product WHERE Seller_ID=2 ORDER BY Product_Name ASC, Product_ID ASC;
PRINT 'T3 | SELLER_NAME | MULTI_SELLER | WARMUP';
SELECT Product_ID, Seller_ID, Product_Name FROM dbo.Product WHERE Seller_ID BETWEEN 2 AND 51 ORDER BY Product_Name ASC, Product_ID ASC;
PRINT 'T3 | SELLER_NAME | MULTI_SELLER | RUN 1';
SELECT Product_ID, Seller_ID, Product_Name FROM dbo.Product WHERE Seller_ID BETWEEN 2 AND 51 ORDER BY Product_Name ASC, Product_ID ASC;
PRINT 'T3 | SELLER_NAME | MULTI_SELLER | RUN 2';
SELECT Product_ID, Seller_ID, Product_Name FROM dbo.Product WHERE Seller_ID BETWEEN 2 AND 51 ORDER BY Product_Name ASC, Product_ID ASC;
PRINT 'T3 | SELLER_NAME | MULTI_SELLER | RUN 3';
SELECT Product_ID, Seller_ID, Product_Name FROM dbo.Product WHERE Seller_ID BETWEEN 2 AND 51 ORDER BY Product_Name ASC, Product_ID ASC;

-- Doi thu tu, KHONG de hai index thu nghiem ton tai dong thoi.
DROP INDEX IX_EXP_T3_SellerName ON dbo.Product;
CREATE NONCLUSTERED INDEX IX_EXP_T3_NameSeller ON dbo.Product(Product_Name, Seller_ID);
SELECT OBJECT_NAME(i.object_id) AS TableName, i.name AS IndexName, i.type_desc,
       i.is_unique, i.is_primary_key
FROM sys.indexes AS i
WHERE i.object_id = OBJECT_ID(N'dbo.Product') AND i.index_id > 0
ORDER BY i.index_id;
PRINT 'T3 | NAME_SELLER | EQ_SELLER | WARMUP';
SELECT Product_ID, Seller_ID, Product_Name FROM dbo.Product WHERE Seller_ID=2 ORDER BY Product_Name ASC, Product_ID ASC;
PRINT 'T3 | NAME_SELLER | EQ_SELLER | RUN 1';
SELECT Product_ID, Seller_ID, Product_Name FROM dbo.Product WHERE Seller_ID=2 ORDER BY Product_Name ASC, Product_ID ASC;
PRINT 'T3 | NAME_SELLER | EQ_SELLER | RUN 2';
SELECT Product_ID, Seller_ID, Product_Name FROM dbo.Product WHERE Seller_ID=2 ORDER BY Product_Name ASC, Product_ID ASC;
PRINT 'T3 | NAME_SELLER | EQ_SELLER | RUN 3';
SELECT Product_ID, Seller_ID, Product_Name FROM dbo.Product WHERE Seller_ID=2 ORDER BY Product_Name ASC, Product_ID ASC;
PRINT 'T3 | NAME_SELLER | MULTI_SELLER | WARMUP';
SELECT Product_ID, Seller_ID, Product_Name FROM dbo.Product WHERE Seller_ID BETWEEN 2 AND 51 ORDER BY Product_Name ASC, Product_ID ASC;
PRINT 'T3 | NAME_SELLER | MULTI_SELLER | RUN 1';
SELECT Product_ID, Seller_ID, Product_Name FROM dbo.Product WHERE Seller_ID BETWEEN 2 AND 51 ORDER BY Product_Name ASC, Product_ID ASC;
PRINT 'T3 | NAME_SELLER | MULTI_SELLER | RUN 2';
SELECT Product_ID, Seller_ID, Product_Name FROM dbo.Product WHERE Seller_ID BETWEEN 2 AND 51 ORDER BY Product_Name ASC, Product_ID ASC;
PRINT 'T3 | NAME_SELLER | MULTI_SELLER | RUN 3';
SELECT Product_ID, Seller_ID, Product_Name FROM dbo.Product WHERE Seller_ID BETWEEN 2 AND 51 ORDER BY Product_Name ASC, Product_ID ASC;

SET STATISTICS TIME OFF;
SET STATISTICS IO OFF;
DROP INDEX IX_EXP_T3_NameSeller ON dbo.Product;
-- Kiem tra index da duoc don.
SELECT OBJECT_NAME(i.object_id) AS TableName, i.name AS IndexName, i.type_desc,
       i.is_unique, i.is_primary_key
FROM sys.indexes AS i
WHERE i.object_id = OBJECT_ID(N'dbo.Product') AND i.index_id > 0
ORDER BY i.index_id;
