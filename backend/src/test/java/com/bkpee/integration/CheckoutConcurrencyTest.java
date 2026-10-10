/**
 * CheckoutConcurrencyTest — kế hoạch kiểm thử.
 *
 * Nội dung kiểm tra
 * Chuẩn bị tồn kho 1 và hai Buyer, mỗi người mua 1. Gửi yêu cầu đồng thời qua kết nối và transaction
 * riêng, đồng bộ điểm bắt đầu. Xác nhận đúng một thành công, một lỗi hết hàng, kho bằng 0 và dữ liệu
 * đơn nhất quán. Bổ sung yêu cầu gửi lặp hoặc đơn nhiều sản phẩm khi cần; repository giả lập không đủ
 * cho kiểm tra này.
 *
 * Môi trường và kết quả
 * Sử dụng dữ liệu và database thử nghiệm riêng, không xóa hoặc thay đổi dữ liệu cần giữ của hệ thống
 * cũ. Chọn công cụ kiểm thử sau khi thống nhất cấu hình build. Lưu dữ liệu chuẩn bị, cách chạy, kết
 * quả mong đợi và kết quả thực tế; file mô tả này chưa phải bằng chứng test đã chạy thành công.
 *
 * Trạng thái hiện tại
 * File chỉ chứa mô tả thiết kế, chưa có code thực thi.
 */
