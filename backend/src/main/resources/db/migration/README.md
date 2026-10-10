# Migration database

Thư mục dành cho script khi nhóm chọn Flyway hoặc công cụ migration tương đương.
Chưa có SQL thực thi; không tự reset database cũ.

Mỗi script mô tả bảng/cột/constraint/procedure/trigger/index thay đổi, lý do và ảnh hưởng BE.
Chốt baseline cho DB sẵn có trước; không giả định chạy V1 tạo bảng lên btl2 đang có dữ liệu.
Nếu chọn Flyway, ví dụ tên V1__initial_schema.sql, V2__product_status.sql; không tạo các file
ví dụ rỗng như migration đã chạy. Migration được chia sẻ rồi thì bổ sung bản mới thay vì sửa lịch sử.
Seed chỉ trên môi trường test/dev; benchmark dataset tách khỏi dữ liệu người dùng.
Các đổi cơ chế stock/payment phải xem trigger/procedure cũ trước khi áp dụng.
