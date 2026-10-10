/**
 * TokenService — hỗ trợ xác thực và quyền truy cập.
 *
 * Chức năng
 * Chỉ sử dụng nếu nhóm chọn xác thực bằng token. Thực hiện việc tạo hoặc kiểm tra token bằng cơ chế đã
 * chọn; thống nhất thời hạn, bên phát hành và đối tượng sử dụng nếu áp dụng. Khóa bí mật lấy từ cấu
 * hình phù hợp, không ghi trực tiếp vào source. Nếu dùng session và không cần token có thể bỏ file.
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
