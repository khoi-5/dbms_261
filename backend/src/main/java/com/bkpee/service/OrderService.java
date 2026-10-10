/**
 * OrderService — khai báo các chức năng của lớp nghiệp vụ.
 *
 * Vai trò
 * File dự kiến được triển khai dưới dạng interface. Controller và các service khác sử dụng interface
 * này để biết những thao tác có thể gọi. Phần xử lý cụ thể nằm trong OrderServiceImpl; đây không phải
 * hai bước thực thi nối tiếp nhau.
 *
 * Chức năng dự kiến
 * listBuyerOrders; getBuyerOrder; listSellerOrders; updateSellerStatus; cancelOrder.
 *
 * Quy tắc nghiệp vụ
 * Lấy lịch sử và chi tiết đơn thuộc Buyer, hoặc phần hàng thuộc Seller với điều kiện shop, trạng thái
 * và khoảng thời gian. Ranh giới ngày được xác định theo múi giờ đã chọn. Cần thống nhất đơn nhiều
 * shop và trạng thái của từng phần hàng. Khi chuyển trạng thái hoặc hủy, kiểm tra trạng thái hiện tại
 * và chống cập nhật lặp. Chỉ hoàn lượng kho đã thực sự trừ, đúng một lần trong transaction; không vừa
 * trigger vừa Java cùng hoàn kho. Không đánh dấu hoàn tiền khi chưa có xử lý tương ứng. Thông tin lịch
 * sử được lấy từ dữ liệu ghi nhận khi mua, không tính lại theo giá sản phẩm mới.
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
