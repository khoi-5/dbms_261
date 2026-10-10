/**
 * CheckoutService — khai báo các chức năng của lớp nghiệp vụ.
 *
 * Vai trò
 * File dự kiến được triển khai dưới dạng interface. Controller và các service khác sử dụng interface
 * này để biết những thao tác có thể gọi. Phần xử lý cụ thể nằm trong CheckoutServiceImpl; đây không
 * phải hai bước thực thi nối tiếp nhau.
 *
 * Chức năng dự kiến
 * checkout.
 *
 * Quy tắc nghiệp vụ
 * Đây là phần điều phối transaction của demo checkout nội bộ. Xác định Buyer, kiểm tra giỏ không rỗng,
 * địa chỉ và phương thức thanh toán; lấy giá từ DB và kiểm tra lại khuyến mãi. Cập nhật kho bằng điều
 * kiện còn đủ số lượng hoặc khóa phù hợp; với nhiều sản phẩm cần thứ tự khóa ổn định. Lưu tên, loại,
 * giá và giảm giá tại thời điểm mua vào đơn và chi tiết; tạo thông tin thanh toán đúng trạng thái, ghi
 * nhận lượt dùng khuyến mãi nếu có và xử lý phần giỏ đã mua. Mọi thay đổi phải được hoàn tác nếu một
 * bước thất bại. Nếu sử dụng khóa chống gửi lặp, kiểm tra để một lần checkout không tạo nhiều đơn. Chỉ
 * một nơi trong Java, procedure hoặc trigger chịu trách nhiệm cập nhật kho.
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
