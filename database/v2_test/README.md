# Database V2 – So sánh với phiên bản gốc

## 1. Giới thiệu

Thư mục `database/v2_test/` chứa các script khởi tạo database phiên bản V2 cho SQL Server và MongoDB.

Mục đích của V2 là tổng hợp những thay đổi cần thiết để phù hợp với các chức năng hiện tại của hệ thống, đồng thời tách riêng phần tạo cấu trúc và phần nạp dữ liệu mẫu.

**Các file database gốc trong thư mục `database/` được giữ nguyên.**

| File V2 | Chức năng |
|---|---|
| `01_schema_v2.sql` | Tạo cấu trúc SQL Server hoàn chỉnh |
| `02_seed_large_v2.sql` | Nạp dữ liệu mẫu lớn cho SQL Server |
| `03_mongodb_schema_v2.js` | Tạo collection và index MongoDB |
| `04_mongodb_seed_v2.js` | Nạp dữ liệu mẫu lớn cho MongoDB |

## 2. Thay đổi đối với SQL Server

### 2.1. Tổng quan

SQL Server V2 vẫn giữ nguyên **28 bảng** của phiên bản gốc, không tạo thêm hoặc xóa bảng.

Khác biệt chính là V2 tích hợp trực tiếp các thay đổi từ ba file migration:

- `order_migration.sql`
- `buyer_receipt.sql`
- `order_item_variant_snapshot.sql`

Nhờ đó, khi tạo database mới bằng V2, không cần chạy riêng ba migration này.

### 2.2. Những bảng được mở rộng

So với `01_schema.sql`, có **4 bảng được bổ sung tổng cộng 12 cột mới**.

| Bảng | Cột bổ sung | Mục đích |
|---|---|---|
| `Order` | `Checkout_Key` | Nhận diện yêu cầu checkout, tránh tạo đơn trùng khi retry |
| `Order` | `Checkout_Request_Hash` | Kiểm tra nội dung request khi sử dụng lại checkout key |
| `Order` | `Receiver_Name` | Lưu tên người nhận tại thời điểm đặt hàng |
| `Order` | `Receiver_Phone` | Lưu số điện thoại người nhận |
| `Shop_Order` | `Stock_Deducted` | Đánh dấu đơn đã được trừ tồn kho |
| `Shop_Order` | `Buyer_Received_At` | Lưu thời điểm người mua xác nhận nhận hàng |
| `Shop_Order` | `Promotion_ID_Snapshot` | Lưu ID khuyến mãi áp dụng khi đặt hàng |
| `Shop_Order` | `Discount_Amount` | Lưu số tiền giảm giá của đơn hàng thuộc seller |
| `Shop_Order_Item` | `Product_Name_Snapshot` | Giữ tên sản phẩm tại thời điểm mua |
| `Shop_Order_Item` | `Variant_Name_Snapshot` | Giữ tên biến thể tại thời điểm mua |
| `Payment_Information` | `Paid_At` | Lưu thời điểm thanh toán hoàn tất |
| `Payment_Information` | `Is_Simulated` | Phân biệt thanh toán mô phỏng với thanh toán thực |

Ngoài 12 cột mới, backend F11 còn yêu cầu `Product_Variant.Variant_Name`. Cột này **đã tồn tại trong schema gốc**, nên không được tính là cột bổ sung của V2.

Như vậy, V2 đáp ứng đủ **13 cột F11 yêu cầu trên 5 bảng**, trong đó 12 cột mới và 1 cột có sẵn.

### 2.3. Index và ràng buộc thay đổi

Ngoài các cột mới, V2 bổ sung hoặc điều chỉnh một số index và constraint phục vụ Checkout, Payment và quản lý đơn hàng.

| Đối tượng | Thay đổi trong V2 |
|---|---|
| `UX_Order_Buyer_CheckoutKey` | Unique index mới trên `(Buyer_ID, Checkout_Key)` khi key khác `NULL`, ngăn trùng request checkout |
| `UX_Payment_Order` | Unique index mới trên `Payment_Information(Order_ID)`, giới hạn mỗi Order có tối đa một Payment |
| `UX_ShopOrder_Tracking_NotNull` | Thay UNIQUE cũ của `Tracking_Number` bằng unique filtered index, cho phép nhiều đơn chưa có mã vận đơn |
| `IX_Order_Buyer_Time` | Index mới hỗ trợ truy vấn lịch sử đơn hàng theo Buyer và thời gian |
| `IX_ShopOrder_Seller_Status_Order` | Index mới hỗ trợ Seller truy vấn đơn theo trạng thái |
| `Stock_Deducted`, `Discount_Amount`, `Is_Simulated` | Bổ sung giá trị mặc định bằng `0` |
| `CK_ShopOrder_DiscountAmount` | CHECK mới bảo đảm số tiền giảm giá không âm |
| `CK_Payment_Status` | Mở rộng trạng thái thanh toán, bổ sung `CANCELLED` |

Các primary key, foreign key và những ràng buộc khác của schema gốc được giữ nguyên. **Không có foreign key mới** từ ba migration.

### 2.4. Dữ liệu SQL Server

| Nội dung | Seed gốc | Seed V2 |
|---|---|---|
| Nguồn dữ liệu | `03_seed_large.sql` | `02_seed_large_v2.sql` |
| Công thức sinh dữ liệu | Large seed | Giữ nguyên |
| Số lượng dữ liệu | Large seed | Giữ nguyên |
| Cách nạp dữ liệu | Xóa dữ liệu cũ và reseed identity | Chỉ nạp vào database có các bảng rỗng và identity chưa sử dụng |
| Cột mới của F11 | Chưa được xử lý trực tiếp trong seed gốc | Sử dụng `NULL` hoặc `DEFAULT` từ schema V2 |

**Số lượng dữ liệu chính sau khi nạp:**

| Bảng | Số bản ghi |
|---|---:|
| `Account` | 2.001 |
| `Product` | 3.000 |
| `Product_Variant` | 9.000 |
| `Cart` | 2.000 |
| `Cart_Item` | 3.000 |
| `Promotion` | 500 |
| `Order` | 10.000 |
| `Shop_Order` | 15.000 |
| `Shop_Order_Item` | 35.000 |
| `Payment_Information` | 10.000 |

SQL Server V2 chủ yếu thay đổi **cấu trúc hỗ trợ nghiệp vụ và cách khởi tạo an toàn**, không thay đổi quy mô dữ liệu mẫu.

## 3. Thay đổi đối với MongoDB

### 3.1. Cấu trúc và index

Giữ nguyên **9 collection**: `accounts`, `categories`, `shipping_providers`, `products`, `carts`, `promotions`, `orders`, `evaluations`, `reports`. File `03_mongodb_schema_v2.js` và **21 index phụ** giữ nguyên, không thêm validator hay index. Vẫn nhúng profiles/addresses trong account, variants trong product, items trong cart và shop_orders/items/payment trong order.

| Thành phần | MongoDB gốc | MongoDB V2 large |
|---|---|---|
| Công cụ sinh dữ liệu | JavaScript small hoặc Python small/large | JavaScript large, không gọi Python hoặc script gốc |
| Field | Mô hình document gốc; Python có audit fields | Giữ field gốc và audit fields; thêm `carts.total_price` để lưu tổng tiền giỏ, `shop_orders.discount_amount` để tính tổng đơn rõ ràng |
| ID, thời gian | ID số; Python small có ngày hiện tại | ID số cố định, mốc `2026-10-30T00:00:00Z`, mọi ngày sinh bằng UTC, không dùng random |
| Xóa dữ liệu | Script gốc drop collection | Không drop/delete; chỉ nhận 9 collection rỗng với index phù hợp |
| Nạp/kiểm tra | Python gom mảng lớn; thiếu kiểm tra quan hệ | Batch 250 document; preflight kiểm tra ID, unique, tham chiếu và tổng tiền; hậu kiểm đọc lại toàn bộ dữ liệu |

Account demo, username theo quy tắc large seed và bcrypt hash giữ theo nguồn gốc; không tạo mật khẩu hoặc credential mới. Các tài khoản small như `seller_fahasa` không nằm trong bộ large.

### 3.2. Quy mô và đối chiếu SQL large

| Collection MongoDB | Document | Đối chiếu SQL large |
|---|---:|---|
| `accounts` | 2.001 | 1 admin, 200 seller kiêm buyer, 1.800 buyer; 3.000 địa chỉ nhúng |
| `categories` | 30 | 10 gốc, 20 con |
| `shipping_providers` | 10 | 10 đơn vị vận chuyển |
| `products` | 3.000 | 1.000 mỗi loại BOOK/CLOTHES/ELECTRONICS, 9.000 variant nhúng |
| `carts` | 2.000 | 3.000 cart item nhúng; gồm cả giỏ của seller kiêm buyer |
| `promotions` | 500 | 250 coupon, 250 voucher; mỗi promotion liên kết 1 variant đúng seller |
| `orders` | 10.000 | 15.000 shop order, 35.000 item, 10.000 payment nhúng |
| `evaluations` | 6.000 | 3.000 ảnh đánh giá nhúng |
| `reports` | 1.000 | 1.000 ảnh khiếu nại nhúng |
| **Tổng** | **24.541** | Số document không tính riêng phần nhúng |

So với Python large gốc: tăng cart từ 1.800 lên 2.000 để khớp SQL; tăng order item từ 15.000 lên 35.000; sửa parent category và mọi liên kết product/variant/seller sai. So với MongoDB V2 small trước đây: thay toàn bộ fixture 25 document bằng bộ sinh large; không nạp nối small và large.

### 3.3. Quan hệ và tổng tiền: khác biệt còn lại với SQL

- Product/variant giữ cách đánh ID, phân loại, tên, giá và stock theo công thức SQL large. Cart giữ công thức chọn variant và số lượng; `product_id` luôn suy ra từ variant thực.
- Mỗi seller có 15 product/45 variant. Order item và promotion chỉ chọn variant thuộc seller của chúng. Vì SQL gốc có liên kết seller–item/promotion không khớp, MongoDB chủ động sửa cách chọn variant, không sao chép các bất nhất đó.
- `Cart.total_product = SUM(quantity)`; `Cart.total_price = SUM(quantity × variant.price)`. Mỗi order item lưu `purchase_price` và `line_total`; `Order.total_price = SUM_shop(SUM_item(line_total) + shipping_fee - discount_amount)`. Tiền tính bằng số nguyên VNĐ, có kiểm tra safe integer.
- Các order lịch sử **không áp dụng promotion**, `discount_amount = 0`; không trừ lượt promotion khi tạo lịch sử. Stock là số còn lại của fixture demo, không được suy ra bằng cách phát lại các order lịch sử. Phí shipping lấy đúng provider; payment và ngày shipped/delivered phù hợp trạng thái đơn.
- SQL large hiện giữ tổng order, giá mua, shipping và liên kết item theo công thức gốc; MongoDB sửa các điểm trên. Do đó **cùng quy mô không có nghĩa cùng tổng tiền, cùng liên kết hoặc kết quả truy vấn giống 100%**. UTC MongoDB cũng cần quy ước khi so với DATETIME2 không kèm múi giờ của SQL.
- Evaluation tham chiếu một item của order DELIVERED thuộc buyer; report có account hợp lệ và ngày resolved không trước created. Chỉ thay fixture MongoDB, không sửa SQL gốc hoặc SQL V2.

### 3.4. Query Processing M5

Đủ field cho Q1 doanh thu theo seller/tháng, Q2 chi tiêu theo category và Q3 promotion–variant; không cần Python large. Tuy nhiên, **Q2 đang cố định buyer 5 nên sẽ rỗng trên cả hai large seed** (order dùng buyer 202–2001); M5 cần chọn buyer có order, ví dụ 203. Không tự sửa file M5.

Không dùng sự bằng nhau của kết quả SQL/MongoDB để kết luận đúng vì dữ liệu đã khác như trên. Q1/Q2 tính tiền hàng trước giảm giá; Q3 chỉ kiểm tra liên kết promotion còn hạn/còn lượt, chưa phải toàn bộ điều kiện Checkout. Promotion hết hạn cố định cuối năm 2026. Khi benchmark SQL, Q4 có đề xuất index trùng tên V2 và các lệnh CREATE đang nằm trong comment; cần thống nhất baseline với M5.

## 4. Cách sử dụng

**SQL Server**

Chạy theo thứ tự:

1. `01_schema_v2.sql`
2. `02_seed_large_v2.sql`

Trong SSMS, xác minh đúng server và database `BKPEE_DB`, sau đó điền `@ExpectedInstance` và `@Confirmation` theo hướng dẫn trong script. Mặc định các giá trị này là `NULL`.

**MongoDB**

Chạy theo thứ tự bằng `mongosh`:

1. `03_mongodb_schema_v2.js`
2. `04_mongodb_seed_v2.js`

Xác minh database `bkpee_db`, endpoint MongoDB, sau đó điền `expectedHost` và `confirmation` theo hướng dẫn trong script. Mặc định các giá trị xác nhận là `null`.

**Cảnh báo:** SQL Schema V2 xóa và tạo lại 28 bảng. MongoDB V2 không tự xóa dữ liệu: nếu đã nạp small seed, large seed sẽ từ chối; không chạy reset SQL để dọn MongoDB. Tắt writer khác, chỉ chạy một tiến trình seed. Điền đúng endpoint và `confirmation = "SEED bkpee_db"`; mặc định là `null`. Không có transaction nhiều collection: lỗi giữa chừng phải dừng, có thể còn dữ liệu một phần, không tự dọn hoặc chạy lại. Chỉ dùng database demo đã xác minh.

## 5. Kết luận

SQL Server V2 giữ nguyên 28 bảng, mở rộng 4 bảng với 12 cột mới, bổ sung index/constraint và tích hợp ba migration F11 vào một schema hoàn chỉnh.

MongoDB V2 giữ 9 collection và 21 index phụ, dùng large seed 24.541 document với dữ liệu nhúng, tham chiếu hợp lệ và tổng tiền tính từ item. Cùng quy mô chính với SQL large nhưng không tuyên bố đồng bộ dữ liệu hoàn toàn.

**Hai phiên bản V2 không thay thế thiết kế gốc mà giúp nhóm khởi tạo database demo theo cấu trúc đã thống nhất.** SQL Server V2 đã được chạy và kiểm tra thực tế; MongoDB V2 mới được kiểm tra tĩnh, chưa xác minh bằng thực thi.
