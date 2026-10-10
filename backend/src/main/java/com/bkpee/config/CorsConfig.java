/**
 * CorsConfig — cấu hình hoạt động backend.
 *
 * Chức năng
 * Cấu hình địa chỉ frontend được phép gọi API từ trình duyệt theo môi trường. localhost:3000 là ví dụ
 * local. Khi sử dụng thông tin xác thực qua trình duyệt cần cấu hình origin cụ thể phù hợp. CORS không
 * thay thế xác thực và phân quyền.
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
