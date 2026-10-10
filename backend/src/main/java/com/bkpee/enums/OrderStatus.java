/**
 * OrderStatus — thống nhất tập giá trị trong Java.
 *
 * Chức năng
 * Định nghĩa trạng thái đơn theo luồng Buyer, Seller và checkout. Với đơn nhiều shop, cần phân biệt
 * trạng thái toàn đơn và từng phần hàng. Service kiểm tra chuyển trạng thái được phép; enum chỉ cung
 * cấp tập giá trị.
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
