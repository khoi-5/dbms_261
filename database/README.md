# Hướng Dẫn Cơ Sở Dữ Liệu SQL Server & MongoDB - Hệ Thống BKPEE

Thư mục này chứa toàn bộ mã nguồn SQL Server và MongoDB, script khởi tạo, sinh dữ liệu lớn và các kịch bản demo lý thuyết môn học Hệ Quản Trị Cơ Sở Dữ Liệu (DBMS).

---

## 1. Giải Thích: Tại Sao Một Số Bảng & Cột Phải Đặt Trong Dấu Ngoặc Vuông `[...]`?

Trong Microsoft SQL Server (T-SQL), cặp dấu ngoặc vuông `[...]` được gọi là **Delimited Identifier (Định danh phân cách)**.

### Lý do kỹ thuật:
1. **Từ khóa dành riêng của hệ thống (Reserved Keywords):**
   * **`USER`**: Trong SQL Server, `USER` là một hàm hệ thống trả về tên của database user hiện tại (`SELECT USER;`). Nếu viết `CREATE TABLE User` hay `SELECT * FROM User`, SQL Server sẽ lập tức báo lỗi cú pháp:
     ```
     Msg 156, Level 15, State 1: Incorrect syntax near the keyword 'User'.
     ```
   * **`ORDER`**: `ORDER` là từ khóa bắt buộc trong mệnh đề sắp xếp `ORDER BY`. Nếu viết `CREATE TABLE Order`, SQL Server sẽ hiểu nhầm bạn đang viết dở câu lệnh sắp xếp và báo lỗi:
     ```
     Msg 156, Level 15, State 1: Incorrect syntax near the keyword 'Order'.
     ```
2. **Tác dụng của `[...]`:**
   * Dấu `[...]` báo cho SQL Parser biết: *"Đây là tên bảng/cột do lập trình viên tự đặt, hãy xử lý nó như một danh xưng thông thường, không phải câu lệnh của SQL Server."*
   * Nhờ có `[User]` và `[Order]`, cơ sở dữ liệu giữ được **đúng 100% tên thực thể trên sơ đồ ERD và Mapping Diagram** của bạn mà không cần phải đổi thành `App_User` hay `Orders`.

> 💡 **Đã tối ưu:** Trong file `01_schema.sql` mới, các thuộc tính không bắt buộc như `password`, `Address`, `Image`, `Description`, `Admin`... đã được **bỏ hoàn toàn dấu ngoặc vuông**, code nhìn cực kỳ thoáng và chuẩn mực. Chỉ duy nhất `[User]` và `[Order]` giữ dấu ngoặc theo đúng chuẩn T-SQL.

---

## 2. Cấu Trúc Thư Mục `database/`

```
database/
├── 01_schema.sql             # SQL Server: DDL định nghĩa 28 bảng, PK, FK, CHECK, INDEX
├── 02_seed_small.sql         # SQL Server: Dữ liệu mẫu nhỏ (~vài chục dòng, test API & logic)
├── 03_seed_large.sql         # SQL Server: Sinh dữ liệu lớn (~110.000+ dòng chỉ mất 1-2s bằng CTE)
├── setup_mongodb.py          # MongoDB: Script Python sinh dữ liệu nhỏ & lớn tự động (PyMongo)
├── init_mongodb.js           # MongoDB: Script cấu hình Collection & Index & Seed cho mongosh/Compass
├── mongodb_schema_design.md  # Tài liệu kiến trúc: Chuyển đổi 28 bảng SQL -> 9 Collection NoSQL
├── mongodb_queries_demo.js   # Script truy vấn mẫu: Aggregation Pipeline, Text Search, Index Explain
├── setup_database.bat        # File nhấp đúp 1-click chạy tự động cả SQL Server & MongoDB
├── setup_database.ps1        # Script PowerShell linh hoạt có menu chọn chế độ
└── README.md                 # Tài liệu hướng dẫn toàn diện (SQL Server & MongoDB)
```

---

## 3. Hướng Dẫn Khởi Tạo & Nạp Dữ Liệu SQL Server

### Cách 1: Chạy bằng file Batch (Nhanh nhất trên Windows)
1. Nhấp đúp vào file `setup_database.bat`.
2. Chọn số tương ứng:
   * **`1`**: Chỉ tạo cấu trúc 28 bảng SQL Server.
   * **`2`**: Tạo bảng + Nạp dữ liệu nhỏ (Small Seed).
   * **`3`**: Tạo bảng + Nạp dữ liệu lớn (Large Seed ~110.000 dòng).

### Cách 2: Chạy bằng PowerShell
Mở PowerShell tại thư mục `database/`:
```powershell
# Chạy có menu tương tác:
.\setup_database.ps1

# Hoặc chạy thẳng chế độ sinh dữ liệu lớn:
.\setup_database.ps1 -Mode large
```

### Cách 3: Mở trong SQL Server Management Studio (SSMS)
1. Mở SSMS $\rightarrow$ Kết nối tới SQL Server (`localhost`).
2. Mở file `01_schema.sql` $\rightarrow$ Nhấn **F5** (Execute) để tạo bảng.
3. Mở tiếp file `02_seed_small.sql` (hoặc `03_seed_large.sql`) $\rightarrow$ Nhấn **F5** để nạp dữ liệu.

---

## 4. Hướng Dẫn Khởi Tạo & Nạp Dữ Liệu MongoDB

Hệ thống MongoDB chạy trên database `bkpee_db` (`mongodb://localhost:27017/`).

### Cách 1: Chạy bằng file Batch (`setup_database.bat`)
Nhấp đúp `setup_database.bat` và chọn:
* **`4`**: Nạp dữ liệu nhỏ vào MongoDB (`Small Seed`).
* **`5`**: Sinh dữ liệu lớn vào MongoDB (`Large Seed` ~24.341 documents).

### Cách 2: Chạy trực tiếp bằng Python (`setup_mongodb.py`)
Yêu cầu thư viện: `pip install pymongo`
```bash
# 1. Cần di chuyển vào đúng thư mục database:
cd database
# (Nếu đang ở ngoài thư mục gốc D:\DBMS: cd dbms_261/database)

# 2. Nạp dữ liệu mẫu nhỏ (khớp 100% với 02_seed_small.sql):
python setup_mongodb.py --mode small

# 3. Hoặc sinh dữ liệu lớn (khớp 100% với 03_seed_large.sql):
python setup_mongodb.py --mode large
```

### Cách 3: Chạy bằng MongoDB Shell (`mongosh`) hoặc MongoDB Compass
```bash
mongosh "mongodb://localhost:27017/bkpee_db" init_mongodb.js
```
Hoặc trong MongoDB Compass: Vào mục **_Mongosh_** ở thanh dưới cùng $\rightarrow$ copy toàn bộ nội dung file `init_mongodb.js` và dán vào nhấn Enter.

---

## 5. So Sánh Kiến Trúc & Độ Tương Đồng Dữ Liệu (100% Data Parity)

### 5.1. Bảng Đối Chiếu 28 Bảng SQL Server $\rightarrow$ 9 Collections MongoDB

Nhờ đặc tính linh hoạt của mô hình Document NoSQL, **28 bảng quan hệ chuẩn hóa 3NF trong SQL Server** được thiết kế gộp lại một cách tối ưu thành **9 Collections**:

| STT | SQL Server (28 Bảng) | MongoDB (9 Collections) | Kỹ Thuật NoSQL Áp Dụng |
|:---:|---|---|---|
| 1 | `Account`, `Admin`, `[User]`, `Seller`, `Buyer`, `Buyer_Infor` | **`accounts`** | **Single Collection Inheritance**: Gộp thông tin tài khoản, quyền (Roles) và nhúng mảng `addresses` vào trong tài khoản Buyer. |
| 2 | `Category` | **`categories`** | Mô hình **Tree Structure with Parent Reference** (`parent_category_id`). |
| 3 | `Shipping_Provider` | **`shipping_providers`** | Collection độc lập lưu danh sách đơn vị vận chuyển. |
| 4 | `Product`, `Product_Variant`, `Books`, `Book_Author`, `Clothes`, `Electronics` | **`products`** | **Polymorphic Pattern & Embedding**: Nhúng toàn bộ danh sách biến thể (`variants[]`) và thuộc tính đặc thù vào subdocument `attributes`. |
| 5 | `Cart`, `Cart_Item` | **`carts`** | **Embedded Array**: Nhúng trực tiếp danh sách món hàng (`items[]`) vào giỏ hàng. |
| 6 | `Promotion`, `Coupon`, `Voucher`, `Promotion_Apply` | **`promotions`** | Nhúng cấu hình giảm giá (`discount_config`) và mảng ID biến thể áp dụng (`applicable_variant_ids[]`). |
| 7 | `[Order]`, `Shop_Order`, `Shop_Order_Item`, `Payment_Information` | **`orders`** | **Rich Document**: Đơn hàng tổng nhúng mảng các đơn hàng con của Shop (`shop_orders[]`), chi tiết món hàng (`items[]`) và trạng thái thanh toán (`payment`). |
| 8 | `Evaluation`, `Evaluation_Image` | **`evaluations`** | Nhúng mảng hình ảnh thực tế (`images[]`). |
| 9 | `Report`, `Report_Image` | **`reports`** | Nhúng mảng ảnh bằng chứng vi phạm (`evidence_images[]`). |

---

### 5.2. Đối Chiếu Dữ Liệu Mẫu Nhỏ (Small Seed Parity)

Cả hai database đều chứa **chính xác từng đối tượng nghiệp vụ giống nhau 100%**:

| Nghiệp Vụ Mẫu | SQL Server (`02_seed_small.sql`) | MongoDB (`setup_mongodb.py --mode small`) |
|---|---|---|
| **Tài khoản quản trị** | `admin_root` (SUPER_ADMIN) | `admin_root` (SUPER_ADMIN) |
| **Gian hàng sách** | `seller_fahasa` (Fahasa Official Store) | `seller_fahasa` (Fahasa Official Store) |
| **Gian hàng thời trang** | `seller_coolmate` (Coolmate Activewear) | `seller_coolmate` (Coolmate Activewear) |
| **Gian hàng điện tử** | `seller_cellphones` (CellphoneS Flagship) | `seller_cellphones` (CellphoneS Flagship) |
| **Khách hàng** | `buyer_hienle` (2 địa chỉ) & `buyer_khoinguyen` | `buyer_hienle` (2 địa chỉ) & `buyer_khoinguyen` |
| **Sản phẩm Sách** | Giáo trình CSDL ĐHQG (Bìa mềm 120k, Bìa cứng 180k) | Giáo trình CSDL ĐHQG (Bìa mềm 120k, Bìa cứng 180k) |
| **Sản phẩm Quần áo** | Áo Thun QuickDry (Màu Đen L 199k, Trắng M 199k) | Áo Thun QuickDry (Màu Đen L 199k, Trắng M 199k) |
| **Sản phẩm Điện tử** | Tai Nghe Chống Ồn Sony WH-1000XM5 (7.990k) | Tai Nghe Chống Ồn Sony WH-1000XM5 (7.990k) |
| **Khuyến mãi** | Coupon giảm 15% tối đa 50k & Voucher 30k | Coupon giảm 15% tối đa 50k & Voucher 30k |
| **Đơn đặt hàng** | Đơn 540k (1 sách Fahasa 120k + 2 áo Coolmate 398k) | Đơn 540k (1 sách Fahasa 120k + 2 áo Coolmate 398k) |
| **Thanh toán** | Mã `TXN-BKPEE-20261029-001`, VNPAY, COMPLETED | Mã `TXN-BKPEE-20261029-001`, VNPAY, COMPLETED |
| **Đánh giá & Khiếu nại**| Đánh giá 5 sao sách CSDL + Khiếu nại bảo hành | Đánh giá 5 sao sách CSDL + Khiếu nại bảo hành |

---

### 5.3. Đối Chiếu Dữ Liệu Lớn Dùng Demo Lý Thuyết (Large Seed Parity)

Cả hai hệ quản trị đều được nạp dữ liệu khối lượng tương đương:

| Thực Thể / Collection | SQL Server (`03_seed_large.sql`) | MongoDB (`setup_mongodb.py --mode large`) | Ghi Chú |
|---|:---:|:---:|---|
| **Tài Khoản (Accounts)** | **2.001** dòng (Bảng `Account`) | **2.001** documents | 1 Admin + 200 Sellers + 1.800 Buyers |
| **Địa Chỉ Giao Hàng** | **2.700** dòng (Bảng `Buyer_Infor`) | **2.700** subdocuments | Nhúng vào `buyer_profile.addresses` |
| **Danh Mục (Categories)** | **30** dòng | **30** documents | 10 gốc + 20 danh mục con |
| **Đơn Vị Vận Chuyển** | **10** dòng | **10** documents | GHTK, GHN, Viettel Post, v.v. |
| **Sản Phẩm (Products)** | **3.000** dòng (Bảng `Product`) | **3.000** documents | 1.000 Sách, 1.000 Quần Áo, 1.000 Điện Tử |
| **Biến Thể (Variants)** | **9.000** dòng (Bảng `Product_Variant`) | **9.000** subdocuments | Nhúng trực tiếp trong từng `product` |
| **Giỏ Hàng (Carts)** | **1.800** giỏ + **3.000** `Cart_Item` | **1.800** documents | 3.000 items nhúng trong giỏ |
| **Khuyến Mãi (Promotions)** | **500** dòng | **500** documents | 250 Coupon + 250 Voucher |
| **Đơn Hàng (Orders)** | **10.000** `[Order]` | **10.000** documents | Chứa đầy đủ thông tin giao dịch |
| **Đơn Hàng Con (Shop Orders)** | **15.000** `Shop_Order` | **15.000** subdocuments | Nhúng trong mảng `orders.shop_orders` |
| **Chi Tiết Đặt Hàng (Items)** | **35.000** `Shop_Order_Item` | **35.000** subdocuments | Nhúng trong từng shop order |
| **Giao Dịch Thanh Toán** | **10.000** `Payment_Information` | **10.000** subdocuments | Nhúng trong `orders.payment` |
| **Đánh Giá (Evaluations)** | **6.000** dòng | **6.000** documents | Kèm 3.000 link ảnh nhúng |
| **Khiếu Nại (Reports)** | **1.000** dòng | **1.000** documents | Kèm 1.000 ảnh chứng cứ nhúng |
| **TỔNG KHỐI LƯỢNG** | **> 110.000 bản ghi** (28 bảng) | **24.341 documents** (9 collections) | **Đồng bộ logic 100%** |
| **Thời Gian Sinh Dữ Liệu** | **~ 1.34 giây** (T-SQL CTE) | **~ 1.24 giây** (PyMongo Bulk Write) | Cực kỳ nhanh |

---

