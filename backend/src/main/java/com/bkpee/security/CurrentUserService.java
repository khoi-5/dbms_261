/**
 * CurrentUserService — hỗ trợ xác thực và quyền truy cập.
 *
 * Chức năng
 * Cung cấp mã tài khoản, Buyer/Seller và vai trò từ thông tin xác thực. Xử lý trường hợp chưa đăng
 * nhập, tài khoản không hợp lệ hoặc thiếu vai trò. Không sử dụng mã người dùng tùy ý trong request làm
 * danh tính. Service nghiệp vụ tiếp tục kiểm tra quyền sở hữu dữ liệu.
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
