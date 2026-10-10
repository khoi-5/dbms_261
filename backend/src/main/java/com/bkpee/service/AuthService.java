/**
 * AuthService — khai báo các chức năng của lớp nghiệp vụ.
 *
 * Vai trò
 * File dự kiến được triển khai dưới dạng interface. Controller và các service khác sử dụng interface
 * này để biết những thao tác có thể gọi. Phần xử lý cụ thể nằm trong AuthServiceImpl; đây không phải
 * hai bước thực thi nối tiếp nhau.
 *
 * Chức năng dự kiến
 * register; login theo cơ chế xác thực được chọn.
 *
 * Quy tắc nghiệp vụ
 * Khi đăng ký, chuẩn hóa thông tin định danh, kiểm tra trùng và vai trò được phép, băm mật khẩu rồi
 * tạo tài khoản cùng hồ sơ Buyer hoặc Seller trong một transaction. Ràng buộc duy nhất trong DB tiếp
 * tục bảo vệ khi có đăng ký đồng thời. Khi đăng nhập, sử dụng cơ chế xác thực đã chọn để kiểm tra mật
 * khẩu và trạng thái tài khoản trước khi cấp phiên hoặc token. Không trả mã băm mật khẩu. Dữ liệu mật
 * khẩu dạng rõ của bản cũ cần có phương án chuyển đổi.
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
