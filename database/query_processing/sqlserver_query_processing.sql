-- ==============================================================================
-- BTL HỆ QUẢN TRỊ CSDL (DBMS) - M5: QUERY PROCESSING BENCHMARK (SQL SERVER)
-- File: sqlserver_query_processing.sql
-- Mục đích: Thực nghiệm & phân tích Query Processing trên SQL Server cho F06, F07, F13
-- Cách chạy: Mở trong SSMS -> Bật "Include Actual Execution Plan" (Ctrl+M) -> Execute
-- ==============================================================================

USE BKPEE_DB;
GO

SET STATISTICS IO ON;
SET STATISTICS TIME ON;
GO

PRINT N'======================================================================';
PRINT N'Q1 (F07): THỐNG KÊ DOANH THU SELLER THEO THÁNG (JOIN + GROUP BY + SUM)';
PRINT N'======================================================================';

-- Q1a: Thống kê doanh thu theo tháng của Seller #2 (chỉ tính đơn DELIVERED)
SELECT
    YEAR(o.Order_Time) AS OrderYear,
    MONTH(o.Order_Time) AS OrderMonth,
    COUNT(DISTINCT so.Shop_Order_ID) AS TotalOrders,
    SUM(CAST(soi.Quantity AS BIGINT)) AS TotalItemsSold,
    SUM(CAST(soi.Quantity AS DECIMAL(18,2)) * soi.Purchase_Price) AS MonthlyRevenue
FROM Shop_Order so
JOIN [Order] o ON o.Order_ID = so.Order_ID
JOIN Shop_Order_Item soi ON soi.Shop_Order_ID = so.Shop_Order_ID
WHERE so.Seller_ID = 2
  AND so.Delivery_Status = N'DELIVERED'
  AND o.Order_Time >= '2026-01-01' AND o.Order_Time < '2027-01-01'
GROUP BY YEAR(o.Order_Time), MONTH(o.Order_Time)
ORDER BY OrderYear ASC, OrderMonth ASC;
GO

-- Q1b: Bảng xếp hạng Top 10 Seller theo doanh thu DELIVERED (tương đương MongoDB Query 1)
SELECT TOP 10
    so.Seller_ID,
    s.Shop_Name,
    COUNT(DISTINCT so.Shop_Order_ID) AS TotalDeliveredOrders,
    SUM(CAST(soi.Quantity AS DECIMAL(18,2)) * soi.Purchase_Price) AS TotalRevenue
FROM Shop_Order so
JOIN Seller s ON s.Account_ID = so.Seller_ID
JOIN Shop_Order_Item soi ON soi.Shop_Order_ID = so.Shop_Order_ID
WHERE so.Delivery_Status = N'DELIVERED'
GROUP BY so.Seller_ID, s.Shop_Name
ORDER BY TotalRevenue DESC;
GO

PRINT N'======================================================================';
PRINT N'Q2 (F13): THỐNG KÊ CHI TIÊU BUYER THEO DANH MỤC (6-TABLE JOIN + GROUP BY)';
PRINT N'======================================================================';

-- Q2: Tổng chi tiêu của Buyer #5 gom theo Category (loại trừ đơn hủy/hoàn trả)
SELECT
    c.Category_ID,
    c.Category_Name,
    c.Target_Type,
    COUNT(DISTINCT o.Order_ID) AS OrderCount,
    SUM(CAST(soi.Quantity AS BIGINT)) AS ItemsPurchased,
    SUM(CAST(soi.Quantity AS DECIMAL(18,2)) * soi.Purchase_Price) AS TotalSpent
FROM [Order] o
JOIN Shop_Order so ON so.Order_ID = o.Order_ID
JOIN Shop_Order_Item soi ON soi.Shop_Order_ID = so.Shop_Order_ID
JOIN Product_Variant pv ON pv.Variant_ID = soi.Variant_ID
JOIN Product p ON p.Product_ID = pv.Product_ID
JOIN Category c ON c.Category_ID = p.Category_ID
WHERE o.Buyer_ID = 5
  AND so.Delivery_Status NOT IN (N'CANCELLED', N'RETURNED')
GROUP BY c.Category_ID, c.Category_Name, c.Target_Type
ORDER BY TotalSpent DESC;
GO

PRINT N'======================================================================';
PRINT N'Q3 (F06): SO SÁNH KẾ HOẠCH THỰC THI SUBQUERY (EXISTS vs IN vs JOIN)';
PRINT N'======================================================================';

-- Q3a: Correlated EXISTS Subquery (Semi-Join trong SQL Server Optimizer)
SELECT
    pv.Variant_ID,
    p.Product_Name,
    pv.Variant_Name,
    pv.Price
FROM Product_Variant pv
JOIN Product p ON p.Product_ID = pv.Product_ID
WHERE pv.Is_Active = 1
  AND pv.Quantity_Stock > 0
  AND EXISTS (
      SELECT 1
      FROM Promotion_Apply pa
      JOIN Promotion pr ON pr.Promotion_ID = pa.Promotion_ID
      WHERE pa.Variant_ID = pv.Variant_ID
        AND pr.Quantity > 0
        AND SYSDATETIME() BETWEEN pr.Start_Date AND pr.Expiration_Date
  )
ORDER BY pv.Variant_ID;
GO

-- Q3b: IN Subquery tương đương về ngữ nghĩa
SELECT
    pv.Variant_ID,
    p.Product_Name,
    pv.Variant_Name,
    pv.Price
FROM Product_Variant pv
JOIN Product p ON p.Product_ID = pv.Product_ID
WHERE pv.Is_Active = 1
  AND pv.Quantity_Stock > 0
  AND pv.Variant_ID IN (
      SELECT pa.Variant_ID
      FROM Promotion_Apply pa
      JOIN Promotion pr ON pr.Promotion_ID = pa.Promotion_ID
      WHERE pr.Quantity > 0
        AND SYSDATETIME() BETWEEN pr.Start_Date AND pr.Expiration_Date
  )
ORDER BY pv.Variant_ID;
GO

-- Q3c: Viết lại bằng INNER JOIN + DISTINCT để so sánh chi phí Sort/Hash Distinct
SELECT DISTINCT
    pv.Variant_ID,
    p.Product_Name,
    pv.Variant_Name,
    pv.Price
FROM Product_Variant pv
JOIN Product p ON p.Product_ID = pv.Product_ID
JOIN Promotion_Apply pa ON pa.Variant_ID = pv.Variant_ID
JOIN Promotion pr ON pr.Promotion_ID = pa.Promotion_ID
WHERE pv.Is_Active = 1
  AND pv.Quantity_Stock > 0
  AND pr.Quantity > 0
  AND SYSDATETIME() BETWEEN pr.Start_Date AND pr.Expiration_Date
ORDER BY pv.Variant_ID;
GO

PRINT N'======================================================================';
PRINT N'Q4: THỬ NGHIỆM TỐI ƯU HÓA QUERY PROCESSING BẰNG COVERING INDEX';
PRINT N'======================================================================';
-- Ghi lại Logical Reads của Q1a trước khi tạo index, sau đó chạy lệnh bên dưới và đo lại Q1a:
/*
CREATE NONCLUSTERED INDEX IX_ShopOrder_Seller_Status_Order
ON Shop_Order (Seller_ID, Delivery_Status, Order_ID)
INCLUDE (Shipping_Fee);

CREATE NONCLUSTERED INDEX IX_ShopOrderItem_ShopOrder_Cover
ON Shop_Order_Item (Shop_Order_ID)
INCLUDE (Quantity, Purchase_Price, Variant_ID);
*/

SET STATISTICS IO OFF;
SET STATISTICS TIME OFF;
GO
