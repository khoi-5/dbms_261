/**
 * CategoryRepository — truy cập và cập nhật dữ liệu.
 *
 * Chức năng
 * Lấy danh mục và xác định những mã danh mục tồn tại để service kiểm tra trước khi gán sản phẩm. Danh
 * mục không mặc định là loại sản phẩm có thuộc tính riêng.
 *
 * Phối hợp với service
 * Repository thực hiện truy vấn và trả kết quả để service xử lý nghiệp vụ. Các thao tác dữ liệu tham
 * gia transaction do service điều phối, không commit riêng từng bước checkout. Truy vấn phải giới hạn
 * theo chủ sở hữu khi chức năng yêu cầu.
 *
 * Cách triển khai
 * Có thể dùng Spring Data JPA cho thao tác entity, hoặc truy vấn riêng, JDBC và stored procedure theo
 * lựa chọn nhóm. ReportRepository không bắt buộc kế thừa JpaRepository. Dữ liệu truy vấn được truyền
 * qua tham số; các trường sắp xếp phải nằm trong danh sách cho phép. Tên bảng, cột, khóa và kiểu tiền
 * cần được đối chiếu với schema.
 *
 * Lưu ý về lưu trữ
 * Nếu giữ procedure hoặc trigger, cần mô tả rõ thay đổi dữ liệu mà chúng thực hiện để service không
 * cập nhật lần hai. Repository không xử lý HTTP hoặc token. Khi triển khai MongoDB, cần phần truy cập
 * dữ liệu và kiểm thử tương ứng, không sử dụng mapping JPA như thể hai cơ chế lưu trữ giống nhau.
 *
 * Kiểm thử
 * Kiểm tra truy vấn có và không có kết quả, dữ liệu thuộc người khác, quan hệ có thể làm lặp kết quả
 * và các ràng buộc DB. Transaction, khóa và rollback phải được kiểm tra trên database thử nghiệm thực
 * tế.
 *
 * Trạng thái hiện tại
 * File chỉ chứa mô tả thiết kế, chưa có code thực thi.
 */
