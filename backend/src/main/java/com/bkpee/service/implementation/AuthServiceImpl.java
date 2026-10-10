/**
 * AuthServiceImpl — triển khai xử lý nghiệp vụ của AuthService.
 *
 * Thành phần phối hợp
 * AccountRepository, BuyerRepository, SellerRepository, PasswordEncoder, TokenService nếu dùng token.
 *
 * Chức năng dự kiến
 * register; login theo cơ chế xác thực được chọn.
 *
 * Quy tắc nghiệp vụ
 * Khi đăng ký, chuẩn hóa thông tin định danh, kiểm tra trùng và vai trò được phép, băm mật khẩu rồi
 * tạo tài khoản cùng hồ sơ Buyer hoặc Seller trong một transaction. Ràng buộc duy nhất trong DB tiếp
 * tục bảo vệ khi có đăng ký đồng thời. Khi đăng nhập, sử dụng cơ chế xác thực đã chọn để kiểm tra mật
 * khẩu và trạng thái tài khoản trước khi cấp phiên hoặc token. Không trả mã băm mật khẩu. Dữ liệu mật
 * khẩu dạng rõ của bản cũ cần có phương án chuyển đổi.
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
