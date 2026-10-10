/**
 * AccountService — khai báo các chức năng của lớp nghiệp vụ.
 *
 * Vai trò
 * File dự kiến được triển khai dưới dạng interface. Controller và các service khác sử dụng interface
 * này để biết những thao tác có thể gọi. Phần xử lý cụ thể nằm trong AccountServiceImpl; đây không
 * phải hai bước thực thi nối tiếp nhau.
 *
 * Chức năng dự kiến
 * getProfile; updateProfile; changePassword.
 *
 * Quy tắc nghiệp vụ
 * Chỉ xử lý hồ sơ thuộc tài khoản hiện tại và các trường được phép sửa. Kiểm tra email, số điện thoại
 * trùng theo ràng buộc đã chọn. Đổi mật khẩu cần xác minh thông tin hiện tại, băm mật khẩu mới và áp
 * dụng chính sách với phiên đăng nhập cũ. Vai trò không được đổi thông qua thao tác sửa hồ sơ.
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
