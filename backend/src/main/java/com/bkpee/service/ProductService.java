/**
 * ProductService — khai báo các chức năng của lớp nghiệp vụ.
 *
 * Vai trò
 * File dự kiến được triển khai dưới dạng interface. Controller và các service khác sử dụng interface
 * này để biết những thao tác có thể gọi. Phần xử lý cụ thể nằm trong ProductServiceImpl; đây không
 * phải hai bước thực thi nối tiếp nhau.
 *
 * Chức năng dự kiến
 * createProduct; updateProduct; adjustStock; stopSelling; deleteProduct; searchProducts; getProduct.
 *
 * Quy tắc nghiệp vụ
 * Khi tạo sản phẩm, xác định Seller, kiểm tra thông tin chung, thuộc tính riêng của loại hàng và danh
 * mục; lưu các dữ liệu liên quan trong cùng transaction. Khi sửa, kiểm tra quyền sở hữu và chỉ cập
 * nhật những trường được phép. Nhập thêm kho phải tránh ghi đè số lượng đã thay đổi do checkout. Ngừng
 * bán sẽ chặn mua mới. Xóa vật lý cần kiểm tra lịch sử đơn và xử lý liên kết, giỏ hàng theo quy tắc,
 * đồng thời tránh xung đột với checkout. Khi tìm kiếm, chuẩn hóa từ khóa, kiểm tra khoảng giá theo
 * giới hạn decimal của DB, phân trang và sắp xếp hợp lệ; không trả sản phẩm trùng do quan hệ danh mục.
 *
 * Dữ liệu và lỗi
 * Đầu vào gồm DTO hoặc tham số nghiệp vụ cùng thông tin người gọi đã xác thực khi cần. Đầu ra là DTO
 * hoặc kết quả nghiệp vụ; việc tạo phản hồi HTTP thuộc controller. Cần phân biệt dữ liệu không hợp lệ,
 * không tìm thấy, không có quyền và xung đột khi xử lý.
 *
 * Triển khai và kiểm thử
 * Thống nhất chữ ký hàm, dữ liệu và phân trang khi triển khai. Interface không chứa SQL hoặc các bước
 * xử lý cụ thể; không bắt buộc mỗi entity đều có đủ thao tác thêm, sửa, xóa. Kiểm tra nghiệp vụ thông
 * qua implementation và sử dụng service giả lập khi kiểm thử controller.
 *
 * Trạng thái hiện tại
 * File chỉ chứa mô tả thiết kế, chưa có code thực thi.
 */
