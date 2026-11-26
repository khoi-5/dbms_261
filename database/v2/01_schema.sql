-- BKPEE V2 - SQL Server schema (28 bang).
-- Chay ca file trong SSMS (F5): tu tao BKPEE_DB neu chua co,
-- neu da co thi xoa va tao lai 28 bang BKPEE (MAT DU LIEU CU).
-- Sau do chay 02_seed_large.sql de nap du lieu mau.

USE master;
GO
IF DB_ID(N'BKPEE_DB') IS NULL
    CREATE DATABASE BKPEE_DB;
GO
USE BKPEE_DB;
GO

SET NOCOUNT ON;
SET XACT_ABORT ON;
SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
SET ANSI_PADDING ON;
SET ANSI_WARNINGS ON;
SET ARITHABORT ON;
SET CONCAT_NULL_YIELDS_NULL ON;
SET NUMERIC_ROUNDABORT OFF;
BEGIN TRY
BEGIN TRANSACTION;
-- Fixed DDL batches compile after the preceding DROP/CREATE, within this transaction.
-- Dynamic SQL is constant text; it does not change database context.
DROP TABLE IF EXISTS dbo.Report_Image;
DROP TABLE IF EXISTS dbo.Report;
DROP TABLE IF EXISTS dbo.Evaluation_Image;
DROP TABLE IF EXISTS dbo.Evaluation;
DROP TABLE IF EXISTS dbo.Payment_Information;
DROP TABLE IF EXISTS dbo.Shop_Order_Item;
DROP TABLE IF EXISTS dbo.Shop_Order;
DROP TABLE IF EXISTS dbo.[Order];
DROP TABLE IF EXISTS dbo.Promotion_Apply;
DROP TABLE IF EXISTS dbo.Voucher;
DROP TABLE IF EXISTS dbo.Coupon;
DROP TABLE IF EXISTS dbo.Promotion;
DROP TABLE IF EXISTS dbo.Shipping_Provider;
DROP TABLE IF EXISTS dbo.Cart_Item;
DROP TABLE IF EXISTS dbo.Cart;
DROP TABLE IF EXISTS dbo.Product_Variant;
DROP TABLE IF EXISTS dbo.Book_Author;
DROP TABLE IF EXISTS dbo.Books;
DROP TABLE IF EXISTS dbo.Clothes;
DROP TABLE IF EXISTS dbo.Electronics;
DROP TABLE IF EXISTS dbo.Product;
DROP TABLE IF EXISTS dbo.Category;
DROP TABLE IF EXISTS dbo.Buyer_Infor;
DROP TABLE IF EXISTS dbo.Buyer;
DROP TABLE IF EXISTS dbo.Seller;
DROP TABLE IF EXISTS dbo.Admin;
DROP TABLE IF EXISTS dbo.[User];
DROP TABLE IF EXISTS dbo.Account;

-- ==============================================================================
-- 3. TẠO CÁC BẢNG (Thứ tự từ bảng cha đến bảng con)
-- ==============================================================================

-- Bảng 1: Account (Tài khoản gốc của toàn hệ thống)
EXEC sys.sp_executesql N'CREATE TABLE Account (
    Account_ID INT IDENTITY(1,1) PRIMARY KEY,
    Username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    FName NVARCHAR(50) NOT NULL,
    LName NVARCHAR(50) NOT NULL,
    Phone VARCHAR(20) NOT NULL UNIQUE,
    Account_Status NVARCHAR(30) NOT NULL DEFAULT N''ACTIVE'',
    Email VARCHAR(100) NOT NULL UNIQUE,
    Gender NVARCHAR(10) NULL,
    avatar NVARCHAR(500) NULL,
    Address NVARCHAR(255) NULL,
    CCCD VARCHAR(20) NULL UNIQUE,
    Date_Of_Birth DATE NULL,
    Created_At DATETIME2 NOT NULL DEFAULT GETDATE(),
    Created_By INT NULL,
    Updated_At DATETIME2 NOT NULL DEFAULT GETDATE(),
    Updated_By INT NULL,
    CONSTRAINT CK_Account_Status CHECK (Account_Status IN (N''ACTIVE'', N''SUSPENDED'', N''LOCKED'', N''INACTIVE'')),
    CONSTRAINT CK_Account_Gender CHECK (Gender IN (N''Nam'', N''Nữ'', ''Nam'', ''Nu'', ''Male'', ''Female'', ''Other'', N''Khác''))
);';

-- Bảng 2: User (Kế thừa từ Account - dùng [User] vì USER là từ khóa hệ thống T-SQL)
EXEC sys.sp_executesql N'CREATE TABLE [User] (
    Account_ID INT PRIMARY KEY,
    Trust_Score INT NOT NULL DEFAULT 100,
    CONSTRAINT FK_User_Account FOREIGN KEY (Account_ID) REFERENCES Account(Account_ID) ON DELETE CASCADE,
    CONSTRAINT CK_User_TrustScore CHECK (Trust_Score >= 0)
);';

-- Bảng 3: Admin (Quản trị viên, kế thừa từ Account)
EXEC sys.sp_executesql N'CREATE TABLE Admin (
    Account_ID INT PRIMARY KEY,
    Admin_Role NVARCHAR(50) NOT NULL DEFAULT N''SUPER_ADMIN'',
    CONSTRAINT FK_Admin_Account FOREIGN KEY (Account_ID) REFERENCES Account(Account_ID) ON DELETE CASCADE
);';

-- Bảng 4: Buyer (Người mua hàng, kế thừa từ User)
EXEC sys.sp_executesql N'CREATE TABLE Buyer (
    Account_ID INT PRIMARY KEY,
    CONSTRAINT FK_Buyer_User FOREIGN KEY (Account_ID) REFERENCES [User](Account_ID) ON DELETE CASCADE
);';

-- Bảng 5: Buyer_Infor (Sổ địa chỉ nhận hàng của Buyer - thuộc tính đa trị)
EXEC sys.sp_executesql N'CREATE TABLE Buyer_Infor (
    Buyer_ID INT NOT NULL,
    Address NVARCHAR(255) NOT NULL,
    Receiver_Name NVARCHAR(100) NOT NULL,
    Phone VARCHAR(20) NOT NULL,
    CONSTRAINT PK_Buyer_Infor PRIMARY KEY (Buyer_ID, Address),
    CONSTRAINT FK_BuyerInfor_Buyer FOREIGN KEY (Buyer_ID) REFERENCES Buyer(Account_ID) ON DELETE CASCADE
);';

-- Bảng 6: Seller (Người bán / Shop, kế thừa từ User)
EXEC sys.sp_executesql N'CREATE TABLE Seller (
    Account_ID INT PRIMARY KEY,
    Shop_Name NVARCHAR(100) NOT NULL UNIQUE,
    Bank_Name NVARCHAR(100) NOT NULL,
    Bank_Account_Holder NVARCHAR(100) NOT NULL,
    Bank_Account_Number VARCHAR(50) NOT NULL,
    Bank_Branch NVARCHAR(100) NULL,
    CONSTRAINT FK_Seller_User FOREIGN KEY (Account_ID) REFERENCES [User](Account_ID) ON DELETE CASCADE
);';

-- Bảng 7: Cart (Giỏ hàng liên kết 1:1 với Buyer)
EXEC sys.sp_executesql N'CREATE TABLE Cart (
    Cart_ID INT IDENTITY(1,1) PRIMARY KEY,
    Total_product INT NOT NULL DEFAULT 0,
    Buyer_ID INT NOT NULL UNIQUE,
    Created_At DATETIME2 NOT NULL DEFAULT GETDATE(),
    Created_By INT NULL,
    Updated_At DATETIME2 NOT NULL DEFAULT GETDATE(),
    Updated_By INT NULL,
    CONSTRAINT FK_Cart_Buyer FOREIGN KEY (Buyer_ID) REFERENCES Buyer(Account_ID) ON DELETE CASCADE,
    CONSTRAINT CK_Cart_TotalProduct CHECK (Total_product >= 0)
);';

-- Bảng 8: Category (Danh mục sản phẩm, hỗ trợ phân cấp đệ quy cha-con)
EXEC sys.sp_executesql N'CREATE TABLE Category (
    Category_ID INT IDENTITY(1,1) PRIMARY KEY,
    Category_Name NVARCHAR(100) NOT NULL UNIQUE,
    Parent_Category_ID INT NULL,
    Target_Type VARCHAR(30) NOT NULL DEFAULT ''GENERAL'',
    Admin_ID INT NULL,
    Created_At DATETIME2 NOT NULL DEFAULT GETDATE(),
    Created_By INT NULL,
    Updated_At DATETIME2 NOT NULL DEFAULT GETDATE(),
    Updated_By INT NULL,
    CONSTRAINT FK_Category_Parent FOREIGN KEY (Parent_Category_ID) REFERENCES Category(Category_ID),
    CONSTRAINT FK_Category_Admin FOREIGN KEY (Admin_ID) REFERENCES Admin(Account_ID),
    CONSTRAINT CK_Category_TargetType CHECK (Target_Type IN (''BOOK'', ''CLOTHES'', ''ELECTRONICS'', ''GENERAL''))
);';

-- Bảng 9: Product (Sản phẩm chung do Seller đăng bán)
EXEC sys.sp_executesql N'CREATE TABLE Product (
    Product_ID INT IDENTITY(1,1) PRIMARY KEY,
    Seller_ID INT NOT NULL,
    Category_ID INT NOT NULL,
    Product_Name NVARCHAR(255) NOT NULL,
    Description NVARCHAR(MAX) NULL,
    Manufacturer NVARCHAR(100) NULL,
    Created_At DATETIME2 NOT NULL DEFAULT GETDATE(),
    Created_By INT NULL,
    Updated_At DATETIME2 NOT NULL DEFAULT GETDATE(),
    Updated_By INT NULL,
    CONSTRAINT FK_Product_Seller FOREIGN KEY (Seller_ID) REFERENCES Seller(Account_ID),
    CONSTRAINT FK_Product_Category FOREIGN KEY (Category_ID) REFERENCES Category(Category_ID)
);';

-- Bảng 10: Books (Kế thừa từ Product: Sách)
EXEC sys.sp_executesql N'CREATE TABLE Books (
    Product_ID INT PRIMARY KEY,
    Publisher NVARCHAR(150) NOT NULL,
    CONSTRAINT FK_Books_Product FOREIGN KEY (Product_ID) REFERENCES Product(Product_ID) ON DELETE CASCADE
);';

-- Bảng 11: Book_Author (Tác giả viết sách - thuộc tính đa trị)
EXEC sys.sp_executesql N'CREATE TABLE Book_Author (
    Product_ID INT NOT NULL,
    Author_Name NVARCHAR(100) NOT NULL,
    CONSTRAINT PK_Book_Author PRIMARY KEY (Product_ID, Author_Name),
    CONSTRAINT FK_BookAuthor_Books FOREIGN KEY (Product_ID) REFERENCES Books(Product_ID) ON DELETE CASCADE
);';

-- Bảng 12: Clothes (Kế thừa từ Product: Quần áo / Thời trang)
EXEC sys.sp_executesql N'CREATE TABLE Clothes (
    Product_ID INT PRIMARY KEY,
    Material NVARCHAR(100) NOT NULL,
    CONSTRAINT FK_Clothes_Product FOREIGN KEY (Product_ID) REFERENCES Product(Product_ID) ON DELETE CASCADE
);';

-- Bảng 13: Electronics (Kế thừa từ Product: Hàng điện tử)
EXEC sys.sp_executesql N'CREATE TABLE Electronics (
    Product_ID INT PRIMARY KEY,
    Warranty_ID VARCHAR(50) NULL,
    Warranty_Time NVARCHAR(50) NULL,
    CONSTRAINT FK_Electronics_Product FOREIGN KEY (Product_ID) REFERENCES Product(Product_ID) ON DELETE CASCADE
);';

-- Bảng 14: Product_Variant (Biến thể sản phẩm: size, màu, giá, tồn kho)
EXEC sys.sp_executesql N'CREATE TABLE Product_Variant (
    Variant_ID INT IDENTITY(1,1) PRIMARY KEY,
    Product_ID INT NOT NULL,
    Price DECIMAL(18,2) NOT NULL,
    Is_Active BIT NOT NULL DEFAULT 1,
    Quantity_Stock INT NOT NULL DEFAULT 0,
    Variant_Name NVARCHAR(100) NULL,
    Image NVARCHAR(500) NULL,
    CONSTRAINT FK_Variant_Product FOREIGN KEY (Product_ID) REFERENCES Product(Product_ID) ON DELETE CASCADE,
    CONSTRAINT CK_Variant_Price CHECK (Price >= 0),
    CONSTRAINT CK_Variant_Stock CHECK (Quantity_Stock >= 0)
);';

-- Bảng 15: Cart_Item (Mục sản phẩm biến thể trong giỏ hàng)
EXEC sys.sp_executesql N'CREATE TABLE Cart_Item (
    Cart_ID INT NOT NULL,
    Variant_ID INT NOT NULL,
    Quantity INT NOT NULL DEFAULT 1,
    CONSTRAINT PK_Cart_Item PRIMARY KEY (Cart_ID, Variant_ID),
    CONSTRAINT FK_CartItem_Cart FOREIGN KEY (Cart_ID) REFERENCES Cart(Cart_ID) ON DELETE CASCADE,
    CONSTRAINT FK_CartItem_Variant FOREIGN KEY (Variant_ID) REFERENCES Product_Variant(Variant_ID),
    CONSTRAINT CK_CartItem_Quantity CHECK (Quantity > 0)
);';

-- Bảng 16: Shipping_Provider (Đơn vị vận chuyển do Admin quản trị)
EXEC sys.sp_executesql N'CREATE TABLE Shipping_Provider (
    Provider_ID INT IDENTITY(1,1) PRIMARY KEY,
    Provider_Name NVARCHAR(100) NOT NULL UNIQUE,
    Phone VARCHAR(20) NOT NULL,
    Address NVARCHAR(255) NULL,
    Admin_ID INT NULL,
    Base_Shipping_Fee DECIMAL(18,2) NOT NULL DEFAULT 0,
    Created_At DATETIME2 NOT NULL DEFAULT GETDATE(),
    Created_By INT NULL,
    Updated_At DATETIME2 NOT NULL DEFAULT GETDATE(),
    Updated_By INT NULL,
    CONSTRAINT FK_ShippingProvider_Admin FOREIGN KEY (Admin_ID) REFERENCES Admin(Account_ID),
    CONSTRAINT CK_Provider_Fee CHECK (Base_Shipping_Fee >= 0)
);';

-- Bảng 17: Promotion (Chương trình khuyến mãi của Seller)
EXEC sys.sp_executesql N'CREATE TABLE Promotion (
    Promotion_ID INT IDENTITY(1,1) PRIMARY KEY,
    Quantity INT NOT NULL DEFAULT 0,
    Start_Date DATETIME2 NOT NULL,
    Expiration_Date DATETIME2 NOT NULL,
    Min_Bill DECIMAL(18,2) NOT NULL DEFAULT 0,
    Type NVARCHAR(50) NOT NULL, -- ''COUPON'' hoặc ''VOUCHER''
    Seller_ID INT NOT NULL,
    Created_At DATETIME2 NOT NULL DEFAULT GETDATE(),
    Created_By INT NULL,
    Updated_At DATETIME2 NOT NULL DEFAULT GETDATE(),
    Updated_By INT NULL,
    CONSTRAINT FK_Promotion_Seller FOREIGN KEY (Seller_ID) REFERENCES Seller(Account_ID),
    CONSTRAINT CK_Promotion_Quantity CHECK (Quantity >= 0),
    CONSTRAINT CK_Promotion_MinBill CHECK (Min_Bill >= 0),
    CONSTRAINT CK_Promotion_Date CHECK (Expiration_Date >= Start_Date)
);';

-- Bảng 18: Coupon (Khuyến mãi giảm theo %)
EXEC sys.sp_executesql N'CREATE TABLE Coupon (
    Promotion_ID INT PRIMARY KEY,
    percent_discount DECIMAL(5,2) NOT NULL,
    max_discount DECIMAL(18,2) NULL,
    CONSTRAINT FK_Coupon_Promotion FOREIGN KEY (Promotion_ID) REFERENCES Promotion(Promotion_ID) ON DELETE CASCADE,
    CONSTRAINT CK_Coupon_Percent CHECK (percent_discount > 0 AND percent_discount <= 100),
    CONSTRAINT CK_Coupon_MaxDiscount CHECK (max_discount IS NULL OR max_discount >= 0)
);';

-- Bảng 19: Voucher (Khuyến mãi giảm tiền trực tiếp)
EXEC sys.sp_executesql N'CREATE TABLE Voucher (
    Promotion_ID INT PRIMARY KEY,
    voucher_value DECIMAL(18,2) NOT NULL,
    CONSTRAINT FK_Voucher_Promotion FOREIGN KEY (Promotion_ID) REFERENCES Promotion(Promotion_ID) ON DELETE CASCADE,
    CONSTRAINT CK_Voucher_Value CHECK (voucher_value > 0)
);';

-- Bảng 20: Promotion_Apply (Mối quan hệ N-N: Biến thể sản phẩm áp dụng khuyến mãi)
EXEC sys.sp_executesql N'CREATE TABLE Promotion_Apply (
    Variant_ID INT NOT NULL,
    Promotion_ID INT NOT NULL,
    CONSTRAINT PK_Promotion_Apply PRIMARY KEY (Variant_ID, Promotion_ID),
    CONSTRAINT FK_PromotionApply_Variant FOREIGN KEY (Variant_ID) REFERENCES Product_Variant(Variant_ID) ON DELETE CASCADE,
    CONSTRAINT FK_PromotionApply_Promotion FOREIGN KEY (Promotion_ID) REFERENCES Promotion(Promotion_ID) ON DELETE CASCADE
);';

-- Bảng 21: [Order] (Đơn đặt hàng tổng - dùng [Order] vì ORDER là từ khóa ORDER BY)
EXEC sys.sp_executesql N'CREATE TABLE [Order] (
    Order_ID INT IDENTITY(1,1) PRIMARY KEY,
    Order_Time DATETIME2 NOT NULL DEFAULT GETDATE(),
    Total_Price DECIMAL(18,2) NOT NULL DEFAULT 0,
    Delivery_Address NVARCHAR(255) NOT NULL,
    Buyer_ID INT NOT NULL,
    Created_At DATETIME2 NOT NULL DEFAULT GETDATE(),
    Created_By INT NULL,
    Updated_At DATETIME2 NOT NULL DEFAULT GETDATE(),
    Updated_By INT NULL,
    Checkout_Key VARCHAR(64) NULL,
    Checkout_Request_Hash BINARY(32) NULL,
    Receiver_Name NVARCHAR(100) NULL,
    Receiver_Phone VARCHAR(20) NULL,
    CONSTRAINT FK_Order_Buyer FOREIGN KEY (Buyer_ID) REFERENCES Buyer(Account_ID),
    CONSTRAINT CK_Order_TotalPrice CHECK (Total_Price >= 0)
);';

-- Bảng 22: Shop_Order (Đơn hàng con phân theo từng Shop trong đơn hàng tổng)
EXEC sys.sp_executesql N'CREATE TABLE Shop_Order (
    Shop_Order_ID INT IDENTITY(1,1) PRIMARY KEY,
    Order_ID INT NOT NULL,
    Seller_ID INT NOT NULL,
    Provider_ID INT NOT NULL,
    Tracking_Number VARCHAR(100) NULL,
    Delivery_Status NVARCHAR(50) NOT NULL DEFAULT N''PENDING'',
    Shipping_Fee DECIMAL(18,2) NOT NULL DEFAULT 0,
    Shipped_At DATETIME2 NULL,
    Delivered_At DATETIME2 NULL,
    Stock_Deducted BIT NOT NULL CONSTRAINT DF_ShopOrder_StockDeducted DEFAULT (0),
    Buyer_Received_At DATETIME2 NULL,
    Promotion_ID_Snapshot INT NULL,
    Discount_Amount DECIMAL(18,2) NOT NULL CONSTRAINT DF_ShopOrder_DiscountAmount DEFAULT (0),
    CONSTRAINT CK_ShopOrder_DiscountAmount CHECK (Discount_Amount >= 0),
    CONSTRAINT FK_ShopOrder_Order FOREIGN KEY (Order_ID) REFERENCES [Order](Order_ID) ON DELETE CASCADE,
    CONSTRAINT FK_ShopOrder_Seller FOREIGN KEY (Seller_ID) REFERENCES Seller(Account_ID),
    CONSTRAINT FK_ShopOrder_Provider FOREIGN KEY (Provider_ID) REFERENCES Shipping_Provider(Provider_ID),
    CONSTRAINT CK_ShopOrder_Status CHECK (Delivery_Status IN (N''PENDING'', N''CONFIRMED'', N''SHIPPING'', N''DELIVERED'', N''CANCELLED'', N''RETURNED'')),
    CONSTRAINT CK_ShopOrder_ShippingFee CHECK (Shipping_Fee >= 0)
);';

-- Bảng 23: Shop_Order_Item (Chi tiết từng món hàng trong Shop_Order)
EXEC sys.sp_executesql N'CREATE TABLE Shop_Order_Item (
    Shop_Order_ID INT NOT NULL,
    Variant_ID INT NOT NULL,
    Quantity INT NOT NULL DEFAULT 1,
    Purchase_Price DECIMAL(18,2) NOT NULL,
    Product_Name_Snapshot NVARCHAR(255) NULL,
    Variant_Name_Snapshot NVARCHAR(100) NULL,
    CONSTRAINT PK_Shop_Order_Item PRIMARY KEY (Shop_Order_ID, Variant_ID),
    CONSTRAINT FK_ShopOrderItem_ShopOrder FOREIGN KEY (Shop_Order_ID) REFERENCES Shop_Order(Shop_Order_ID) ON DELETE CASCADE,
    CONSTRAINT FK_ShopOrderItem_Variant FOREIGN KEY (Variant_ID) REFERENCES Product_Variant(Variant_ID),
    CONSTRAINT CK_ShopOrderItem_Quantity CHECK (Quantity > 0),
    CONSTRAINT CK_ShopOrderItem_Price CHECK (Purchase_Price >= 0)
);';

-- Bảng 24: Payment_Information (Thông tin giao dịch thanh toán của Order)
EXEC sys.sp_executesql N'CREATE TABLE Payment_Information (
    Payment_ID INT IDENTITY(1,1) PRIMARY KEY,
    Order_ID INT NOT NULL,
    Transaction_Code VARCHAR(100) NOT NULL UNIQUE,
    Payment_Method NVARCHAR(50) NOT NULL DEFAULT N''COD'',
    Payment_Status NVARCHAR(50) NOT NULL DEFAULT N''PENDING'',
    Payment_Time DATETIME2 NOT NULL DEFAULT GETDATE(),
    Paid_At DATETIME2 NULL,
    Is_Simulated BIT NOT NULL CONSTRAINT DF_Payment_IsSimulated DEFAULT (0),
    CONSTRAINT FK_Payment_Order FOREIGN KEY (Order_ID) REFERENCES [Order](Order_ID) ON DELETE CASCADE,
    CONSTRAINT CK_Payment_Method CHECK (Payment_Method IN (N''COD'', N''VNPAY'', N''MOMO'', N''BANKING'', N''CREDIT_CARD'')),
    CONSTRAINT CK_Payment_Status CHECK (Payment_Status IN (N''PENDING'', N''COMPLETED'', N''FAILED'', N''REFUNDED'', N''CANCELLED''))
);';

-- Bảng 25: Evaluation (Đánh giá nhận xét sản phẩm của Buyer)
EXEC sys.sp_executesql N'CREATE TABLE Evaluation (
    Evaluate_ID INT IDENTITY(1,1) PRIMARY KEY,
    Buyer_ID INT NOT NULL,
    Variant_ID INT NOT NULL,
    Rating INT NOT NULL,
    Content NVARCHAR(MAX) NULL,
    Created_At DATETIME2 NOT NULL DEFAULT GETDATE(),
    Created_By INT NULL,
    Updated_At DATETIME2 NOT NULL DEFAULT GETDATE(),
    Updated_By INT NULL,
    CONSTRAINT FK_Evaluation_Buyer FOREIGN KEY (Buyer_ID) REFERENCES Buyer(Account_ID),
    CONSTRAINT FK_Evaluation_Variant FOREIGN KEY (Variant_ID) REFERENCES Product_Variant(Variant_ID),
    CONSTRAINT CK_Evaluation_Rating CHECK (Rating BETWEEN 1 AND 5)
);';

-- Bảng 26: Evaluation_Image (Ảnh đính kèm trong bài đánh giá - thuộc tính đa trị)
EXEC sys.sp_executesql N'CREATE TABLE Evaluation_Image (
    Evaluate_ID INT NOT NULL,
    Image VARCHAR(500) NOT NULL,
    CONSTRAINT PK_Evaluation_Image PRIMARY KEY (Evaluate_ID, Image),
    CONSTRAINT FK_EvalImage_Evaluation FOREIGN KEY (Evaluate_ID) REFERENCES Evaluation(Evaluate_ID) ON DELETE CASCADE
);';

-- Bảng 27: Report (Báo cáo khiếu nại vi phạm giữa các tài khoản)
EXEC sys.sp_executesql N'CREATE TABLE Report (
    Report_ID INT IDENTITY(1,1) PRIMARY KEY,
    Reporter_ID INT NOT NULL,
    Reported_ID INT NOT NULL,
    Admin_ID INT NULL,
    Reason NVARCHAR(255) NOT NULL,
    Description NVARCHAR(MAX) NULL,
    Status NVARCHAR(50) NOT NULL DEFAULT N''PENDING'',
    Resolved_At DATETIME2 NULL,
    Created_At DATETIME2 NOT NULL DEFAULT GETDATE(),
    Created_By INT NULL,
    Updated_At DATETIME2 NOT NULL DEFAULT GETDATE(),
    Updated_By INT NULL,
    CONSTRAINT FK_Report_Reporter FOREIGN KEY (Reporter_ID) REFERENCES Account(Account_ID),
    CONSTRAINT FK_Report_Reported FOREIGN KEY (Reported_ID) REFERENCES Account(Account_ID),
    CONSTRAINT FK_Report_Admin FOREIGN KEY (Admin_ID) REFERENCES Admin(Account_ID),
    CONSTRAINT CK_Report_Status CHECK (Status IN (N''PENDING'', N''IN_PROGRESS'', N''RESOLVED'', N''REJECTED''))
);';

-- Bảng 28: Report_Image (Ảnh minh chứng đính kèm khiếu nại - thuộc tính đa trị)
EXEC sys.sp_executesql N'CREATE TABLE Report_Image (
    Report_ID INT NOT NULL,
    Image VARCHAR(500) NOT NULL,
    CONSTRAINT PK_Report_Image PRIMARY KEY (Report_ID, Image),
    CONSTRAINT FK_ReportImage_Report FOREIGN KEY (Report_ID) REFERENCES Report(Report_ID) ON DELETE CASCADE
);';

-- ==============================================================================
-- 4. TẠO INDEXES TỐI ƯU TRUY VẤN
-- ==============================================================================
-- INDEX IX_Product_Seller | Bảng dbo.Product | Cột Seller_ID | Tra cứu sản phẩm theo người bán.
EXEC sys.sp_executesql N'CREATE NONCLUSTERED INDEX IX_Product_Seller ON Product(Seller_ID);';
-- INDEX IX_Product_Category | Bảng dbo.Product | Cột Category_ID | Lọc sản phẩm theo danh mục.
EXEC sys.sp_executesql N'CREATE NONCLUSTERED INDEX IX_Product_Category ON Product(Category_ID);';
-- INDEX IX_Variant_Product | Bảng dbo.Product_Variant | Cột Product_ID | Lấy các biến thể của sản phẩm.
EXEC sys.sp_executesql N'CREATE NONCLUSTERED INDEX IX_Variant_Product ON Product_Variant(Product_ID);';
-- INDEX IX_ShopOrder_Order | Bảng dbo.Shop_Order | Cột Order_ID | Lấy đơn hàng con theo đơn tổng.
EXEC sys.sp_executesql N'CREATE NONCLUSTERED INDEX IX_ShopOrder_Order ON Shop_Order(Order_ID);';
-- INDEX IX_ShopOrder_Seller | Bảng dbo.Shop_Order | Cột Seller_ID | Truy vấn đơn hàng theo người bán.
EXEC sys.sp_executesql N'CREATE NONCLUSTERED INDEX IX_ShopOrder_Seller ON Shop_Order(Seller_ID);';
-- INDEX IX_ShopOrderItem_Variant | Bảng dbo.Shop_Order_Item | Cột Variant_ID | Tra cứu các dòng đơn theo biến thể.
EXEC sys.sp_executesql N'CREATE NONCLUSTERED INDEX IX_ShopOrderItem_Variant ON Shop_Order_Item(Variant_ID);';
-- INDEX IX_Evaluation_Variant | Bảng dbo.Evaluation | Cột Variant_ID | Tra cứu đánh giá theo biến thể.
EXEC sys.sp_executesql N'CREATE NONCLUSTERED INDEX IX_Evaluation_Variant ON Evaluation(Variant_ID);';
-- INDEX IX_Report_Reporter | Bảng dbo.Report | Cột Reporter_ID | Tra cứu khiếu nại theo người gửi.
EXEC sys.sp_executesql N'CREATE NONCLUSTERED INDEX IX_Report_Reporter ON Report(Reporter_ID);';
-- INDEX IX_Report_Reported | Bảng dbo.Report | Cột Reported_ID | Tra cứu khiếu nại theo người bị báo cáo.
EXEC sys.sp_executesql N'CREATE NONCLUSTERED INDEX IX_Report_Reported ON Report(Reported_ID);';

-- Indexes from order_migration.sql.
-- INDEX UX_ShopOrder_Tracking_NotNull | Bảng dbo.Shop_Order | Cột Tracking_Number | UNIQUE có điều kiện: chỉ các mã vận đơn khác NULL.
EXEC sys.sp_executesql N'CREATE UNIQUE INDEX UX_ShopOrder_Tracking_NotNull ON dbo.Shop_Order(Tracking_Number) WHERE Tracking_Number IS NOT NULL;';
-- INDEX UX_Order_Buyer_CheckoutKey | Bảng dbo.[Order] | Cột (Buyer_ID, Checkout_Key) | UNIQUE có điều kiện: chống tạo trùng checkout.
EXEC sys.sp_executesql N'CREATE UNIQUE INDEX UX_Order_Buyer_CheckoutKey ON dbo.[Order](Buyer_ID, Checkout_Key) WHERE Checkout_Key IS NOT NULL;';
-- INDEX UX_Payment_Order | Bảng dbo.Payment_Information | Cột Order_ID | UNIQUE: tối đa một bản ghi thanh toán cho mỗi đơn.
EXEC sys.sp_executesql N'CREATE UNIQUE INDEX UX_Payment_Order ON dbo.Payment_Information(Order_ID);';
-- INDEX IX_Order_Buyer_Time | Bảng dbo.[Order] | Cột (Buyer_ID, Order_Time DESC, Order_ID DESC) | Lịch sử đơn theo người mua.
EXEC sys.sp_executesql N'CREATE INDEX IX_Order_Buyer_Time ON dbo.[Order](Buyer_ID, Order_Time DESC, Order_ID DESC);';
-- INDEX IX_ShopOrder_Seller_Status_Order | Bảng dbo.Shop_Order | Cột (Seller_ID, Delivery_Status, Order_ID) | Lọc đơn theo seller và trạng thái.
EXEC sys.sp_executesql N'CREATE INDEX IX_ShopOrder_Seller_Status_Order ON dbo.Shop_Order(Seller_ID, Delivery_Status, Order_ID);';

COMMIT TRANSACTION;
PRINT N'V2 schema created in BKPEE_DB.';
END TRY
BEGIN CATCH
    IF XACT_STATE() <> 0 ROLLBACK TRANSACTION;
    THROW;
END CATCH;
