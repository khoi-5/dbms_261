/**
 * PromotionServiceImpl — triển khai xử lý nghiệp vụ của PromotionService.
 *
 * Thành phần phối hợp
 * PromotionRepository, ProductRepository.
 *
 * Chức năng dự kiến
 * createPromotion; listSellerPromotions; findEligibleProducts; calculateDiscount; consumeUsage.
 *
 * Quy tắc nghiệp vụ
 * Kiểm tra sản phẩm thuộc Seller, thời hạn, mức tối thiểu, hình thức giảm, mức giảm và các giới hạn
 * được hỗ trợ. Tìm sản phẩm đủ điều kiện bằng truy vấn con thực sự để phục vụ tiêu chí tương ứng. Khi
 * checkout, kiểm tra lại theo thời điểm và giá DB, phạm vi shop và sản phẩm. Thống nhất quy tắc cộng
 * dồn, làm tròn và phân bổ giảm giá xuống dòng hàng; mức giảm không vượt số tiền đủ điều kiện. Nếu
 * giới hạn lượt dùng, việc kiểm tra và ghi nhận phải an toàn đồng thời, được rollback cùng checkout
 * khi thất bại.
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
