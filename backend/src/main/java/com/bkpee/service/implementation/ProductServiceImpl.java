/**
 * ProductServiceImpl — triển khai xử lý nghiệp vụ của ProductService.
 *
 * Thành phần phối hợp
 * ProductRepository, CategoryRepository, SellerRepository, CartRepository khi xử lý xóa.
 *
 * Chức năng dự kiến
 * createProduct; updateProduct; adjustStock; stopSelling; deleteProduct; searchProducts; getProduct.
 *
 * Quy tắc nghiệp vụ
 * Khi tạo sản phẩm, xác định Seller, kiểm tra thông tin chung, thuộc tính riêng của loại hàng và danh
 * mục; lưu các dữ liệu liên quan trong cùng transaction. Khi sửa, kiểm tra quyền sở hữu và chỉ cập
 * nhật những trường được phép. Nhập thêm kho phải tránh ghi đè số lượng đã thay đổi do checkout. Ngừng
 * bán sẽ chặn mua mới. Xóa vật lý cần kiểm tra lịch sử đơn và xử lý liên kết, giỏ hàng theo quy tắc,
 * đồng thời tránh xung đột với checkout. Khi tìm kiếm, chuẩn hóa từ khóa, kiểm tra khoảng giá theo
 * giới hạn decimal của DB, phân trang và sắp xếp hợp lệ; không trả sản phẩm trùng do quan hệ danh mục.
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
