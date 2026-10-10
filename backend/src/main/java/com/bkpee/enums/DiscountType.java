/**
 * DiscountType — thống nhất tập giá trị trong Java.
 *
 * Chức năng
 * Định nghĩa hình thức giảm theo số tiền hoặc phần trăm nếu hỗ trợ. Quy tắc mức giảm, trần và làm tròn
 * được xử lý tại service. Cần đối chiếu schema nếu mô hình lưu trữ phân biệt hình thức bằng bảng thay
 * vì một trường enum.
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
