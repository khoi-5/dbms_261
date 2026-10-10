/**
 * PromotionService — khai báo các chức năng của lớp nghiệp vụ.
 *
 * Vai trò
 * File dự kiến được triển khai dưới dạng interface. Controller và các service khác sử dụng interface
 * này để biết những thao tác có thể gọi. Phần xử lý cụ thể nằm trong PromotionServiceImpl; đây không
 * phải hai bước thực thi nối tiếp nhau.
 *
 * Chức năng dự kiến
 * createPromotion; listSellerPromotions; findEligibleProducts; calculateDiscount; consumeUsage.
 *
 * Quy tắc nghiệp vụ
 * Kiểm tra sản phẩm thuộc Seller, thời hạn, mức tối thiểu, hình thức giảm, mức giảm và các giới hạn
 * được hỗ trợ. Tìm sản phẩm đủ điều kiện bằng truy vấn con thực sự để phục vụ tiêu chí tương ứng. Khi
 * checkout, kiểm tra lại theo thời điểm và giá DB, phạm vi shop và sản phẩm. Thống nhất quy tắc cộng
 * dồn, làm tròn và phân bổ giảm giá xuống dòng hàng; mức giảm không vượt số tiền đủ điều kiện. Nếu
 * giới hạn lượt dùng, việc kiểm tra và ghi nhận phải an toàn đồng thời, được rollback cùng checkout
 * khi thất bại.
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
