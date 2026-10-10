/**
 * CartService — khai báo các chức năng của lớp nghiệp vụ.
 *
 * Vai trò
 * File dự kiến được triển khai dưới dạng interface. Controller và các service khác sử dụng interface
 * này để biết những thao tác có thể gọi. Phần xử lý cụ thể nằm trong CartServiceImpl; đây không phải
 * hai bước thực thi nối tiếp nhau.
 *
 * Chức năng dự kiến
 * getCart; addItem; updateQuantity; removeItem.
 *
 * Quy tắc nghiệp vụ
 * Xác định Buyer và giỏ thuộc tài khoản đang đăng nhập. Khi thêm sản phẩm, kiểm tra số lượng nguyên
 * dương, trạng thái còn bán và lấy giá từ DB. Nếu sản phẩm đã có trong giỏ, cộng dồn số lượng bằng
 * thao tác an toàn khi có nhiều yêu cầu đồng thời. Khi sửa, đặt số lượng mới theo request; quy tắc số
 * lượng bằng 0 cần được thống nhất với thao tác xóa. Giỏ chưa giữ kho, nên checkout phải kiểm tra lại.
 * Tổng tiền giỏ là ước tính theo giá hiện tại, không phải giá đã cam kết cho đơn.
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
