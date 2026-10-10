/**
 * SecurityConfig — cấu hình hoạt động backend.
 *
 * Chức năng
 * Thiết lập cơ chế session hoặc token, bộ mã hóa mật khẩu, API công khai và API yêu cầu Buyer/Seller.
 * Quyền ở mức API không thay kiểm tra chủ sở hữu dữ liệu. Cấu hình CSRF phụ thuộc cơ chế xác thực,
 * không tắt theo mặc định; request đăng ký không được tự cấp quyền quản trị.
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
