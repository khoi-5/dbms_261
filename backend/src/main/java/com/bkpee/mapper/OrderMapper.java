/**
 * OrderMapper — chuyển dữ liệu giữa các đối tượng.
 *
 * Chức năng
 * Chuyển đơn, chi tiết và payment đã được tải sang response. Sử dụng dữ liệu tại thời điểm mua, giới
 * hạn phần hàng Seller được xem. Không tính lại giá lịch sử hoặc tự truy vấn từng dòng gây phát sinh
 * nhiều lần truy cập DB.
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
