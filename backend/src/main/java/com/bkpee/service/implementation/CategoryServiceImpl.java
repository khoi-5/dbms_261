/**
 * CategoryServiceImpl — triển khai xử lý nghiệp vụ của CategoryService.
 *
 * Thành phần phối hợp
 * CategoryRepository.
 *
 * Chức năng dự kiến
 * listCategories; getCategory; validateCategoryIds.
 *
 * Quy tắc nghiệp vụ
 * Cung cấp danh mục cho form đăng sản phẩm và bộ lọc. Kiểm tra các mã danh mục tồn tại và còn được sử
 * dụng trước khi gán cho sản phẩm. Danh mục có thể có quan hệ nhiều–nhiều và không mặc định giống loại
 * sản phẩm có thuộc tính riêng. Chưa bổ sung thao tác quản trị danh mục nếu chưa có yêu cầu.
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
