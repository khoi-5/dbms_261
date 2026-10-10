/**
 * PaymentService — khai báo các chức năng của lớp nghiệp vụ.
 *
 * Vai trò
 * File dự kiến được triển khai dưới dạng interface. Controller và các service khác sử dụng interface
 * này để biết những thao tác có thể gọi. Phần xử lý cụ thể nằm trong PaymentServiceImpl; đây không
 * phải hai bước thực thi nối tiếp nhau.
 *
 * Chức năng dự kiến
 * createPaymentForOrder; processPayment; getPaymentStatus.
 *
 * Quy tắc nghiệp vụ
 * Tạo thông tin thanh toán với phương thức, số tiền và trạng thái từ đơn đã được kiểm tra. Thanh toán
 * tiền mặt chưa mặc nhiên là đã thu tiền. Kiểm tra quyền truy cập, chuyển trạng thái và yêu cầu gửi
 * lặp. Khi được checkout gọi trong demo nội bộ, thao tác tham gia transaction chung thay vì commit
 * riêng. Nếu tích hợp cổng thanh toán thật, cần xác minh phản hồi và mã giao dịch, không tin frontend
 * tự báo thành công. Transaction DB không tự hoàn tác được giao dịch ở cổng bên ngoài.
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
