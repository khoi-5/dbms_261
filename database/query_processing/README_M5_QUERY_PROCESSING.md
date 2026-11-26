# M5 — Promotion, Analytics & Query Processing (F06, F07, F13)

Tài liệu tóm tắt phần triển khai của thành viên **M5 (Query Processing)** trong dự án BKPEE.

## 1. Tính năng ứng dụng đã triển khai

| ID | Chức năng | Tiêu chí DBMS | Backend API | Frontend Route |
|---|---|---|---|---|
| **F06** | Tạo & quản lý khuyến mãi (Coupon % / Voucher VNĐ) | `Insert`, `Update`, `Delete` | `GET/POST/PUT/DELETE /api/seller/promotions` | `/seller/promotions` |
| **F06** | Tìm sản phẩm đủ điều kiện khuyến mãi | **`(g) Subquery (EXISTS)`** | `GET /api/seller/promotions/{id}/eligible-products`<br>`GET /api/buyer/promotions/eligible-products` | Modal xem SP đủ ĐK & `/promotions` |
| **F06** | Áp dụng & tính thử Voucher cho giỏ hàng | **`(g) Subquery (IN)`** | `GET /api/buyer/promotions/available`<br>`POST /api/buyer/promotions/preview` | `/promotions` & `<VoucherPicker />` |
| **F07** | Thống kê doanh thu theo tháng cho Seller | **`(h) Aggregate functions`** (`SUM`, `COUNT(DISTINCT)`, `GROUP BY`) | `GET /api/seller/analytics/revenue?year=&statusScope=` | `/seller/dashboard` |
| **F13** | Thống kê chi tiêu cá nhân cho Buyer | **`(h) Aggregate functions`** (`JOIN` 6 bảng + `GROUP BY`) | `GET /api/buyer/analytics/spending?fromDate=&toDate=&statusScope=` | `/spending` |

## 2. Quy tắc nghiệp vụ thống nhất (F07 & F13)

- **Giá lịch sử:** Luôn tính theo `Shop_Order_Item.Quantity * Shop_Order_Item.Purchase_Price`, không dùng giá hiện tại trong `Product_Variant`.
- **Tránh đếm lặp đơn hàng:** Dùng `COUNT(DISTINCT Shop_Order_ID)` (Seller) và `COUNT(DISTINCT Order_ID)` (Buyer).
- **Chế độ lọc trạng thái (`statusScope`):**
  - `VALID` (mặc định): Loại trừ đơn `CANCELLED`, `RETURNED` và giao dịch thanh toán `REFUNDED`.
  - `DELIVERED`: Chỉ tính các đơn con `Delivery_Status = 'DELIVERED'` (khớp 100% với kịch bản đối chiếu MongoDB).
- **Biểu đồ 12 tháng (F07):** Backend tự lấp đầy đủ 12 tháng (`T1`–`T12`) với giá trị `0` cho các tháng không có đơn.

## 3. Tích hợp với M3 (Checkout)

- **Backend:** `CheckoutService` chỉ cần inject `PromotionService` và gọi:
  ```java
  CheckoutDiscountResult discount = promotionService.validateAndConsumeForCheckout(promotionId, variantSubtotals);
  ```
  Hàm sử dụng `UPDATE Promotion SET Quantity = Quantity - 1 WHERE Promotion_ID = ? AND Quantity > 0 AND SYSDATETIME() BETWEEN Start_Date AND Expiration_Date`, an toàn đồng thời và tự rollback cùng `@Transactional` của Checkout nếu bước thanh toán thất bại.
- **Frontend:** Trang `/checkout` của M3 có thể nhúng trực tiếp component `frontend/src/components/VoucherPicker.jsx`:
  ```jsx
  <VoucherPicker selectedPromotionId={promotionId} onSelect={(preview) => setDiscountPreview(preview)} />
  ```

## 4. Hướng dẫn chạy thực nghiệm Query Processing (SQL Server vs MongoDB)

1. **Kiểm chứng đúng đắn trên dữ liệu nhỏ:**
   - Tạo schema SQL bằng `database/v1/01_schema.sql`, sau đó nạp `database/v1/02_seed_small.sql` (SQL Server) và `database/v1/init_mongodb.js` (MongoDB).
   - Chạy `sqlserver_query_processing.sql` và `mongodb_query_processing.js` để xác nhận kết quả Q1, Q2, Q3 khớp nhau 100%.
2. **Đo hiệu năng & Execution Plan trên dữ liệu lớn:**
   - Nạp `database/v1/03_seed_large.sql` sau schema V1; sinh dữ liệu MongoDB bằng `python database/v1/setup_mongodb.py --mode large` từ thư mục gốc dự án. Script Python sinh dữ liệu độc lập, không sao chép từ SQL Server.
   - **SQL Server (SSMS):** Bật **Include Actual Execution Plan (`Ctrl + M`)**, chạy `database/query_processing/sqlserver_query_processing.sql`, ghi lại `logical reads`, `CPU time`, `elapsed time` và hình Execution Plan cho:
     - Q1 (JOIN + Hash/Stream Aggregate theo tháng)
     - Q2 (6-table JOIN + GROUP BY theo Category)
     - Q3a vs Q3b vs Q3c (`EXISTS` vs `IN` vs `INNER JOIN DISTINCT`)
   - **MongoDB (`mongosh`):** Chạy `mongosh "mongodb://localhost:27017/bkpee_db" database/query_processing/mongodb_query_processing.js`, ghi lại `winningPlan`, `totalDocsExamined`, `totalKeysExamined`, thời gian trung bình 5 lần chạy cho:
     - Q1a (`$unwind` trước `$match`) vs Q1b (`$match` pushdown tận dụng index)
     - Q2 (chi phí `$lookup` sang `products` và `categories`)
     - Q3 (tìm biến thể đang khuyến mãi qua pipeline + `$lookup`)
