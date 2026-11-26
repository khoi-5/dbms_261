-- BKPEE | SQL INDEXING DEMO | T3: Thu tu cot trong composite index

USE BKPEE_INDEX_DB;
GO
SET NOCOUNT ON;
IF DB_NAME() <> N'BKPEE_INDEX_DB' THROW 51000, 'Sai database.', 1;
IF (SELECT COUNT_BIG(*) FROM dbo.Product_Variant) NOT IN (10000, 50000)
    THROW 51001, 'Can nap seed Indexing 10K hoac 50K truoc.', 1;

-- 3 cau hinh: baseline, (Seller_ID, Product_Name), (Product_Name, Seller_ID)
-- Moi cau truy van chi chay 1 lan / cau hinh.
SELECT i.name AS IndexName, i.type_desc, i.is_primary_key, i.is_unique
FROM sys.indexes AS i
WHERE i.object_id = OBJECT_ID(N'dbo.Product') AND i.index_id > 0
ORDER BY i.index_id;
DROP INDEX IF EXISTS IX_EXP_T3_SellerName ON dbo.Product;
DROP INDEX IF EXISTS IX_EXP_T3_NameSeller ON dbo.Product;
SET STATISTICS TIME ON;
SET STATISTICS IO ON;

PRINT 'T3 | BASELINE | EQ_SELLER';
SELECT Product_ID, Seller_ID, Product_Name FROM dbo.Product WHERE Seller_ID = 2 ORDER BY Product_Name ASC, Product_ID ASC;

PRINT 'T3 | BASELINE | MULTI_SELLER';
SELECT Product_ID, Seller_ID, Product_Name FROM dbo.Product WHERE Seller_ID BETWEEN 2 AND 51 ORDER BY Product_Name ASC, Product_ID ASC;

CREATE NONCLUSTERED INDEX IX_EXP_T3_SellerName ON dbo.Product(Seller_ID, Product_Name);
SELECT i.name AS IndexName, i.type_desc, i.is_primary_key, i.is_unique
FROM sys.indexes AS i
WHERE i.object_id = OBJECT_ID(N'dbo.Product') AND i.index_id > 0
ORDER BY i.index_id;

PRINT 'T3 | SELLER_NAME | EQ_SELLER';
SELECT Product_ID, Seller_ID, Product_Name FROM dbo.Product WHERE Seller_ID = 2 ORDER BY Product_Name ASC, Product_ID ASC;

PRINT 'T3 | SELLER_NAME | MULTI_SELLER';
SELECT Product_ID, Seller_ID, Product_Name FROM dbo.Product WHERE Seller_ID BETWEEN 2 AND 51 ORDER BY Product_Name ASC, Product_ID ASC;

DROP INDEX IX_EXP_T3_SellerName ON dbo.Product;
CREATE NONCLUSTERED INDEX IX_EXP_T3_NameSeller ON dbo.Product(Product_Name, Seller_ID);
SELECT i.name AS IndexName, i.type_desc, i.is_primary_key, i.is_unique
FROM sys.indexes AS i
WHERE i.object_id = OBJECT_ID(N'dbo.Product') AND i.index_id > 0
ORDER BY i.index_id;

PRINT 'T3 | NAME_SELLER | EQ_SELLER';
SELECT Product_ID, Seller_ID, Product_Name FROM dbo.Product WHERE Seller_ID = 2 ORDER BY Product_Name ASC, Product_ID ASC;

PRINT 'T3 | NAME_SELLER | MULTI_SELLER';
SELECT Product_ID, Seller_ID, Product_Name FROM dbo.Product WHERE Seller_ID BETWEEN 2 AND 51 ORDER BY Product_Name ASC, Product_ID ASC;

SET STATISTICS TIME OFF;
SET STATISTICS IO OFF;
DROP INDEX IX_EXP_T3_NameSeller ON dbo.Product;
SELECT i.name AS IndexName, i.type_desc, i.is_primary_key, i.is_unique
FROM sys.indexes AS i
WHERE i.object_id = OBJECT_ID(N'dbo.Product') AND i.index_id > 0
ORDER BY i.index_id;
