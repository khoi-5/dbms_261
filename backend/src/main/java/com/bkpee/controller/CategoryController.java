/**
 * CategoryController — tiếp nhận yêu cầu từ frontend.
 *
 * Chức năng
 * Cung cấp danh sách và thông tin danh mục cho bộ lọc, form đăng sản phẩm. Bộ khung chưa yêu cầu
 * Seller được tự tạo hoặc chỉnh sửa danh mục dùng chung của hệ thống.
 *
 * Dữ liệu và thành phần liên quan
 * Đầu vào dự kiến: Tham số tìm danh mục nếu cần.
 * Đầu ra dự kiến: CategoryResponse.
 * Thành phần phối hợp: CategoryService; CurrentUserService khi cần xác thực.
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
