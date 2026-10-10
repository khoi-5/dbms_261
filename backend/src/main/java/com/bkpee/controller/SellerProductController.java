/**
 * SellerProductController — tiếp nhận yêu cầu từ frontend.
 *
 * Chức năng
 * Tiếp nhận yêu cầu đăng bán, sửa thông tin, điều chỉnh tồn kho, ngừng bán và xóa sản phẩm. Thông tin
 * Seller được lấy từ tài khoản đã xác thực. ProductService tiếp tục kiểm tra quyền sở hữu sản phẩm và
 * các điều kiện trước khi cập nhật.
 *
 * Dữ liệu và thành phần liên quan
 * Đầu vào dự kiến: CreateProductRequest, UpdateProductRequest, AdjustStockRequest.
 * Đầu ra dự kiến: ProductResponse hoặc kết quả xóa/ngừng bán.
 * Thành phần phối hợp: ProductService; CurrentUserService khi cần xác thực.
 *
 * Cách xử lý
 * Controller nhận dữ liệu thông qua DTO và kiểm tra các điều kiện cơ bản như kiểu dữ liệu, độ dài và
 * trường bắt buộc. Với thao tác cần đăng nhập, thông tin người dùng được lấy qua thành phần security.
 * Controller gọi service, nhận kết quả và trả phản hồi HTTP theo hợp đồng đã thống nhất với frontend.
 *
 * Phân chia trách nhiệm
 * Service chịu trách nhiệm kiểm tra nghiệp vụ và quyền sở hữu. Truy vấn SQL, tính tiền và quản lý
 * transaction không đặt tại controller. GlobalExceptionHandler chuyển lỗi thành phản hồi phù hợp; lỗi
 * xử lý không được đổi thành danh sách rỗng như một kết quả thành công. Đường dẫn, phương thức HTTP và
 * mã phản hồi sẽ được chốt khi triển khai.
 *
 * Kiểm thử
 * Kiểm tra request hợp lệ, dữ liệu thiếu hoặc sai, trường hợp chưa xác thực, sai quyền và lỗi do
 * service trả về. Có thể sử dụng service giả lập để kiểm tra controller độc lập. Kết quả rỗng hợp lệ
 * cần được phân biệt với lỗi tải dữ liệu.
 *
 * Trạng thái hiện tại
 * File chỉ chứa mô tả thiết kế, chưa có code thực thi.
 */
