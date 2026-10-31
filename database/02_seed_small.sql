-- ==============================================================================
-- BTL HỆ QUẢN TRỊ CSDL (DBMS) - HỆ THỐNG TMĐT BKPEE
-- File: 02_seed_small.sql
-- Mục đích: Nạp tập dữ liệu mẫu cơ bản (Seed Data nhỏ)
-- Dành cho: Test nhanh giao diện, kiểm thử API backend và kiểm tra tính đúng đắn
-- ==============================================================================

USE BKPEE_DB;
GO

SET NOCOUNT ON;
PRINT N'==============================================================';
PRINT N'BẮT ĐẦU NẠP DỮ LIỆU MẪU CƠ BẢN (SMALL SEED CHO BKPEE_DB)...';
PRINT N'==============================================================';

-- 0. Xóa sạch dữ liệu cũ theo thứ tự bảng con đến bảng cha
PRINT N'[*] Đang dọn sạch dữ liệu cũ để đảm bảo tính độc lập...';
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
GO

PRINT N'[*] Đang nạp dữ liệu mẫu mới...';

-- 1. Account (Admin, Sellers, Buyers)
INSERT INTO Account (Username, password, FName, LName, Phone, Account_Status, Email, Gender, avatar, Address, CCCD, Date_Of_Birth, Created_At, Created_By, Updated_At, Updated_By)
VALUES
(N'admin_root',      N'$2a$10$hashed_admin_pwd',    N'Văn',   N'Quản Trị', '0901000001', N'ACTIVE', 'admin@bkpee.vn',        N'Nam', N'https://bkpee.vn/img/admin.png',      N'Quận 10, TP.HCM',       '079090000001', '1995-05-15', GETDATE(), 1, GETDATE(), 1),
(N'seller_fahasa',   N'$2a$10$hashed_seller_pwd1',  N'Thị',   N'Nhà Sách', '0902000002', N'ACTIVE', 'fahasa@bkpee.vn',        N'Nữ', N'https://bkpee.vn/img/fahasa.png',     N'Quận 1, TP.HCM',        '079090000002', '1990-10-20', GETDATE(), 1, GETDATE(), 1),
(N'seller_coolmate', N'$2a$10$hashed_seller_pwd2',  N'Đức',   N'Thời Trang', '0903000003', N'ACTIVE', 'coolmate@bkpee.vn',      N'Nam', N'https://bkpee.vn/img/coolmate.png',   N'Hà Đông, Hà Nội',      '079090000003', '1992-03-12', GETDATE(), 1, GETDATE(), 1),
(N'seller_cellphones',N'$2a$10$hashed_seller_pwd3', N'Thành', N'Điện Máy', '0904000004', N'ACTIVE', 'cellphones@bkpee.vn',   N'Nam', N'https://bkpee.vn/img/cellphones.png', N'Bình Thạnh, TP.HCM',    '079090000004', '1988-08-08', GETDATE(), 1, GETDATE(), 1),
(N'buyer_hienle',    N'$2a$10$hashed_buyer_pwd1',   N'Thúy',  N'Lê Hiền', '0905000005', N'ACTIVE', 'thuyhien@bkpee.vn',      N'Nữ', N'https://bkpee.vn/img/buyer1.png',    N'Thủ Đức, TP.HCM',       '079090000005', '2003-07-25', GETDATE(), 1, GETDATE(), 1),
(N'buyer_khoinguyen',N'$2a$10$hashed_buyer_pwd2',   N'Khôi',  N'Nguyễn',  '0906000006', N'ACTIVE', 'khoinguyen@bkpee.vn',    N'Nam', N'https://bkpee.vn/img/buyer2.png',    N'Quận 7, TP.HCM',        '079090000006', '2002-11-14', GETDATE(), 1, GETDATE(), 1);
GO

-- 2. Phân quyền User và Admin
INSERT INTO Admin (Account_ID, Admin_Role) VALUES (1, N'SUPER_ADMIN');

INSERT INTO [User] (Account_ID, Trust_Score) VALUES
(2, 100),
(3, 98),
(4, 95),
(5, 100),
(6, 100);
GO

-- 3. Sellers & Buyers
INSERT INTO Seller (Account_ID, Shop_Name, Bank_Account_Number) VALUES
(2, N'Fahasa Official Store', '190345678901'),
(3, N'Coolmate Activewear', '190345678902'),
(4, N'CellphoneS Flagship', '190345678903');

INSERT INTO Buyer (Account_ID) VALUES
(5),
(6);
GO

-- 4. Buyer_Infor (Sổ địa chỉ)
INSERT INTO Buyer_Infor (Buyer_ID, Address, Receiver_Name, Phone) VALUES
(5, N'KTX Khu A ĐHQG TP.HCM, Dĩ An, Bình Dương', N'Lê Hiền Thúy', '0905000005'),
(5, N'Nhà riêng: 123 Võ Văn Ngân, Thủ Đức, TP.HCM', N'Lê Hiền Thúy', '0905000005'),
(6, N'456 Nguyễn Lương Bằng, Quận 7, TP.HCM', N'Nguyễn Khôi', '0906000006');
GO

-- 5. Giỏ hàng cho Buyers
INSERT INTO Cart (Total_product, Buyer_ID, Created_At, Created_By, Updated_At, Updated_By) VALUES
(0, 5, GETDATE(), 5, GETDATE(), 5),
(0, 6, GETDATE(), 6, GETDATE(), 6);
GO

-- 6. Shipping Provider
INSERT INTO Shipping_Provider (Provider_Name, Phone, Address, Admin_ID, Base_Shipping_Fee, Created_At, Created_By, Updated_At, Updated_By) VALUES
(N'Giao Hàng Tiết Kiệm (GHTK)', '19006092', N'Tòa nhà VTV, Cầu Giấy, Hà Nội', 1, 22000, GETDATE(), 1, GETDATE(), 1),
(N'Giao Hàng Nhanh (GHN)',        '1900636677', N'Tân Bình, TP.HCM',                1, 25000, GETDATE(), 1, GETDATE(), 1),
(N'Viettel Post',                  '19008095',   N'Ba Đình, Hà Nội',                1, 20000, GETDATE(), 1, GETDATE(), 1);
GO

-- 7. Danh mục (Cây đệ quy)
INSERT INTO Category (Category_Name, Parent_Category_ID, Admin_ID, Created_At, Created_By, Updated_At, Updated_By) VALUES
(N'Sách & Văn Phòng Phẩm', NULL, 1, GETDATE(), 1, GETDATE(), 1),   -- Category 1
(N'Thời Trang & May Mặc',   NULL, 1, GETDATE(), 1, GETDATE(), 1),   -- Category 2
(N'Thiết Bị Điện Tử',       NULL, 1, GETDATE(), 1, GETDATE(), 1),   -- Category 3
(N'Sách Công Nghệ & Kỹ Thuật', 1,    1, GETDATE(), 1, GETDATE(), 1),   -- Category 4 (con của 1)
(N'Áo Thun Nam Nữ',          2,    1, GETDATE(), 1, GETDATE(), 1),   -- Category 5 (con của 2)
(N'Tai Nghe & Phụ Kiện',     3,    1, GETDATE(), 1, GETDATE(), 1);  -- Category 6 (con của 3)
GO

-- 8. Sản phẩm & Bảng con chuyên biệt
INSERT INTO Product (Seller_ID, Category_ID, Product_Name, Description, Manufacturer, Created_At, Created_By, Updated_At, Updated_By) VALUES
(2, 4, N'Giáo trình Cơ Sở Dữ Liệu (Database Systems)', N'Sách tham khảo chuẩn quốc tế biên soạn bởi ĐHQG-HCM.', N'NXB Đại học Quốc gia', GETDATE(), 2, GETDATE(), 2),
(3, 5, N'Áo Thun Thể Thao Nam QuickDry Chạy Bộ', N'Chất liệu Polyester tái chế siêu nhẹ, thoáng khí và khử mùi tối ưu.', N'Coolmate Vietnam', GETDATE(), 3, GETDATE(), 3),
(4, 6, N'Tai Nghe Chống Ồn Sony WH-1000XM5', N'Tai nghe Bluetooth cao cấp với công nghệ chống ồn chủ động hàng đầu thế giới.', N'Sony Corporation', GETDATE(), 4, GETDATE(), 4);

INSERT INTO Books (Product_ID, Publisher) VALUES (1, N'Nhà Xuất Bản ĐHQG TP.HCM');
INSERT INTO Book_Author (Product_ID, Author_Name) VALUES 
(1, N'PGS.TS. Trần Minh'),
(1, N'ThS. Nguyễn Thị Lan');

INSERT INTO Clothes (Product_ID, Material) VALUES (2, N'92% Polyester, 8% Spandex');

INSERT INTO Electronics (Product_ID, Warranty_ID, Warranty_Time) VALUES (3, 'BH-SONY-VN-2026', N'12 tháng chính hãng');
GO

-- 9. Biến thể sản phẩm (Product_Variant)
INSERT INTO Product_Variant (Product_ID, Price, Is_Active, Quantity_Stock, Image) VALUES
(1, 120000, 1, 150, N'https://bkpee.vn/img/books/csdl-tap1.png'),      -- Variant 1
(1, 180000, 1, 50,  N'https://bkpee.vn/img/books/csdl-biacung.png'),    -- Variant 2
(2, 199000, 1, 80,  N'https://bkpee.vn/img/clothes/aothun-den-l.png'),  -- Variant 3
(2, 199000, 1, 40,  N'https://bkpee.vn/img/clothes/aothun-trang-m.png'),-- Variant 4
(3, 7990000, 1, 25, N'https://bkpee.vn/img/electronics/sony-bac.png');  -- Variant 5
GO

-- 10. Giỏ hàng chi tiết
INSERT INTO Cart_Item (Cart_ID, Variant_ID, Quantity) VALUES
(1, 1, 1),
(1, 3, 2);

UPDATE Cart SET Total_product = 3 WHERE Cart_ID = 1;
GO

-- 11. Khuyến mãi
INSERT INTO Promotion (Quantity, Start_Date, Expiration_Date, Min_Bill, Type, Seller_ID, Created_At, Created_By, Updated_At, Updated_By) VALUES
(100, '2026-10-01 00:00:00', '2026-12-31 23:59:59', 200000, 'COUPON',  2, GETDATE(), 2, GETDATE(), 2),
(50,  '2026-10-15 00:00:00', '2026-11-30 23:59:59', 300000, 'VOUCHER', 3, GETDATE(), 3, GETDATE(), 3);

INSERT INTO Coupon (Promotion_ID, percent_discount, max_discount) VALUES (1, 15.00, 50000);
INSERT INTO Voucher (Promotion_ID, voucher_value) VALUES (2, 30000);

INSERT INTO Promotion_Apply (Variant_ID, Promotion_ID) VALUES
(1, 1),
(2, 1),
(3, 2);
GO

-- 12. Đơn hàng, Shop Order, Shop Order Item
INSERT INTO [Order] (Order_Time, Total_Price, Delivery_Address, Buyer_ID, Created_At, Created_By, Updated_At, Updated_By) VALUES
('2026-10-29 14:30:00', 540000, N'KTX Khu A ĐHQG TP.HCM, Dĩ An, Bình Dương', 5, '2026-10-29 14:30:00', 5, '2026-10-29 14:30:00', 5);

INSERT INTO Shop_Order (Order_ID, Seller_ID, Provider_ID, Tracking_Number, Delivery_Status, Shipping_Fee, Shipped_At, Delivered_At) VALUES
(1, 2, 1, 'GHTK-FAHASA-001', N'DELIVERED', 22000, '2026-10-29 16:00:00', '2026-10-30 09:30:00'),
(1, 3, 2, 'GHN-COOLMATE-002', N'SHIPPING',  25000, '2026-10-29 17:00:00', NULL);

INSERT INTO Shop_Order_Item (Shop_Order_ID, Variant_ID, Quantity, Purchase_Price) VALUES
(1, 1, 1, 120000),
(2, 3, 2, 199000);
GO

-- 13. Thanh toán
INSERT INTO Payment_Information (Order_ID, Transaction_Code, Payment_Method, Payment_Status, Payment_Time) VALUES
(1, 'TXN-BKPEE-20261029-001', N'VNPAY', N'COMPLETED', '2026-10-29 14:35:00');
GO

-- 14. Đánh giá & Khiếu nại
INSERT INTO Evaluation (Buyer_ID, Variant_ID, Rating, Content, Created_At, Created_By, Updated_At, Updated_By) VALUES
(5, 1, 5, N'Sách in rất đẹp, bìa dày dặn, kiến thức chuẩn giáo trình DBMS của trường!', '2026-10-30 10:00:00', 5, '2026-10-30 10:00:00', 5);

INSERT INTO Evaluation_Image (Evaluate_ID, Image) VALUES
(1, 'https://bkpee.vn/img/review/sach-thuc-te-1.jpg'),
(1, 'https://bkpee.vn/img/review/sach-thuc-te-2.jpg');

INSERT INTO Report (Reporter_ID, Reported_ID, Admin_ID, Reason, Description, Status, Resolved_At, Created_At, Created_By, Updated_At, Updated_By) VALUES
(5, 4, 1, N'Tư vấn sai thông tin sản phẩm', N'Shop hẹn bảo hành 24 tháng nhưng tem chỉ ghi 12 tháng.', N'RESOLVED', '2026-10-28 17:00:00', '2026-10-28 08:00:00', 5, '2026-10-28 17:00:00', 1);

INSERT INTO Report_Image (Report_ID, Image) VALUES
(1, 'https://bkpee.vn/img/report/anh-chup-tem-bao-hanh.jpg');
GO

PRINT N'Hoàn tất nạp dữ liệu mẫu nhỏ!';
GO
