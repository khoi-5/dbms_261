/**
 * CheckoutTransactionTest — kế hoạch kiểm thử.
 *
 * Nội dung kiểm tra
 * Gây lỗi ghi payment sau khi đã có thao tác đơn hàng và tồn kho. Kiểm tra rollback toàn bộ đơn, chi
 * tiết, payment, kho, giỏ và lượt dùng khuyến mãi đã thay đổi. Gây lỗi qua cấu hình hoặc cơ chế dành
 * cho test, không thêm API công khai. Quan sát kết quả bằng kết nối phù hợp sau rollback.
 *
 * Môi trường và kết quả
 * Sử dụng dữ liệu và database thử nghiệm riêng, không xóa hoặc thay đổi dữ liệu cần giữ của hệ thống
 * cũ. Chọn công cụ kiểm thử sau khi thống nhất cấu hình build. Lưu dữ liệu chuẩn bị, cách chạy, kết
 * quả mong đợi và kết quả thực tế; file mô tả này chưa phải bằng chứng test đã chạy thành công.
 *
 * Trạng thái hiện tại
 * File chỉ chứa mô tả thiết kế, chưa có code thực thi.
 */
