/**
 * BusinessException — xử lý trường hợp thất bại.
 *
 * Chức năng
 * Biểu diễn lỗi vi phạm quy tắc nghiệp vụ với mã và thông báo phù hợp. Loại exception và cấu hình
 * rollback cần được thống nhất để thao tác nhiều bước không lưu một phần dữ liệu. Không dùng lỗi
 * nghiệp vụ để che mọi lỗi lập trình.
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
