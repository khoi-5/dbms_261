/**
 * CheckoutServiceImpl — triển khai xử lý nghiệp vụ của CheckoutService.
 *
 * Thành phần phối hợp
 * CartRepository, ProductRepository, OrderRepository, PaymentService, PromotionService.
 *
 * Chức năng dự kiến
 * checkout.
 *
 * Quy tắc nghiệp vụ
 * Đây là phần điều phối transaction của demo checkout nội bộ. Xác định Buyer, kiểm tra giỏ không rỗng,
 * địa chỉ và phương thức thanh toán; lấy giá từ DB và kiểm tra lại khuyến mãi. Cập nhật kho bằng điều
 * kiện còn đủ số lượng hoặc khóa phù hợp; với nhiều sản phẩm cần thứ tự khóa ổn định. Lưu tên, loại,
 * giá và giảm giá tại thời điểm mua vào đơn và chi tiết; tạo thông tin thanh toán đúng trạng thái, ghi
 * nhận lượt dùng khuyến mãi nếu có và xử lý phần giỏ đã mua. Mọi thay đổi phải được hoàn tác nếu một
 * bước thất bại. Nếu sử dụng khóa chống gửi lặp, kiểm tra để một lần checkout không tạo nhiều đơn. Chỉ
 * một nơi trong Java, procedure hoặc trigger chịu trách nhiệm cập nhật kho.
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
