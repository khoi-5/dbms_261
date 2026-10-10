/**
 * CategoryService — khai báo các chức năng của lớp nghiệp vụ.
 *
 * Vai trò
 * File dự kiến được triển khai dưới dạng interface. Controller và các service khác sử dụng interface
 * này để biết những thao tác có thể gọi. Phần xử lý cụ thể nằm trong CategoryServiceImpl; đây không
 * phải hai bước thực thi nối tiếp nhau.
 *
 * Chức năng dự kiến
 * listCategories; getCategory; validateCategoryIds.
 *
 * Quy tắc nghiệp vụ
 * Cung cấp danh mục cho form đăng sản phẩm và bộ lọc. Kiểm tra các mã danh mục tồn tại và còn được sử
 * dụng trước khi gán cho sản phẩm. Danh mục có thể có quan hệ nhiều–nhiều và không mặc định giống loại
 * sản phẩm có thuộc tính riêng. Chưa bổ sung thao tác quản trị danh mục nếu chưa có yêu cầu.
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
