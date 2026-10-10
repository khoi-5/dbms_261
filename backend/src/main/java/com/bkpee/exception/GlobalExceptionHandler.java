/**
 * GlobalExceptionHandler — xử lý trường hợp thất bại.
 *
 * Chức năng
 * Chuyển lỗi đầu vào, chưa xác thực, sai quyền, không tìm thấy, xung đột, hết hàng và lỗi nội bộ thành
 * ErrorResponse với mã HTTP theo hợp đồng. Log nội bộ có thể kèm mã yêu cầu; frontend không nhận stack
 * trace, SQL hoặc thông tin đăng nhập. Không đổi mọi lỗi thành HTTP 200 hay danh sách rỗng.
 *
 * Phối hợp khi triển khai
 * Đây là thành phần dùng chung cho các chức năng liên quan. Trước khi thay đổi, cần thống nhất cách sử
 * dụng với các thành viên đang phụ thuộc vào thành phần này. Các lựa chọn chưa chốt sẽ được đối chiếu
 * với thiết kế DB và API.
 *
 * Kiểm thử
 * Kiểm tra các trường hợp đúng, không hợp lệ và giới hạn liên quan đến chức năng được mô tả. Khi thành
 * phần tương tác với security hoặc database, cần kiểm tra thêm trong luồng thực tế.
 *
 * Trạng thái hiện tại
 * File chỉ chứa mô tả thiết kế, chưa có code thực thi.
 */
