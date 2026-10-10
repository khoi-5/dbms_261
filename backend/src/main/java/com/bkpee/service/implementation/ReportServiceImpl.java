/**
 * ReportServiceImpl — triển khai xử lý nghiệp vụ của ReportService.
 *
 * Thành phần phối hợp
 * ReportRepository.
 *
 * Chức năng dự kiến
 * getSellerRevenue; getBuyerSpending.
 *
 * Quy tắc nghiệp vụ
 * Xác định người dùng và kỳ báo cáo trước khi lấy số liệu. Với Seller, tính tiền từ dòng hàng thuộc
 * shop và đếm các đơn khác nhau theo định nghĩa đã chọn. Với Buyer, tổng hợp khoản thực trả theo nhóm
 * sản phẩm đã thống nhất. Các báo cáo phải dùng cùng chính sách thanh toán, hủy, hoàn tiền và phân bổ
 * giảm giá. Dùng dữ liệu lịch sử và tránh cộng lặp tổng đơn sau phép join. Tiền dùng kiểu số thập phân
 * chính xác; tháng không có dữ liệu có thể được bổ sung giá trị 0 để hiển thị biểu đồ. Chỉ so sánh SQL
 * và MongoDB sau khi xác nhận kết quả có cùng ý nghĩa.
 *
 * Cách tổ chức xử lý
 * Các thành phần phụ thuộc được cung cấp qua constructor khi triển khai. Service kiểm tra nghiệp vụ và
 * quyền sở hữu, repository thực hiện truy cập dữ liệu, còn mapper chuyển kết quả sang DTO khi cần.
 * Việc ẩn nút trên giao diện không thay thế kiểm tra quyền tại backend.
 *
 * Tính nhất quán dữ liệu
 * Thao tác ghi nhiều bước cần xác định transaction và cách rollback khi phát sinh lỗi. Không bắt lỗi
 * rồi bỏ qua khiến dữ liệu được lưu một phần. Kiểu tiền, số lượng và giới hạn phải tương thích DB.
 * Những xử lý đã nằm trong procedure hoặc trigger cần được đối chiếu để tránh thực hiện lặp. Không ghi
 * thông tin đăng nhập hoặc dữ liệu riêng tư không cần thiết vào log.
 *
 * Kiểm thử
 * Kiểm tra thành công, đầu vào thiếu hoặc sai, giá trị biên, sai quyền và lỗi truy cập dữ liệu. Có thể
 * giả lập repository để kiểm tra các nhánh nghiệp vụ. Khả năng rollback, khóa và ràng buộc phải được
 * kiểm tra thêm trên database thử nghiệm thực tế.
 *
 * Trạng thái hiện tại
 * File chỉ chứa mô tả thiết kế, chưa có code thực thi.
 */
