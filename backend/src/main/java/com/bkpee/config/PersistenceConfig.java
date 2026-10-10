/**
 * PersistenceConfig — cấu hình hoạt động backend.
 *
 * Chức năng
 * Bổ sung cấu hình truy cập dữ liệu hoặc transaction khi cấu hình tự động chưa đáp ứng. Thống nhất
 * JPA, JDBC hoặc procedure, múi giờ và cách quản lý schema. Không lưu mật khẩu trong code hoặc tự
 * tạo/xóa DB cũ. Nếu triển khai MongoDB cần cấu hình tương ứng riêng.
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
