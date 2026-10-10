/**
 * ReportService — khai báo các chức năng của lớp nghiệp vụ.
 *
 * Vai trò
 * File dự kiến được triển khai dưới dạng interface. Controller và các service khác sử dụng interface
 * này để biết những thao tác có thể gọi. Phần xử lý cụ thể nằm trong ReportServiceImpl; đây không phải
 * hai bước thực thi nối tiếp nhau.
 *
 * Chức năng dự kiến
 * getSellerRevenue; getBuyerSpending.
 *
 * Quy tắc nghiệp vụ
 * Xác định người dùng và kỳ báo cáo trước khi lấy số liệu. Với Seller, tính tiền từ dòng hàng thuộc
 * shop và đếm các đơn khác nhau theo định nghĩa đã chọn. Với Buyer, tổng hợp khoản thực trả theo nhóm
 * sản phẩm đã thống nhất. Các báo cáo phải dùng cùng chính sách thanh toán, hủy, hoàn tiền và phân bổ
 * giảm giá. Dùng dữ liệu lịch sử và tránh cộng lặp tổng đơn sau phép join. Tiền dùng kiểu số thập phân
 * chính xác; tháng không có dữ liệu có thể được bổ sung giá trị 0 để hiển thị biểu đồ. Chỉ so sánh SQL
 * và MongoDB sau khi xác nhận kết quả có cùng ý nghĩa.
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
