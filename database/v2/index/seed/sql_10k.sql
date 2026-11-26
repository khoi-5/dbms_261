-- INDEXING DATASET 3,000 SAN PHAM / 10,000 BIEN THE.
-- Chi su dung BKPEE_INDEX_DB; khong tac dong BKPEE_DB.
-- Chay sau index/schema/01_schema.sql (28 bang trong); F5 toan bo file.
-- Seed nay chi nap nhung bang can cho T1-T4 (account/seller/category/product/variant).
USE BKPEE_INDEX_DB;
GO
SET NOCOUNT ON;
SET XACT_ABORT ON;
DECLARE @ProductCount INT = 3000;
DECLARE @VariantCount INT = 10000;
DECLARE @ExtraVariantProducts INT = 1000; -- 1000 product dau tien co 4 variant; con lai co 3.
DECLARE @SeedTime DATETIME2 = '2026-10-30T00:00:00';

-- Neu co du lieu cu, reset bang index/schema/01_schema.sql truoc.
IF EXISTS (SELECT 1 FROM dbo.Account) OR EXISTS (SELECT 1 FROM dbo.Product)
   OR EXISTS (SELECT 1 FROM dbo.Product_Variant) OR EXISTS (SELECT 1 FROM dbo.Category)
    THROW 51001, 'Index database khong rong. Hay reset schema Indexing truoc khi seed.', 1;

BEGIN TRY
BEGIN TRANSACTION;
-- Tạo Admin (Account_ID = 1) - Mật khẩu 12345678
INSERT INTO Account (Username, password, FName, LName, Phone, Account_Status, Email, Gender, avatar, Address, CCCD, Date_Of_Birth, Created_At, Created_By, Updated_At, Updated_By)
VALUES ('admin_root', '$2a$12$h1U/fVmlo3BtMYSWX7IseucGx96mQsrwnS1VcTBwm3hlIaAKxrtPe', N'Văn', N'Quản Trị', '0901000000', N'ACTIVE', 'admin@bkpee.vn', N'Nam', 'https://bkpee.vn/img/admin.png', N'Quận 10, TP.HCM', '079090000000', '1995-05-15', @SeedTime, 1, @SeedTime, 1);

INSERT INTO Admin (Account_ID, Admin_Role) VALUES (1, N'SUPER_ADMIN');

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



-- 200 Seller, cung ID 2..201 va cong thuc nhu seed V2.
;WITH Digits AS (SELECT 0 AS d UNION ALL SELECT 1 UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4 UNION ALL SELECT 5 UNION ALL SELECT 6 UNION ALL SELECT 7 UNION ALL SELECT 8 UNION ALL SELECT 9),
Numbers AS (
  SELECT d1.d+d2.d*10+d3.d*100 AS n
  FROM Digits d1 CROSS JOIN Digits d2 CROSS JOIN Digits d3
)
INSERT INTO dbo.Account (Username,password,FName,LName,Phone,Account_Status,Email,Gender,avatar,Address,CCCD,Date_Of_Birth,Created_At,Created_By,Updated_At,Updated_By)
SELECT 'seller_' + RIGHT('0000'+CAST(n AS VARCHAR(10)),4),
 '$2a$12$h1U/fVmlo3BtMYSWX7IseucGx96mQsrwnS1VcTBwm3hlIaAKxrtPe',
 CASE n%5 WHEN 0 THEN N'Nguyễn' WHEN 1 THEN N'Trần' WHEN 2 THEN N'Lê' WHEN 3 THEN N'Phạm' ELSE N'Hoàng' END,
 CASE n%4 WHEN 0 THEN N'Anh Tuấn' WHEN 1 THEN N'Thị Mai' WHEN 2 THEN N'Minh Khôi' ELSE N'Thúy Hiền' END,
 '091'+RIGHT('0000000'+CAST(n AS VARCHAR(10)),7),N'ACTIVE',
 'user_'+CAST(n AS VARCHAR(10))+'@bkpee.vn',CASE n%2 WHEN 0 THEN N'Nam' ELSE N'Nữ' END,
 'https://bkpee.vn/avatar/user_'+CAST(n AS VARCHAR(10))+'.png',
 N'Số '+CAST(n*7%300+1 AS NVARCHAR(10))+N' Đường '+CAST(n%50+1 AS NVARCHAR(10))+N', TP. Hồ Chí Minh',
 '0791'+RIGHT('00000000'+CAST(n AS VARCHAR(10)),8),
 DATEADD(DAY,-(n*13%10000+6000),'2026-01-01'),@SeedTime,1,@SeedTime,1
FROM Numbers WHERE n BETWEEN 1 AND 200 ORDER BY n;

INSERT INTO dbo.[User] (Account_ID, Trust_Score)
SELECT Account_ID,80+Account_ID%21 FROM dbo.Account WHERE Account_ID BETWEEN 2 AND 201;
INSERT INTO dbo.Seller (Account_ID,Shop_Name,Bank_Name,Bank_Account_Holder,Bank_Account_Number,Bank_Branch)
SELECT Account_ID,N'Gian Hàng Official Shop '+CAST(Account_ID-1 AS NVARCHAR(10)),
 N'Vietcombank',N'CHU TK GIAN HANG '+RIGHT('0000'+CAST(Account_ID AS VARCHAR(10)),4),
 '9704'+RIGHT('000000000000'+CAST(Account_ID AS VARCHAR(20)),12),N'TP. Ho Chi Minh'
FROM dbo.Account WHERE Account_ID BETWEEN 2 AND 201;


-- A shared staging map is the source of truth for names, categories and subtypes.
-- Product_ID is an IDENTITY, not the seed ordinal or a classification rule.
CREATE TABLE #SeedProducts (
    Seed_ID INT PRIMARY KEY, Family VARCHAR(20) NOT NULL, Category_ID INT NOT NULL,
    Product_Name NVARCHAR(255) NOT NULL, Manufacturer NVARCHAR(100) NOT NULL
);
;WITH Digits AS (SELECT 0 AS d UNION ALL SELECT 1 UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4 UNION ALL SELECT 5 UNION ALL SELECT 6 UNION ALL SELECT 7 UNION ALL SELECT 8 UNION ALL SELECT 9),
Numbers AS (
    SELECT d1.d+d2.d*10+d3.d*100+d4.d*1000+d5.d*10000 AS n
    FROM Digits d1 CROSS JOIN Digits d2 CROSS JOIN Digits d3 CROSS JOIN Digits d4 CROSS JOIN Digits d5
    WHERE d1.d+d2.d*10+d3.d*100+d4.d*1000+d5.d*10000 BETWEEN 1 AND @ProductCount
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
-- Sinh 10,000 bien the: 1,000 product co 4 variant, so con lai co 3.
PRINT N'Dang sinh 10000 bien the san pham...';
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
        WHEN 'Books' THEN CASE v.multiplier WHEN 1 THEN N'Bìa mềm' WHEN 2 THEN N'Bìa cứng' WHEN 3 THEN N'Bản đặc biệt' ELSE N'Bản sưu tầm' END
        WHEN 'Clothes' THEN CASE v.multiplier WHEN 1 THEN N'Size M' WHEN 2 THEN N'Size L' WHEN 3 THEN N'Size XL' ELSE N'Size XXL' END
        ELSE CASE v.multiplier WHEN 1 THEN N'Màu Đen' WHEN 2 THEN N'Màu Bạc' WHEN 3 THEN N'Bản 256GB' ELSE N'Bản 512GB' END
    END AS Variant_Name
FROM Product p
JOIN #SeedProducts sp ON sp.Product_Name=p.Product_Name
CROSS JOIN (SELECT 1 AS multiplier UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4) v
WHERE v.multiplier <= CASE WHEN sp.Seed_ID <= @ExtraVariantProducts THEN 4 ELSE 3 END
ORDER BY sp.Seed_ID, v.multiplier;



-- Kiem tra du lieu truoc commit.
IF (SELECT COUNT_BIG(*) FROM dbo.Account) <> 201
 OR (SELECT COUNT_BIG(*) FROM dbo.Seller) <> 200
 OR (SELECT COUNT_BIG(*) FROM dbo.Category) <> 30
 OR (SELECT COUNT_BIG(*) FROM dbo.Product) <> @ProductCount
 OR (SELECT COUNT_BIG(*) FROM dbo.Product_Variant) <> @VariantCount
    THROW 51002, 'Sai so luong ban ghi sau khi sinh.', 1;
IF EXISTS (SELECT 1 FROM dbo.Product p LEFT JOIN dbo.Seller s ON p.Seller_ID=s.Account_ID WHERE s.Account_ID IS NULL)
 OR EXISTS (SELECT 1 FROM dbo.Product_Variant v LEFT JOIN dbo.Product p ON p.Product_ID=v.Product_ID WHERE p.Product_ID IS NULL)
 OR EXISTS (SELECT 1 FROM dbo.Product p LEFT JOIN dbo.Product_Variant v ON p.Product_ID=v.Product_ID JOIN #SeedProducts sp ON sp.Product_Name = p.Product_Name
   GROUP BY p.Product_ID,sp.Seed_ID
   HAVING COUNT(v.Variant_ID) <> CASE WHEN sp.Seed_ID <= @ExtraVariantProducts THEN 4 ELSE 3 END)
    THROW 51003, 'Loi quan he seller/product/variant.', 1;
DROP TABLE #SeedProducts;
COMMIT;
PRINT N'INDEX_SQL_SEED_READY: 3000 products, 10000 variants.';
SELECT 'Account' AS TableName,COUNT(*) AS TotalRows FROM dbo.Account
UNION ALL SELECT 'Seller',COUNT(*) FROM dbo.Seller
UNION ALL SELECT 'Category',COUNT(*) FROM dbo.Category
UNION ALL SELECT 'Product',COUNT(*) FROM dbo.Product
UNION ALL SELECT 'Product_Variant',COUNT(*) FROM dbo.Product_Variant;
END TRY
BEGIN CATCH
  IF XACT_STATE() <> 0 ROLLBACK;
  THROW;
END CATCH;
