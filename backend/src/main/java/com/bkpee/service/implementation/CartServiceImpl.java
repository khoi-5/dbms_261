/**
 * CartServiceImpl — triển khai xử lý nghiệp vụ của CartService.
 *
 * Thành phần phối hợp
 * CartRepository, ProductRepository.
 *
 * Chức năng dự kiến
 * getCart; addItem; updateQuantity; removeItem.
 *
 * Quy tắc nghiệp vụ
 * Xác định Buyer và giỏ thuộc tài khoản đang đăng nhập. Khi thêm sản phẩm, kiểm tra số lượng nguyên
 * dương, trạng thái còn bán và lấy giá từ DB. Nếu sản phẩm đã có trong giỏ, cộng dồn số lượng bằng
 * thao tác an toàn khi có nhiều yêu cầu đồng thời. Khi sửa, đặt số lượng mới theo request; quy tắc số
 * lượng bằng 0 cần được thống nhất với thao tác xóa. Giỏ chưa giữ kho, nên checkout phải kiểm tra lại.
 * Tổng tiền giỏ là ước tính theo giá hiện tại, không phải giá đã cam kết cho đơn.
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
