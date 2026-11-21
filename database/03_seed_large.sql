USE BKPEE_DB;
GO

SET XACT_ABORT ON;
DECLARE @SeedTime DATETIME2 = '2026-10-30T00:00:00';
BEGIN TRY
BEGIN TRANSACTION;
-- ==============================================================================
-- BTL HỆ QUẢN TRỊ CSDL (DBMS) - HỆ THỐNG TMĐT BKPEE
-- File: 03_seed_large.sql
-- Mục đích: Sinh dữ liệu lớn (High-Volume Seed Data: ~50.000+ records)
-- Dành cho: 
--   1. Đo lường hiệu năng Indexing (Index Seek vs Table Scan, so sánh I/O reads)
--   2. Đo lường xử lý truy vấn gom nhóm & hàm tổng hợp (GROUP BY, SUM, COUNT, AVG)
--   3. Minh chứng các thao tác nghiệp vụ nâng cao (Multi-table JOINs, Subqueries)
-- ==============================================================================


SET NOCOUNT ON;
PRINT N'==============================================================';
PRINT N'BẮT ĐẦU SINH DỮ LIỆU TRÊN DATABASE: ' + DB_NAME();
PRINT N'==============================================================';

-- ------------------------------------------------------------------------------
-- 1. Xóa sạch dữ liệu cũ trước khi nạp dữ liệu lớn
-- ------------------------------------------------------------------------------
PRINT N'[1/8] Làm sạch dữ liệu cũ...';
DELETE FROM Report_Image;
DELETE FROM Report;
DELETE FROM Evaluation_Image;
DELETE FROM Evaluation;
DELETE FROM Payment_Information;
DELETE FROM Shop_Order_Item;
DELETE FROM Shop_Order;
DELETE FROM [Order];
DELETE FROM Promotion_Apply;
DELETE FROM Voucher;
DELETE FROM Coupon;
DELETE FROM Promotion;
DELETE FROM Cart_Item;
DELETE FROM Cart;
DELETE FROM Product_Variant;
DELETE FROM Book_Author;
DELETE FROM Books;
DELETE FROM Clothes;
DELETE FROM Electronics;
DELETE FROM Product;
DELETE FROM Category;
DELETE FROM Shipping_Provider;
DELETE FROM Buyer_Infor;
DELETE FROM Buyer;
DELETE FROM Seller;
DELETE FROM Admin;
DELETE FROM [User];
DELETE FROM Account;

-- Reset giá trị tự tăng IDENTITY để các ID luôn bắt đầu chính xác từ 1
-- Xử lý an toàn tuyệt đối cả 2 trường hợp: Bảng mới tạo (last_value = NULL) và Bảng đã có dữ liệu cũ
DECLARE @reseedSql NVARCHAR(MAX) = N'';
SELECT @reseedSql += N'
IF (SELECT last_value FROM sys.identity_columns WHERE object_id = OBJECT_ID(''' + QUOTENAME(s.name) + N'.' + QUOTENAME(t.name) + N''')) IS NULL
    DBCC CHECKIDENT (''' + QUOTENAME(s.name) + N'.' + QUOTENAME(t.name) + N''', RESEED, 1) WITH NO_INFOMSGS;
ELSE
    DBCC CHECKIDENT (''' + QUOTENAME(s.name) + N'.' + QUOTENAME(t.name) + N''', RESEED, 0) WITH NO_INFOMSGS;
'
FROM sys.tables t
JOIN sys.schemas s ON t.schema_id = s.schema_id
JOIN sys.identity_columns c ON t.object_id = c.object_id;

EXEC sp_executesql @reseedSql;

-- ------------------------------------------------------------------------------
-- 2. Sinh Quản trị viên, Vận chuyển & Danh mục
-- ------------------------------------------------------------------------------
PRINT N'[2/8] Sinh Tài khoản Quản trị, Vận chuyển & Danh mục...';

-- Tạo Admin (Account_ID = 1) - Mật khẩu 12345678
INSERT INTO Account (Username, password, FName, LName, Phone, Account_Status, Email, Gender, avatar, Address, CCCD, Date_Of_Birth, Created_At, Created_By, Updated_At, Updated_By)
VALUES ('admin_root', '$2a$12$h1U/fVmlo3BtMYSWX7IseucGx96mQsrwnS1VcTBwm3hlIaAKxrtPe', N'Văn', N'Quản Trị', '0901000000', N'ACTIVE', 'admin@bkpee.vn', N'Nam', 'https://bkpee.vn/img/admin.png', N'Quận 10, TP.HCM', '079090000000', '1995-05-15', @SeedTime, 1, @SeedTime, 1);

INSERT INTO Admin (Account_ID, Admin_Role) VALUES (1, N'SUPER_ADMIN');

-- 10 Đơn vị vận chuyển
INSERT INTO Shipping_Provider (Provider_Name, Phone, Address, Admin_ID, Base_Shipping_Fee, Created_At, Created_By, Updated_At, Updated_By)
VALUES
(N'Giao Hàng Tiết Kiệm (GHTK)',     '19006092',   N'Tòa nhà VTV, Cầu Giấy, Hà Nội', 1, 22000, @SeedTime, 1, @SeedTime, 1),
(N'Giao Hàng Nhanh (GHN)',             '1900636677', N'Tân Bình, TP.HCM',                 1, 25000, @SeedTime, 1, @SeedTime, 1),
(N'Viettel Post',                       '19008095',   N'Ba Đình, Hà Nội',                 1, 20000, @SeedTime, 1, @SeedTime, 1),
(N'VNPost (Bưu Điện Việt Nam)',          '1900545481', N'Hoàn Kiếm, Hà Nội',              1, 18000, @SeedTime, 1, @SeedTime, 1),
(N'J&T Express',                        '19001088',   N'Bình Thạnh, TP.HCM',               1, 23000, @SeedTime, 1, @SeedTime, 1),
(N'Ninja Van',                          '1900886877', N'Quận 7, TP.HCM',                   1, 24000, @SeedTime, 1, @SeedTime, 1),
(N'BEST Express',                       '19001031',   N'Bình Tân, TP.HCM',                 1, 21000, @SeedTime, 1, @SeedTime, 1),
(N'Shopee Xpress (SPX)',                '19001221',   N'Thủ Đức, TP.HCM',                1, 19000, @SeedTime, 1, @SeedTime, 1),
(N'GrabExpress Siêu Tốc',              '19001555',   N'Quận 1, TP.HCM',                   1, 35000, @SeedTime, 1, @SeedTime, 1),
(N'Ahamove Giao Trong Ngày',            '1900545411', N'Quận 3, TP.HCM',                   1, 30000, @SeedTime, 1, @SeedTime, 1);

INSERT INTO Category (Category_Name, Parent_Category_ID, Target_Type, Admin_ID, Created_At, Created_By, Updated_At, Updated_By) VALUES
(N'Sách & Văn Phòng Phẩm', NULL, 'BOOK',        1, @SeedTime, 1, @SeedTime, 1),
(N'Thời Trang & May Mặc',   NULL, 'CLOTHES',     1, @SeedTime, 1, @SeedTime, 1),
(N'Thiết Bị Điện Tử',       NULL, 'ELECTRONICS', 1, @SeedTime, 1, @SeedTime, 1),
(N'Nhà Cửa & Đời Sống',    NULL, 'GENERAL',     1, @SeedTime, 1, @SeedTime, 1),
(N'Mẹ & Bé',               NULL, 'GENERAL',     1, @SeedTime, 1, @SeedTime, 1),
(N'Sức Khỏe & Sắc Đẹp',    NULL, 'GENERAL',     1, @SeedTime, 1, @SeedTime, 1),
(N'Thể Thao & Du Lịch',     NULL, 'GENERAL',     1, @SeedTime, 1, @SeedTime, 1),
(N'Ô Tô - Xe Máy',          NULL, 'GENERAL',     1, @SeedTime, 1, @SeedTime, 1),
(N'Bách Hóa Online',        NULL, 'GENERAL',     1, @SeedTime, 1, @SeedTime, 1),
(N'Đồ Chơi & Quà Tặng',     NULL, 'GENERAL',     1, @SeedTime, 1, @SeedTime, 1);

-- 20 Danh mục con (Category 11 -> 30)
INSERT INTO Category (Category_Name, Parent_Category_ID, Target_Type, Admin_ID, Created_At, Created_By, Updated_At, Updated_By) VALUES
(N'Sách Công Nghệ & Kỹ Thuật',  1, 'BOOK',        1, @SeedTime, 1, @SeedTime, 1),
(N'Sách Kinh Tế & Khởi Nghiệp', 1, 'BOOK',        1, @SeedTime, 1, @SeedTime, 1),
(N'Truyện Tranh & Manga',        1, 'BOOK',        1, @SeedTime, 1, @SeedTime, 1),
(N'Áo Thun Nam Nữ',              2, 'CLOTHES',     1, @SeedTime, 1, @SeedTime, 1),
(N'Quần Jeans & Kaki',            2, 'CLOTHES',     1, @SeedTime, 1, @SeedTime, 1),
(N'Giày Dép Thời Trang',           2, 'CLOTHES',     1, @SeedTime, 1, @SeedTime, 1),
(N'Tai Nghe & Loa Bluetooth',     3, 'ELECTRONICS', 1, @SeedTime, 1, @SeedTime, 1),
(N'Điện Thoại Thông Minh',        3, 'ELECTRONICS', 1, @SeedTime, 1, @SeedTime, 1),
(N'Laptop & Máy Tính Bảng',      3, 'ELECTRONICS', 1, @SeedTime, 1, @SeedTime, 1),
(N'Nội Thất Phòng Khách',         4, 'GENERAL',     1, @SeedTime, 1, @SeedTime, 1),
(N'Đồ Gia Dụng Nhà Bếp',          4, 'GENERAL',     1, @SeedTime, 1, @SeedTime, 1),
(N'Sữa & Thực Phẩm Cho Bé',     5, 'GENERAL',     1, @SeedTime, 1, @SeedTime, 1),
(N'Tã Bỉm Trẻ Em',                5, 'GENERAL',     1, @SeedTime, 1, @SeedTime, 1),
(N'Chăm Sóc Da Mặt',              6, 'GENERAL',     1, @SeedTime, 1, @SeedTime, 1),
(N'Thực Phẩm Chức Năng',         6, 'GENERAL',     1, @SeedTime, 1, @SeedTime, 1),
(N'Dụng Cụ Tập Gym',              7, 'GENERAL',     1, @SeedTime, 1, @SeedTime, 1),
(N'Lều Trại & Phụ Kiện Phượt', 7, 'GENERAL',     1, @SeedTime, 1, @SeedTime, 1),
(N'Mũ Bảo Hiểm Chính Hãng',      8, 'GENERAL',     1, @SeedTime, 1, @SeedTime, 1),
(N'Đồ Ăn Vặt & Bánh Kẹo',         9, 'GENERAL',     1, @SeedTime, 1, @SeedTime, 1),
(N'Mô Hình Lắp Ráp Anime',         10, 'GENERAL',     1, @SeedTime, 1, @SeedTime, 1);

-- ------------------------------------------------------------------------------
-- 3. Sinh 2.000 Tài khoản: 200 Sellers và 1.800 Buyers
-- ------------------------------------------------------------------------------
PRINT N'[3/8] Sinh 2.000 Tài khoản (200 Sellers + 1.800 Buyers)...';

WITH Digits AS (SELECT 0 AS d UNION ALL SELECT 1 UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4 UNION ALL SELECT 5 UNION ALL SELECT 6 UNION ALL SELECT 7 UNION ALL SELECT 8 UNION ALL SELECT 9),
Numbers AS (
    SELECT d1.d + d2.d*10 + d3.d*100 + d4.d*1000 AS n
    FROM Digits d1 CROSS JOIN Digits d2 CROSS JOIN Digits d3 CROSS JOIN Digits d4
    WHERE d1.d + d2.d*10 + d3.d*100 + d4.d*1000 BETWEEN 1 AND 2000
)
INSERT INTO Account (Username, password, FName, LName, Phone, Account_Status, Email, Gender, avatar, Address, CCCD, Date_Of_Birth, Created_At, Created_By, Updated_At, Updated_By)
SELECT 
    CASE WHEN n <= 200 THEN 'seller_' + RIGHT('0000' + CAST(n AS VARCHAR(10)), 4)
         ELSE 'buyer_' + RIGHT('0000' + CAST(n AS VARCHAR(10)), 4) END AS Username,
    '$2a$12$h1U/fVmlo3BtMYSWX7IseucGx96mQsrwnS1VcTBwm3hlIaAKxrtPe',
    CASE (n % 5) 
        WHEN 0 THEN N'Nguyễn' 
        WHEN 1 THEN N'Trần' 
        WHEN 2 THEN N'Lê' 
        WHEN 3 THEN N'Phạm' 
        ELSE N'Hoàng' END AS FName,
    CASE (n % 4) 
        WHEN 0 THEN N'Anh Tuấn' 
        WHEN 1 THEN N'Thị Mai' 
        WHEN 2 THEN N'Minh Khôi' 
        ELSE N'Thúy Hiền' END AS LName,
    '091' + RIGHT('0000000' + CAST(n AS VARCHAR(10)), 7) AS Phone,
    N'ACTIVE',
    'user_' + CAST(n AS VARCHAR(10)) + '@bkpee.vn' AS Email,
    CASE (n % 2) WHEN 0 THEN N'Nam' ELSE N'Nữ' END AS Gender,
    'https://bkpee.vn/avatar/user_' + CAST(n AS VARCHAR(10)) + '.png',
    N'Số ' + CAST((n * 7 % 300 + 1) AS NVARCHAR(10)) + N' Đường ' + CAST((n % 50 + 1) AS NVARCHAR(10)) + N', TP. Hồ Chí Minh',
    '0791' + RIGHT('00000000' + CAST(n AS VARCHAR(10)), 8) AS CCCD,
    DATEADD(DAY, -(n * 13 % 10000 + 6000), '2026-01-01'),
    DATEADD(DAY, -(n % 365), @SeedTime),  -- Created_At
    1,                                    -- Created_By (Admin)
    DATEADD(DAY, -(n % 365), @SeedTime),  -- Updated_At
    1                                     -- Updated_By (Admin)
FROM Numbers ORDER BY n;

-- User (Tất cả 2000 tài khoản từ ID 2 đến 2001)
INSERT INTO [User] (Account_ID, Trust_Score)
SELECT Account_ID, 80 + (Account_ID % 21)
FROM Account
WHERE Account_ID >= 2;

-- 200 Sellers (Account_ID từ 2 đến 201)
INSERT INTO Seller (Account_ID, Shop_Name, Bank_Name, Bank_Account_Holder, Bank_Account_Number, Bank_Branch)
SELECT 
    Account_ID,
    N'Gian Hàng Official Shop ' + CAST(Account_ID - 1 AS NVARCHAR(10)),
    N'Vietcombank',
    N'CHU TK GIAN HANG ' + RIGHT('0000' + CAST(Account_ID AS VARCHAR(10)), 4),
    '9704' + RIGHT('000000000000' + CAST(Account_ID AS VARCHAR(20)), 12),
    N'TP. Ho Chi Minh'
FROM Account
WHERE Account_ID BETWEEN 2 AND 201;

-- 2.000 Buyers (Bao gồm cả 200 Sellers theo mô hình Overlapping Specialization)
INSERT INTO Buyer (Account_ID)
SELECT Account_ID
FROM Account
WHERE Account_ID >= 2;

-- Sổ địa chỉ cho Buyer (Buyer_Infor)
INSERT INTO Buyer_Infor (Buyer_ID, Address, Receiver_Name, Phone)
SELECT 
    b.Account_ID,
    a.Address,
    a.FName + ' ' + a.LName,
    a.Phone
FROM Buyer b
JOIN Account a ON b.Account_ID = a.Account_ID;

-- Địa chỉ phụ thứ hai cho 50% số Buyer
INSERT INTO Buyer_Infor (Buyer_ID, Address, Receiver_Name, Phone)
SELECT 
    b.Account_ID,
    N'Văn phòng công ty: Tầng ' + CAST((b.Account_ID % 15 + 1) AS NVARCHAR(5)) + N', Tòa nhà Landmark ' + CAST((b.Account_ID % 5 + 1) AS NVARCHAR(5)) + N', TP.HCM',
    a.FName + ' ' + a.LName,
    a.Phone
FROM Buyer b
JOIN Account a ON b.Account_ID = a.Account_ID
WHERE b.Account_ID % 2 = 0;

-- Giỏ hàng cho mỗi Buyer
INSERT INTO Cart (Total_product, Buyer_ID, Created_At, Created_By, Updated_At, Updated_By)
SELECT 0, b.Account_ID, @SeedTime, b.Account_ID, @SeedTime, b.Account_ID
FROM Buyer b ORDER BY b.Account_ID;

-- ------------------------------------------------------------------------------
-- 4. Sinh 3.000 Sản phẩm (Product) & Phân loại Bảng con
-- ------------------------------------------------------------------------------
PRINT N'[4/8] Sinh 3.000 Sản phẩm (Sách, Quần áo, Điện tử)...';

-- A shared staging map is the source of truth for names, categories and subtypes.
-- Product_ID is an IDENTITY, not the seed ordinal or a classification rule.
CREATE TABLE #SeedProducts (
    Seed_ID INT PRIMARY KEY, Family VARCHAR(20) NOT NULL, Category_ID INT NOT NULL,
    Product_Name NVARCHAR(255) NOT NULL, Manufacturer NVARCHAR(100) NOT NULL
);
WITH Digits AS (SELECT 0 AS d UNION ALL SELECT 1 UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4 UNION ALL SELECT 5 UNION ALL SELECT 6 UNION ALL SELECT 7 UNION ALL SELECT 8 UNION ALL SELECT 9),
Numbers AS (
    SELECT d1.d+d2.d*10+d3.d*100+d4.d*1000 AS n
    FROM Digits d1 CROSS JOIN Digits d2 CROSS JOIN Digits d3 CROSS JOIN Digits d4
    WHERE d1.d+d2.d*10+d3.d*100+d4.d*1000 BETWEEN 1 AND 3000
)
INSERT INTO #SeedProducts (Seed_ID,Family,Category_ID,Product_Name,Manufacturer)
SELECT n, CASE n%3 WHEN 0 THEN 'Books' WHEN 1 THEN 'Clothes' ELSE 'Electronics' END,
    CASE n%3 WHEN 0 THEN 11+(n/3)%3 WHEN 1 THEN 14+(n/3)%3 ELSE 17+(n/3)%3 END,
    CASE n%3
      WHEN 0 THEN CASE (n/3)%3
        WHEN 0 THEN CASE (n/9)%4 WHEN 0 THEN N'Sách Hệ quản trị cơ sở dữ liệu' WHEN 1 THEN N'Sách Lập trình Java' WHEN 2 THEN N'Sách Trí tuệ nhân tạo' ELSE N'Sách Phân tích dữ liệu' END
        WHEN 1 THEN CASE (n/9)%3 WHEN 0 THEN N'Sách Quản trị doanh nghiệp' WHEN 1 THEN N'Sách Khởi nghiệp thực hành' ELSE N'Sách Kinh tế học căn bản' END
        ELSE N'Truyện tranh Hành trình khám phá' END
      WHEN 1 THEN CASE (n/3)%3 WHEN 0 THEN N'Áo thun cotton cổ tròn' WHEN 1 THEN N'Quần jeans dáng thẳng' ELSE N'Giày thể thao thoáng khí' END
      ELSE CASE (n/3)%3 WHEN 0 THEN N'Tai nghe Bluetooth chống ồn' WHEN 1 THEN N'Điện thoại thông minh' ELSE N'Laptop học tập và làm việc' END
    END + N' - Mẫu ' + CAST(n AS NVARCHAR(10)),
    CASE n%3 WHEN 0 THEN N'NXB Tri Thức'
      WHEN 1 THEN CASE (n/3)%3 WHEN 2 THEN N'Biti''s' ELSE N'Coolmate' END
      ELSE CASE (n/3)%3 WHEN 0 THEN N'Sony' WHEN 1 THEN N'Samsung' ELSE N'Lenovo' END END
FROM Numbers ORDER BY n;
INSERT INTO Product (Seller_ID,Category_ID,Product_Name,Description,Manufacturer,Created_At,Created_By,Updated_At,Updated_By)
SELECT 2+(Seed_ID%200),Category_ID,Product_Name,
       N'Sản phẩm ' + Family + N', thông tin và thuộc tính theo đúng danh mục.',Manufacturer,
       DATEADD(DAY,-(Seed_ID%300),@SeedTime),2+(Seed_ID%200),
       DATEADD(DAY,-(Seed_ID%300),@SeedTime),2+(Seed_ID%200)
FROM #SeedProducts ORDER BY Seed_ID;
-- Resolve real generated IDs through the unique staged name, never ID modulo.
INSERT INTO Books (Product_ID,Publisher)
SELECT p.Product_ID,sp.Manufacturer FROM Product p JOIN #SeedProducts sp ON sp.Product_Name=p.Product_Name WHERE sp.Family='Books';
INSERT INTO Book_Author (Product_ID,Author_Name)
SELECT Product_ID,N'Tác giả ' + CAST(Product_ID%50+1 AS NVARCHAR(10)) FROM Books;
INSERT INTO Book_Author (Product_ID,Author_Name)
SELECT Product_ID,N'Đồng tác giả ' + CAST(Product_ID%30+1 AS NVARCHAR(10)) FROM Books WHERE Product_ID%2=0;
INSERT INTO Clothes (Product_ID,Material)
SELECT p.Product_ID,CASE sp.Category_ID WHEN 14 THEN N'100% Cotton' WHEN 15 THEN N'Denim' ELSE N'Vải lưới và cao su' END
FROM Product p JOIN #SeedProducts sp ON sp.Product_Name=p.Product_Name WHERE sp.Family='Clothes';
INSERT INTO Electronics (Product_ID,Warranty_ID,Warranty_Time)
SELECT p.Product_ID,'WARRANTY-VN-'+RIGHT('000000'+CAST(p.Product_ID AS VARCHAR(10)),6),
       CASE sp.Category_ID WHEN 17 THEN N'12 tháng' WHEN 18 THEN N'24 tháng' ELSE N'36 tháng' END
FROM Product p JOIN #SeedProducts sp ON sp.Product_Name=p.Product_Name WHERE sp.Family='Electronics';
-- ------------------------------------------------------------------------------
-- 5. Sinh 9.000 Biến thể sản phẩm (Product_Variant) & Khuyến mãi (Promotion)
-- ------------------------------------------------------------------------------
PRINT N'[5/8] Sinh 9.000 Biến thể Sản phẩm & Khuyến mãi...';

-- Mỗi Product có 3 Variant (Tổng: 3.000 x 3 = 9.000 Variants)
INSERT INTO Product_Variant (Product_ID, Price, Is_Active, Quantity_Stock, Image, Variant_Name)
SELECT 
    p.Product_ID,
    (CASE sp.Family WHEN 'Books' THEN 50000+(sp.Seed_ID%40)*5000
        WHEN 'Clothes' THEN 150000+(sp.Seed_ID%40)*25000
        ELSE CASE sp.Category_ID WHEN 17 THEN 500000+(sp.Seed_ID%20)*100000
             WHEN 18 THEN 3000000+(sp.Seed_ID%20)*500000 ELSE 8000000+(sp.Seed_ID%20)*500000 END END) * v.multiplier AS Price,
    1 AS Is_Active,
    50 + (p.Product_ID * 7 % 450) AS Quantity_Stock,
    'https://bkpee.vn/img/product/variant_' + CAST(p.Product_ID AS VARCHAR(10)) + '_' + CAST(v.multiplier AS VARCHAR(5)) + '.png' AS Image,
    CASE sp.Family
        WHEN 'Books' THEN CASE v.multiplier WHEN 1 THEN N'Bìa mềm' WHEN 2 THEN N'Bìa cứng' ELSE N'Bản đặc biệt' END
        WHEN 'Clothes' THEN CASE v.multiplier WHEN 1 THEN N'Size M' WHEN 2 THEN N'Size L' ELSE N'Size XL' END
        ELSE CASE v.multiplier WHEN 1 THEN N'Màu Đen' WHEN 2 THEN N'Màu Bạc' ELSE N'Bản 256GB' END
    END AS Variant_Name
FROM Product p
JOIN #SeedProducts sp ON sp.Product_Name=p.Product_Name
CROSS JOIN (SELECT 1 AS multiplier UNION ALL SELECT 2 UNION ALL SELECT 3) v ORDER BY sp.Seed_ID,v.multiplier;

-- Sinh 500 Chương trình khuyến mãi từ 200 Sellers
WITH Digits AS (SELECT 0 AS d UNION ALL SELECT 1 UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4 UNION ALL SELECT 5 UNION ALL SELECT 6 UNION ALL SELECT 7 UNION ALL SELECT 8 UNION ALL SELECT 9),
Numbers AS (
    SELECT d1.d + d2.d*10 + d3.d*100 AS n
    FROM Digits d1 CROSS JOIN Digits d2 CROSS JOIN Digits d3
    WHERE d1.d + d2.d*10 + d3.d*100 BETWEEN 1 AND 500
)
INSERT INTO Promotion (Quantity, Start_Date, Expiration_Date, Min_Bill, Type, Seller_ID, Created_At, Created_By, Updated_At, Updated_By)
SELECT 
    100 + (n * 5 % 500),
    '2026-01-01 00:00:00',
    '2026-12-31 23:59:59',
    100000 + (n % 10) * 50000,
    CASE (n % 2) WHEN 0 THEN 'COUPON' ELSE 'VOUCHER' END,
    2 + (n % 200),         -- Seller_ID
    @SeedTime,             -- Created_At
    2 + (n % 200),         -- Created_By (Seller_ID)
    @SeedTime,             -- Updated_At
    2 + (n % 200)          -- Updated_By (Seller_ID)
FROM Numbers ORDER BY n;

-- 250 Coupons
INSERT INTO Coupon (Promotion_ID, percent_discount, max_discount)
SELECT 
    Promotion_ID,
    10.00 + (Promotion_ID % 8) * 5.00,
    50000 + (Promotion_ID % 5) * 20000
FROM Promotion
WHERE Type = 'COUPON';

-- 250 Vouchers
INSERT INTO Voucher (Promotion_ID, voucher_value)
SELECT 
    Promotion_ID,
    20000 + (Promotion_ID % 10) * 10000
FROM Promotion
WHERE Type = 'VOUCHER';

-- Gán Khuyến mãi cho Biến thể (Promotion_Apply)
INSERT INTO Promotion_Apply (Variant_ID, Promotion_ID)
SELECT DISTINCT
    (p.Promotion_ID * 17 % 8500 + 1) AS Variant_ID,
    p.Promotion_ID
FROM Promotion p;

-- ------------------------------------------------------------------------------
-- 6. Sinh 10.000 Đơn hàng tổng ([Order])
-- ------------------------------------------------------------------------------
PRINT N'[6/8] Sinh 10.000 Đơn hàng tổng ([Order])...';

WITH Digits AS (SELECT 0 AS d UNION ALL SELECT 1 UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4 UNION ALL SELECT 5 UNION ALL SELECT 6 UNION ALL SELECT 7 UNION ALL SELECT 8 UNION ALL SELECT 9),
Numbers AS (
    SELECT d1.d + d2.d*10 + d3.d*100 + d4.d*1000 + d5.d*10000 AS n
    FROM Digits d1 CROSS JOIN Digits d2 CROSS JOIN Digits d3 CROSS JOIN Digits d4 CROSS JOIN Digits d5
    WHERE d1.d + d2.d*10 + d3.d*100 + d4.d*1000 + d5.d*10000 BETWEEN 1 AND 10000
)
INSERT INTO [Order] (Order_Time, Total_Price, Delivery_Address, Buyer_ID, Created_At, Created_By, Updated_At, Updated_By)
SELECT 
    DATEADD(MINUTE, -(n * 23 % 400000), '2026-10-30 00:00:00') AS Order_Time,
    200000 + (n * 37 % 500) * 10000 AS Total_Price,
    N'Địa chỉ giao hàng số ' + CAST(n AS NVARCHAR(10)) + N', Phường ' + CAST((n % 20 + 1) AS NVARCHAR(5)) + N', TP. Hồ Chí Minh',
    202 + (n % 1800) AS Buyer_ID,
    DATEADD(MINUTE, -(n * 23 % 400000), '2026-10-30 00:00:00'),  -- Created_At = Order_Time
    202 + (n % 1800),                                             -- Created_By (Buyer_ID)
    DATEADD(MINUTE, -(n * 23 % 400000), '2026-10-30 00:00:00'),  -- Updated_At = Order_Time
    202 + (n % 1800)                                              -- Updated_By (Buyer_ID)
FROM Numbers ORDER BY n;

-- ------------------------------------------------------------------------------
-- 7. Sinh 15.000 Đơn hàng con theo Shop (Shop_Order) & 35.000 Món hàng (Shop_Order_Item)
-- ------------------------------------------------------------------------------
PRINT N'[7/8] Sinh 15.000 Shop_Orders & 35.000 Shop_Order_Items...';

INSERT INTO Shop_Order (Order_ID, Seller_ID, Provider_ID, Tracking_Number, Delivery_Status, Shipping_Fee, Shipped_At, Delivered_At)
SELECT 
    o.Order_ID,
    2 + ((o.Order_ID + s.shop_offset) % 200) AS Seller_ID,
    1 + (o.Order_ID % 10) AS Provider_ID,
    'SPX-BKPEE-' + RIGHT('0000000' + CAST(o.Order_ID AS VARCHAR(10)), 7) + '-' + CAST(s.shop_offset AS VARCHAR(5)),
    CASE (o.Order_ID % 6)
        WHEN 0 THEN N'PENDING'
        WHEN 1 THEN N'CONFIRMED'
        WHEN 2 THEN N'SHIPPING'
        WHEN 3 THEN N'CANCELLED'
        ELSE N'DELIVERED'
    END AS Delivery_Status,
    20000 + (o.Order_ID % 4) * 5000 AS Shipping_Fee,
    DATEADD(HOUR, 4, o.Order_Time) AS Shipped_At,
    CASE WHEN (o.Order_ID % 6 >= 4) THEN DATEADD(DAY, 2, o.Order_Time) ELSE NULL END AS Delivered_At
FROM [Order] o
CROSS JOIN (SELECT 0 AS shop_offset UNION ALL SELECT 1) s
WHERE (s.shop_offset = 0) OR (o.Order_ID % 2 = 0) ORDER BY o.Order_ID,s.shop_offset;

-- Chi tiết món hàng (~35.000 Shop_Order_Items)
INSERT INTO Shop_Order_Item (Shop_Order_ID, Variant_ID, Quantity, Purchase_Price)
SELECT 
    so.Shop_Order_ID,
    1 + ((so.Shop_Order_ID * 13 + item.item_idx * 173) % 8500) AS Variant_ID,
    1 + (so.Shop_Order_ID % 3) AS Quantity,
    120000 + (so.Shop_Order_ID * 19 % 200) * 10000 AS Purchase_Price
FROM Shop_Order so
CROSS JOIN (SELECT 1 AS item_idx UNION ALL SELECT 2 UNION ALL SELECT 3) item
WHERE (item.item_idx <= 2) OR (so.Shop_Order_ID % 3 = 0);

-- Thanh toán cho 10.000 Orders (Payment_Information)
INSERT INTO Payment_Information (Order_ID, Transaction_Code, Payment_Method, Payment_Status, Payment_Time)
SELECT 
    Order_ID,
    'PAY-BKPEE-TXN-' + RIGHT('00000000' + CAST(Order_ID AS VARCHAR(10)), 8),
    CASE (Order_ID % 4)
        WHEN 0 THEN N'COD'
        WHEN 1 THEN N'VNPAY'
        WHEN 2 THEN N'MOMO'
        ELSE N'BANKING'
    END AS Payment_Method,
    CASE WHEN (Order_ID % 6 = 3) THEN N'FAILED' ELSE N'COMPLETED' END AS Payment_Status,
    Order_Time
FROM [Order];

-- Sinh 3.000 Giỏ hàng chi tiết (Cart_Item)
INSERT INTO Cart_Item (Cart_ID, Variant_ID, Quantity)
SELECT 
    c.Cart_ID,
    1 + ((c.Cart_ID * 11 + it.idx * 137) % 8500) AS Variant_ID,
    1 + (c.Cart_ID % 4) AS Quantity
FROM Cart c
CROSS JOIN (SELECT 1 AS idx UNION ALL SELECT 2) it
WHERE c.Cart_ID <= 1500;

UPDATE c
SET c.Total_product = sub.total_q
FROM Cart c
JOIN (SELECT Cart_ID, SUM(Quantity) AS total_q FROM Cart_Item GROUP BY Cart_ID) sub ON c.Cart_ID = sub.Cart_ID;

-- ------------------------------------------------------------------------------
-- 8. Sinh 6.000 Đánh giá (Evaluation) & 1.000 Khiếu nại (Report)
-- ------------------------------------------------------------------------------
PRINT N'[8/8] Sinh 6.000 Đánh giá (Evaluation) & 1.000 Khiếu nại (Report)...';

-- Đánh giá (Evaluation)
WITH Digits AS (SELECT 0 AS d UNION ALL SELECT 1 UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4 UNION ALL SELECT 5 UNION ALL SELECT 6 UNION ALL SELECT 7 UNION ALL SELECT 8 UNION ALL SELECT 9),
Numbers AS (
    SELECT d1.d + d2.d*10 + d3.d*100 + d4.d*1000 AS n
    FROM Digits d1 CROSS JOIN Digits d2 CROSS JOIN Digits d3 CROSS JOIN Digits d4
    WHERE d1.d + d2.d*10 + d3.d*100 + d4.d*1000 BETWEEN 1 AND 6000
)
INSERT INTO Evaluation (Buyer_ID, Variant_ID, Rating, Content, Created_At, Created_By, Updated_At, Updated_By)
SELECT 
    202 + (n % 1800) AS Buyer_ID,
    1 + (n * 7 % 8500) AS Variant_ID,
    3 + (n % 3) AS Rating,
    CASE (n % 3)
        WHEN 0 THEN N'Sản phẩm đóng gói rất cẩn thận, đúng mô tả, giao hàng siêu nhanh!'
        WHEN 1 THEN N'Chất lượng tốt so với giá tiền, shop phục vụ nhiệt tình và chu đáo.'
        ELSE N'Dùng rất ưng ý, sẽ ủng hộ shop tiếp vào lần sau ạ!'
    END,
    DATEADD(DAY, -(n % 180), '2026-10-30 00:00:00'),   -- Created_At
    202 + (n % 1800),                                   -- Created_By (Buyer_ID)
    DATEADD(DAY, -(n % 180), '2026-10-30 00:00:00'),   -- Updated_At
    202 + (n % 1800)                                    -- Updated_By (Buyer_ID)
FROM Numbers ORDER BY n;

-- Ảnh đánh giá (Evaluation_Image cho 50% bài đánh giá = 3.000 ảnh)
INSERT INTO Evaluation_Image (Evaluate_ID, Image)
SELECT Evaluate_ID, 'https://bkpee.vn/img/review/' + CAST(Evaluate_ID AS VARCHAR(10)) + '_1.jpg'
FROM Evaluation
WHERE Evaluate_ID % 2 = 0;

-- 1.000 Báo cáo khiếu nại (Report)
WITH Digits AS (SELECT 0 AS d UNION ALL SELECT 1 UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4 UNION ALL SELECT 5 UNION ALL SELECT 6 UNION ALL SELECT 7 UNION ALL SELECT 8 UNION ALL SELECT 9),
Numbers AS (
    SELECT d1.d + d2.d*10 + d3.d*100 + d4.d*1000 AS n
    FROM Digits d1 CROSS JOIN Digits d2 CROSS JOIN Digits d3 CROSS JOIN Digits d4
    WHERE d1.d + d2.d*10 + d3.d*100 + d4.d*1000 BETWEEN 1 AND 1000
)
INSERT INTO Report (Reporter_ID, Reported_ID, Admin_ID, Reason, Description, Status, Resolved_At, Created_At, Created_By, Updated_At, Updated_By)
SELECT 
    202 + (n % 1800) AS Reporter_ID,
    2 + (n % 200) AS Reported_ID,
    1 AS Admin_ID,
    CASE (n % 4)
        WHEN 0 THEN N'Hàng nhận được không đúng như hình ảnh quảng cáo'
        WHEN 1 THEN N'Shop chậm trễ xác nhận đơn hàng quá 48 giờ'
        WHEN 2 THEN N'Nghi vấn hàng nhái, không có tem bảo hành chính hãng'
        ELSE N'Thái độ tư vấn chăm sóc khách hàng chưa phù hợp'
    END AS Reason,
    N'Nội dung chi tiết khiếu nại từ khách hàng số ' + CAST(n AS NVARCHAR(10)),
    CASE (n % 3)
        WHEN 0 THEN N'PENDING'
        WHEN 1 THEN N'IN_PROGRESS'
        ELSE N'RESOLVED'
    END AS Status,
    CASE WHEN (n % 3 = 2) THEN '2026-10-30 05:00:00' ELSE NULL END AS Resolved_At,
    DATEADD(DAY, -(n % 90), '2026-10-30 00:00:00')  AS Created_At,
    202 + (n % 1800)                                 AS Created_By,
    CASE WHEN (n % 3 = 2)
         THEN CAST('2026-10-30 05:00:00' AS DATETIME2)
         ELSE DATEADD(DAY, -(n % 90), '2026-10-30 00:00:00')
    END                                              AS Updated_At,
    CASE WHEN (n % 3 = 2) THEN 1
         ELSE 202 + (n % 1800)
    END                                              AS Updated_By
FROM Numbers ORDER BY n;

-- 1.000 Ảnh khiếu nại
INSERT INTO Report_Image (Report_ID, Image)
SELECT Report_ID, 'https://bkpee.vn/img/report/evidence_' + CAST(Report_ID AS VARCHAR(10)) + '.jpg'
FROM Report;

PRINT N'==============================================================';
-- Success is printed only after assertions and COMMIT below.
PRINT N'==============================================================';

-- Thống kê số lượng bản ghi của toàn bộ 28 bảng
SELECT 
    t.name AS TableName,
    p.rows AS TotalRows
FROM sys.tables t
INNER JOIN sys.partitions p ON t.object_id = p.object_id
WHERE p.index_id IN (0, 1)
ORDER BY TotalRows DESC, t.name;

-- Deterministic dataset invariants. No new persistent schema or indexes.
IF (SELECT COUNT(*) FROM Product)<>3000 OR (SELECT COUNT(*) FROM Product_Variant)<>9000
    THROW 51001, 'Unexpected product/variant count', 1;
IF (SELECT COUNT(*) FROM Books)<>1000 OR (SELECT COUNT(*) FROM Clothes)<>1000 OR (SELECT COUNT(*) FROM Electronics)<>1000
    THROW 51002, 'Unexpected subtype count', 1;
IF EXISTS(SELECT 1 FROM Product p JOIN #SeedProducts sp ON sp.Product_Name=p.Product_Name
    JOIN Category c ON c.Category_ID=p.Category_ID
    WHERE p.Category_ID<>sp.Category_ID OR COALESCE(c.Parent_Category_ID,c.Category_ID)<>
        CASE sp.Family WHEN 'Books' THEN 1 WHEN 'Clothes' THEN 2 ELSE 3 END)
    THROW 51003, 'Subtype/category mismatch', 1;
IF (SELECT COUNT(*) FROM Product p JOIN #SeedProducts sp ON sp.Product_Name=p.Product_Name)<>3000
    THROW 51004, 'Staging mapping is incomplete', 1;
IF (SELECT COUNT(*) FROM Account)<>2001 OR (SELECT COUNT(*) FROM Category)<>30
    OR (SELECT COUNT(*) FROM [Order])<>10000 OR (SELECT COUNT(*) FROM Shop_Order)<>15000
    OR (SELECT COUNT(*) FROM Shop_Order_Item)<>35000 OR (SELECT COUNT(*) FROM Cart_Item)<>3000
    THROW 51005, 'Unexpected benchmark table count', 1;
IF EXISTS(SELECT 1 FROM Cart c OUTER APPLY(SELECT COALESCE(SUM(Quantity),0) units FROM Cart_Item i WHERE i.Cart_ID=c.Cart_ID) x WHERE c.Total_product<>x.units)
    THROW 51006, 'Cart.Total_product must equal SUM Quantity', 1;
DROP TABLE #SeedProducts;
COMMIT;
PRINT N'SEED VALIDATED AND COMMITTED SUCCESSFULLY';
END TRY
BEGIN CATCH
    IF @@TRANCOUNT>0 ROLLBACK;
    THROW;
END CATCH;
