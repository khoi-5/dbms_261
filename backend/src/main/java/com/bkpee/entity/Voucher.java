/**
 * Voucher — biểu diễn dữ liệu lưu trữ.
 *
 * Dữ liệu và quan hệ
 * Biểu diễn mã hoặc điều kiện giảm giá như mức tối thiểu, trần giảm và lượt dùng nếu có. Cần thống
 * nhất quan hệ với Promotion và phân biệt với Coupon trong schema, tránh lưu hai nguồn quy tắc giảm
 * giá mâu thuẫn.
 *
 * Ánh xạ database
 * File được đề xuất cho phương án dùng JPA. Cần đối chiếu bảng, khóa chính, khóa ngoại, trường được để
 * trống, độ dài và kiểu dữ liệu trước khi khai báo mapping. Các thuộc tính nêu trên chưa khẳng định đã
 * tồn tại đầy đủ trong DB cũ. Kiểu tiền và trạng thái phải thống nhất với schema.
 *
 * Sử dụng trong backend
 * Repository đọc hoặc lưu dữ liệu thông qua entity; service sử dụng dữ liệu để xử lý nghiệp vụ. DTO
 * lựa chọn các trường được trả qua API, tránh lộ dữ liệu hoặc vòng lặp quan hệ. Entity không tiếp nhận
 * HTTP hay xử lý token.
 *
 * Lưu ý khi triển khai
 * Cần kiểm soát cách tải quan hệ để tránh phát sinh nhiều truy vấn không cần thiết. Không cấu hình xóa
 * dây chuyền làm mất dữ liệu dùng chung hoặc lịch sử đơn. Nếu triển khai MongoDB, thiết kế document và
 * ánh xạ riêng. File này chưa tạo bảng hoặc thay đổi database.
 *
 * Trạng thái hiện tại
 * File chỉ chứa mô tả thiết kế, chưa có code thực thi.
 */
