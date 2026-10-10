# Phân công và quy trình triển khai

Tài liệu hướng dẫn dùng bộ khung để phân công và phát triển các tính năng. Số người và nhiệm vụ cụ thể do nhóm thống nhất; các nhóm công việc dưới đây là gợi ý, chưa phải phân công chính thức.

## 1. Phân công theo tính năng

Một thành viên có thể phụ trách nhiều tính năng liên quan, triển khai xuyên suốt Controller, Service, Repository cùng DTO cần thiết. Nếu phụ trách cả frontend, thành viên đó tiếp tục xây dựng giao diện và nối API tương ứng.

Cách chia này giúp một người theo dõi toàn bộ luồng, hạn chế việc mỗi thay đổi phải chờ người viết controller, service và repository riêng. Thiết kế DB vẫn do thành viên phụ trách DB điều phối và thống nhất với từng phần backend.

| Nhóm công việc | Tính năng | Phần cần phối hợp |
|---|---|---|
| Sản phẩm và danh mục | 01, 02, 03, 07, 08 | Sản phẩm, thuộc tính, danh mục và tồn kho. |
| Giỏ, checkout và thanh toán | 09, 10 | Đơn hàng, giá, khuyến mãi, transaction, xử lý đồng thời. |
| Đơn hàng | 04, 11 | Trạng thái, dữ liệu lịch sử và phạm vi Buyer/Seller. |
| Khuyến mãi và báo cáo | 05, 06, 12 | Điều kiện áp dụng, phân bổ giảm giá và chính sách thống kê. |
| Tài khoản và cấu hình chung | Phần hỗ trợ | Đăng nhập, hồ sơ, phân quyền, cấu hình và xử lý lỗi. |

Không chia đều chỉ bằng số tính năng. Checkout với transaction và xử lý đồng thời thường cần nhiều công sức hơn màn hình đọc dữ liệu. Có thể tách hoặc ghép các nhóm trên theo năng lực và số người thực tế.

## 2. Quản lý Service và implementation

Bộ khung tách interface trong `service/` và phần triển khai trong `service/implementation/`. Hai file thuộc cùng lớp nghiệp vụ và nên do cùng thành viên phụ trách chức năng quản lý.

Ví dụ, người làm giỏ cập nhật cả `CartService.java` và `CartServiceImpl.java`. Interface mô tả chức năng được cung cấp; implementation viết các bước kiểm tra, cập nhật và trả kết quả. Không cần phân công người riêng chỉ để viết interface.

Khi service được chức năng khác sử dụng, cần thống nhất chữ ký hàm và kết quả trước khi sửa. Chẳng hạn, checkout gọi `PromotionService` để tính giảm giá; hai bên phải hiểu giống nhau về số tiền đầu vào, điều kiện và kết quả trả về.

## 3. File riêng và file dùng chung

Một file có thể phục vụ nhiều tính năng. `ProductServiceImpl` xử lý đăng, sửa và tìm sản phẩm. Nếu các tính năng này giao nhiều người, cần thống nhất phần chỉnh sửa hoặc người phụ trách tích hợp để tránh ghi đè thay đổi.

| Thành phần | Cách phối hợp |
|---|---|
| Entity và quan hệ DB | Backend đề xuất nhu cầu; người thiết kế DB xác nhận cấu trúc và mapping. |
| Enum trạng thái | Thống nhất giá trị, ý nghĩa và mapping DB trước khi dùng nhiều nơi. |
| Security/config | Có người phụ trách chính; các nhóm cung cấp yêu cầu vai trò và quyền truy cập. |
| ErrorResponse/handler | Thống nhất cấu trúc lỗi, thông báo thay đổi ảnh hưởng FE. |
| Migration | Mỗi thay đổi có script và mô tả ảnh hưởng, tránh schema mâu thuẫn. |
| DTO/service dùng chung | Thông báo thay đổi trường hoặc chữ ký hàm cho các phần đang sử dụng. |

## 4. Bắt đầu một tính năng

1. Đọc nhiệm vụ, ví dụ và bảng file trong [01-feature-map.md](01-feature-map.md).
2. Xác định trách nhiệm lớp theo [02-architecture.md](02-architecture.md), chốt quy tắc liên quan trong [03-business-decisions.md](03-business-decisions.md).
3. Trao đổi với người thiết kế DB về dữ liệu đọc/ghi, constraint, procedure và transaction.
4. Thống nhất endpoint, phương thức HTTP, request, response và lỗi với frontend. Không cần chốt mọi API toàn dự án ngay từ đầu, nhưng cần chốt chức năng đang làm trước khi tích hợp.
5. Ghi quyết định và dữ liệu mẫu để các thành viên dùng cùng cách hiểu.

Ví dụ, trước khi thêm vào giỏ cần xác định request chứa mã sản phẩm và số lượng cộng thêm, Buyer lấy từ tài khoản đăng nhập và giỏ chưa giữ kho. Sau đó mới triển khai DTO, service và truy vấn.

## 5. Triển khai và tích hợp

Thành viên phụ trách viết các lớp theo trách nhiệm đã mô tả. Có thể kiểm tra nghiệp vụ bằng dữ liệu giả lập trước, nhưng truy vấn, constraint, rollback và khóa cần kiểm tra trên DB thử nghiệm thực tế.

Frontend có thể dùng dữ liệu mẫu đúng response đã thống nhất khi backend chưa hoàn thành. Khi tích hợp, cần thử thành công, danh sách rỗng và lỗi; không chỉ kiểm tra màn hình có hiển thị.

Nếu dùng Git, nên tạo nhánh theo tính năng, ghi rõ thay đổi và nhờ thành viên liên quan kiểm tra trước khi gộp. Bàn giao kèm script DB và hướng dẫn chạy nếu có. Không đưa mật khẩu hoặc dữ liệu riêng tư vào source và log chia sẻ.

## 6. Kiểm tra trước khi bàn giao

| Nội dung | Điều kiện cần kiểm tra |
|---|---|
| Nhiệm vụ | Đúng luồng thống nhất, có kết quả quan sát được. |
| Phân lớp | Controller nhận/trả HTTP, service xử lý nghiệp vụ, repository truy cập DB. |
| API | Request, response và lỗi khớp với frontend. |
| Quyền | Không truy cập chéo giỏ, đơn hoặc sản phẩm; không tin role/owner do FE tự khai. |
| Giá và tiền | Dùng dữ liệu backend và kiểu số phù hợp; không tin tổng tiền FE gửi. |
| Truy vấn | Kết quả đúng, không nhân bản do join, phân trang và sort ổn định. |
| Cập nhật | Transaction rõ ràng, không để Java và trigger/procedure cập nhật hai lần. |
| Lỗi | Phân biệt kết quả rỗng với lỗi tải, không trả thông tin nội bộ không cần thiết. |
| Kiểm thử | Có thành công, input sai, sai quyền và tình huống đặc thù. |
| Bàn giao | Có ví dụ API, script DB, cách chạy và kết quả kiểm tra thực tế. |

Kế hoạch minh chứng DBMS nằm trong [04-database-and-demo.md](04-database-and-demo.md). Chỉ ghi kết quả đã thực hiện; file test chứa comment chưa được xem là test đã pass.

## 7. Phần DBMS và ghi nhận đóng góp

Phân công tính năng và chủ đề DBMS không cần trùng hoàn toàn. Một người có thể làm sản phẩm và nghiên cứu indexing; người khác dùng checkout để nghiên cứu transaction hoặc concurrency control.

Đề bài yêu cầu tối thiểu hai lần số thành viên về số chức năng người dùng, không tính đăng nhập/đăng xuất. Cần đối chiếu danh sách 12 tính năng với số người thực tế và phạm vi triển khai. Các chủ đề được chọn cần demo, so sánh trên hai DBMS; không bắt buộc mỗi chủ đề ghép đúng hai tính năng.

Nhóm cần ghi nhận phần việc, kết quả, phối hợp và biên bản họp để thể hiện đóng góp. Bảng sau dùng khi phân công chính thức:

| Thành viên | Tính năng | Chủ đề DBMS | Phần dùng chung | Kết quả bàn giao |
|---|---|---|---|---|
| Chưa phân công | — | — | — | — |

## 8. Mức độ hoàn thiện của bộ khung

Bộ khung phù hợp để trình bày kiến trúc backend và làm cơ sở phân công. Đã có luồng xử lý, trách nhiệm lớp, file liên quan cho 12 tính năng, các quy tắc cần thống nhất và kế hoạch kiểm tra.

| Mức độ | Trạng thái hiện tại | Phần cần hoàn thiện |
|---|---|---|
| Khung kiến trúc | Có cấu trúc thư mục và mô tả trách nhiệm. | Điều chỉnh khi chốt mặt hàng và cách lưu trữ. |
| Thiết kế chi tiết | Có nhiệm vụ, ví dụ và file dự kiến. | Chốt schema, API, trạng thái, transaction và quyền cụ thể. |
| Khung Spring Boot chạy được | Chưa có; Java chỉ chứa comment. | Chọn Java/Spring, build tool, dependency; bổ sung class/interface và cấu hình. |
| Chức năng hoàn chỉnh | Chưa triển khai trong backend_new. | Viết code, migration, nối FE và chạy test. |
| Minh chứng DBMS | Có kế hoạch. | Chuẩn bị hai DBMS, thực hiện demo, lưu số đo và kết luận. |

Với yêu cầu thiết kế bộ khung backend, chưa cần thêm nhiều folder hoặc class. Bước tiếp theo là rà soát cùng người thiết kế DB, xác nhận quyết định còn mở và triển khai thử một chức năng xuyên suốt. Tìm kiếm sản phẩm là lựa chọn ban đầu phù hợp để kiểm tra DB, repository, service, DTO và controller trước khi chuyển sang checkout.
