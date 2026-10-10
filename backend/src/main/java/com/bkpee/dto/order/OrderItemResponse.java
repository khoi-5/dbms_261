/**
 * OrderItemResponse — cấu trúc dữ liệu trao đổi.
 *
 * Chức năng
 * Chứa tên, loại, giá, số lượng, giảm giá, thành tiền và shop của dòng hàng tại thời điểm mua. Thông
 * tin này không được thay đổi theo giá sản phẩm hiện tại.
 *
 * Sử dụng trong luồng xử lý
 * DTO mô tả dữ liệu cần cho từng thao tác, không tự tiếp nhận request hoặc truy cập database.
 * Controller nhận DTO đầu vào và gọi service. DTO đầu ra được trả qua controller để Spring chuyển
 * thành JSON.
 *
 * Thiết kế và kiểm tra
 * Tên trường, kiểu dữ liệu và cấu trúc JSON cần thống nhất với frontend trước khi tích hợp. Request có
 * thể khai báo điều kiện cơ bản; service kiểm tra dữ liệu tồn tại, quyền sở hữu và quy tắc nghiệp vụ.
 * Response chỉ chứa thông tin cần thiết, không sao chép toàn bộ entity theo mặc định.
 *
 * Lưu ý
 * Tiền sử dụng kiểu số thập phân phù hợp; định dạng và múi giờ được thống nhất. Mã dữ liệu không thay
 * thế việc kiểm tra quyền. Khi triển khai, kiểm tra chuyển đổi JSON và các điều kiện đầu vào theo hợp
 * đồng API.
 *
 * Trạng thái hiện tại
 * File chỉ chứa mô tả thiết kế, chưa có code thực thi.
 */
