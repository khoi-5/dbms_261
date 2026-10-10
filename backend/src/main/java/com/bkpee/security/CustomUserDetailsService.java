/**
 * CustomUserDetailsService — hỗ trợ xác thực và quyền truy cập.
 *
 * Chức năng
 * Nạp tài khoản từ AccountRepository để tích hợp Spring Security, bao gồm mã băm, vai trò và trạng
 * thái cần cho xác thực. Quy tắc tên đăng nhập phải thống nhất AuthService. Thành phần này không xử lý
 * đăng ký hoặc tự phát token.
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
