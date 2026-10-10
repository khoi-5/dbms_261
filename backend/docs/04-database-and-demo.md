# Phối hợp database và kế hoạch minh chứng DBMS

Tài liệu mô tả cách phát triển backend song song với database và các kịch bản kiểm tra, trình bày kết quả. Đây là kế hoạch thực hiện, chưa phải kết quả kiểm thử hoặc số liệu đo đã có.

Theo đề bài, mỗi thành viên nghiên cứu ít nhất một chủ đề trên hai DBMS và so sánh kết quả; số chủ đề của nhóm tương ứng số thành viên, các chủ đề khác có thể được nghiên cứu thêm. Ứng dụng cần chạy tốt trên ít nhất một DBMS. Không cần triển khai đầy đủ ứng dụng trên cả hai DBMS chỉ để thực hiện các phép so sánh.

## 1. Phối hợp giữa backend và database

Backend có thể chia lớp và xác định nhiệm vụ service trước khi schema hoàn thành. Trước khi viết repository và tích hợp một chức năng, hai phần cần thống nhất chi tiết lưu trữ và cách truy cập.

| Nội dung | Phần database | Phần backend |
|---|---|---|
| Dữ liệu | Xác định bảng/document, khóa và quan hệ. | Xác định dữ liệu cần đọc/ghi; điều chỉnh entity hoặc đối tượng kết quả. |
| Ràng buộc | Quy định kiểu dữ liệu, tính duy nhất và khóa ngoại. | Kiểm tra đầu vào, nghiệp vụ và chuyển lỗi thành thông báo. |
| Truy vấn | Thống nhất query, index, procedure nếu dùng. | Đặt truy cập dữ liệu trong repository. |
| Cập nhật nhiều bước | Thống nhất transaction, khóa và tác động của trigger/procedure. | Điều phối tại service, không cập nhật kho hoặc tiền lặp. |
| Thay đổi schema | Cung cấp script có thứ tự và mô tả thay đổi. | Cập nhật mapping, truy vấn, DTO và test chịu ảnh hưởng. |

Nếu giữ procedure/trigger cũ, cần kiểm tra tham số, kết quả và những thay đổi dữ liệu chúng thực hiện. Nếu chuyển nghiệp vụ sang Java, việc điều chỉnh cơ chế cũ phải được ghi nhận trong script DB, không chỉ sửa service.

## 2. Môi trường và thay đổi dữ liệu

Các thành viên nên dùng DB phát triển riêng nhưng cùng phiên bản schema và dữ liệu mẫu. Demo xóa, gây lỗi hoặc phục hồi chỉ thực hiện trên DB thử nghiệm, không dùng dữ liệu cần giữ.

Các script thay đổi được lưu theo công cụ migration nhóm chọn. Script đã sử dụng chung cần giữ lịch sử; thay đổi tiếp theo có script mới. Với DB có sẵn, cần xác định phiên bản ban đầu trước khi chạy migration tạo bảng.

Nếu dùng JPA và quản lý schema bằng script, có thể cấu hình kiểm tra mapping thay vì để từng máy tự sửa cấu trúc DB. Bộ khung hiện chưa có migration thực thi, chưa quyết định phiên bản Java/Spring và công cụ build.

## 3. Đối chiếu thao tác truy vấn và cập nhật

Các thao tác a–h trong đề khác với sáu chủ đề lý thuyết. Một tính năng có thể đáp ứng nhiều thao tác và phục vụ nhiều chủ đề.

| Thao tác | Tính năng phù hợp | Nội dung minh chứng |
|---|---|---|
| a. Insert | 01, 05, 09, 10 | Tạo sản phẩm, khuyến mãi, dòng giỏ hoặc đơn. |
| b. Delete | 03; bổ sung 09 | Xóa sản phẩm đủ điều kiện hoặc dòng giỏ; không chỉ đổi trạng thái. |
| c. Update | 02, 09, 10 | Đổi giá, nhập kho, sửa số lượng giỏ hoặc cập nhật kho khi mua. |
| d. Điều kiện đơn | 07 | Minh chứng riêng truy vấn tên với một điều kiện rõ ràng. |
| e. Điều kiện kết hợp | 04, 08 | Lọc shop, trạng thái, ngày hoặc danh mục và khoảng giá. |
| f. Join | 08, 11 | Kết hợp sản phẩm–danh mục hoặc đơn–chi tiết–thanh toán. |
| g. Subquery | 05 | Truy vấn con chọn sản phẩm đủ điều kiện; tạo khuyến mãi chưa đủ. |
| h. Aggregate | 06, 12 | Tổng tiền, đếm đơn và nhóm theo tháng hoặc nhóm sản phẩm. |

## 4. Kiểm tra 12 tính năng

| Tính năng | Kịch bản | Kết quả mong đợi |
|---|---|---|
| 01. Đăng sản phẩm | Tạo hợp lệ; thử thiếu thuộc tính bắt buộc. | Lưu đủ dữ liệu hoặc từ chối, không tạo sản phẩm dở. |
| 02. Cập nhật | Sửa giá, nhập kho; thử số sai và Seller khác. | Đúng trường, đúng quyền, không mất thay đổi tồn kho. |
| 03. Ngừng bán/xóa | Xóa sản phẩm thử chưa có đơn; thử sản phẩm đã bán. | Đúng quy tắc liên kết, giữ lịch sử, có Delete thật. |
| 04. Đơn cần giao | Nhiều shop, ngày và trạng thái. | Chỉ phần đơn của shop thỏa đồng thời các điều kiện. |
| 05. Khuyến mãi | Trong/ngoài thời hạn, đủ/thiếu điều kiện. | Tập sản phẩm và số tiền giảm đúng. |
| 06. Doanh thu | Đơn nhiều dòng/shop, có giảm giá và đơn bị loại. | Tổng đúng phần shop, không đếm lặp đơn. |
| 07. Tìm tên | Có/không kết quả và nhiều trang. | Đúng cách tìm, thứ tự ổn định; phân biệt rỗng và lỗi. |
| 08. Lọc nâng cao | Nhiều danh mục, giá ở biên khoảng lọc. | Đúng điều kiện, không lặp hoặc sai tổng phân trang. |
| 09. Giỏ hàng | Thêm, cộng dồn, sửa, xóa và yêu cầu đồng thời. | Đúng số lượng, không trùng dòng, đúng Buyer. |
| 10. Checkout | Thành công, lỗi giữa chừng, tranh sản phẩm cuối. | Nhất quán, rollback đầy đủ, không bán vượt kho. |
| 11. Lịch sử | Đổi giá/tên sau mua; nhiều dòng hoặc lần thử thanh toán. | Giữ lịch sử, không lặp đơn, đúng người xem. |
| 12. Chi tiêu | Nhiều nhóm, giảm giá, đơn hủy/chưa trả tiền/hoàn tiền. | Đúng chính sách, tổng các nhóm khớp tổng chung. |

## 5. Data storage & management

Dùng tính năng 01 làm ví dụ chính, bổ sung cập nhật và xóa nếu cần. Sau khi chốt mặt hàng, chuẩn bị dữ liệu có thông tin chung và thuộc tính riêng theo loại. Book/Clothes/Electronics chỉ là gợi ý.

Với SQL, trình bày bảng, khóa và quan hệ. Với NoSQL dạng document, trình bày cách tổ chức document, nhúng hoặc tham chiếu và kiểm tra dữ liệu. Không bắt buộc SQL phải có bảng con hoặc NoSQL phải nhúng toàn bộ; mỗi lựa chọn cần được giải thích theo nhu cầu truy cập.

Thực hiện cùng các tình huống thêm, sửa, đọc, xóa và so sánh khả năng thay đổi thuộc tính, kiểm tra dữ liệu, bảo đảm nhất quán và hỗ trợ truy vấn.

## 6. Indexing

Dùng tìm tên, lọc danh mục–giá hoặc lọc đơn Seller. Mỗi lần so sánh cần cùng dữ liệu, điều kiện và ý nghĩa kết quả.

1. Chuẩn bị dữ liệu đủ lớn, ghi số bản ghi và phân bố dữ liệu.
2. Chạy truy vấn ban đầu, lưu kết quả và kế hoạch thực thi.
3. Tạo index phù hợp với kiểu tìm kiếm.
4. Chạy lại nhiều lần theo cùng điều kiện, ghi thời gian và số liệu đọc dữ liệu của từng DBMS.
5. Giải thích trường hợp index có hoặc không cải thiện truy vấn.

Tìm chứa từ khóa như `LIKE '%từ khóa%'` không bảo đảm index B-tree hỗ trợ tìm nhanh theo khóa. Không đổi từ tìm chứa sang tìm tiền tố rồi quy toàn bộ chênh lệch cho index. Ghi rõ cache, tài nguyên máy và index sẵn có; không dùng con số minh họa thay số đo thực tế.

## 7. Query processing

Dùng báo cáo doanh thu/chi tiêu làm kịch bản chính, có thể bổ sung join danh mục, lịch sử và subquery khuyến mãi. Kiểm tra kết quả bằng dữ liệu nhỏ có thể tính tay trước khi đo tốc độ.

Nếu so SQL và MongoDB, truy vấn SQL và Aggregation Pipeline phải có cùng ý nghĩa kết quả, dữ liệu nghiệp vụ, quy tắc thanh toán, giảm giá và thời gian. Không cần index giống hệt cấu trúc, nhưng phải ghi index được dùng và lý do lựa chọn.

Ghi phiên bản DBMS, cấu hình máy, khối lượng dữ liệu và số lần đo. Phân biệt thời gian truy vấn DB với thời gian gọi API, truyền dữ liệu và dựng giao diện. Chỉ kết luận hiệu năng trong bối cảnh đã đo.

## 8. Transaction

Dùng tính năng 10 với thanh toán nội bộ để kiểm tra hoàn tác khi một bước thất bại.

1. Chuẩn bị Buyer, giỏ, sản phẩm và khuyến mãi nếu có; ghi dữ liệu trước checkout.
2. Thực hiện checkout trong một transaction, tạo đơn và cập nhật kho theo trình tự thiết kế.
3. Giả lập lỗi ở bước ghi payment sau khi đã có thay đổi dữ liệu trước đó.
4. Kiểm tra rollback đơn, chi tiết, kho, payment, phần giỏ và lượt dùng khuyến mãi đã thay đổi.
5. Chạy trường hợp không lỗi để đối chiếu commit thành công.

Cơ chế gây lỗi chỉ dùng trong test hoặc cấu hình thử nghiệm. Các thao tác con phải tham gia transaction phù hợp, không commit riêng giữa chừng.

Nếu minh chứng giao dịch nhiều document trong MongoDB, cần môi trường hỗ trợ transaction như replica set hoặc sharded cluster được cấu hình phù hợp. Tính nguyên tử của một document chưa chứng minh được toàn bộ checkout nhiều document.

## 9. Concurrency control

Dùng tính năng 10 với kịch bản hai Buyer mua sản phẩm cuối cùng, khác với kịch bản gây lỗi transaction.

1. Chuẩn bị kho bằng 1, hai Buyer khác nhau, mỗi giỏ muốn mua 1.
2. Gửi hai yêu cầu thực sự đồng thời qua các transaction/kết nối riêng, đồng bộ điểm bắt đầu.
3. Áp dụng update có điều kiện kho còn đủ và kiểm tra kết quả cập nhật, hoặc khóa phù hợp với DBMS.
4. Xác nhận một người thành công, người còn lại nhận lỗi hết hàng; kho bằng 0, không có đơn/payment tạo dở từ yêu cầu thất bại.

Với nhiều sản phẩm, cần thứ tự lấy khóa ổn định và xử lý timeout/deadlock. Có thể bổ sung nhập kho cùng checkout hoặc hai yêu cầu thêm giỏ.

Hai yêu cầu tuần tự hoặc test bằng repository giả lập không chứng minh được xử lý đồng thời của DBMS. Cần chạy trên môi trường thật tương ứng của từng hệ quản trị.

## 10. Data backup and recovery

Chưa có chức năng trực tiếp trong 12 tính năng. Có thể demo quản trị riêng nếu nhóm chọn nghiên cứu, không bắt buộc thêm nút backup trong giao diện Buyer/Seller.

1. Chuẩn bị DB thử nghiệm và dữ liệu đối chiếu: số sản phẩm, đơn, một số tổng tiền.
2. Chọn công cụ phù hợp từng DBMS, tạo backup và ghi thời điểm hoàn thành.
3. Mô phỏng mất dữ liệu trên bản thử nghiệm bằng thao tác đã xác định.
4. Khôi phục vào DB riêng từ backup; phục hồi đến thời điểm chỉ thực hiện nếu đã cấu hình đủ điều kiện.
5. Kiểm tra số bản ghi, quan hệ, tổng tiền, khả năng đọc từ ứng dụng; ghi thời gian và phạm vi phục hồi.

So sánh thời gian, dung lượng bản sao, mức gián đoạn và dữ liệu có thể mất sau backup. Không mặc định backup đơn lẻ phục hồi được mọi thay đổi sau đó. Rollback transaction không thay thế demo backup/recovery.

## 11. File test và lưu kết quả

Các file trong `src/test/java/com/bkpee/` hiện chỉ có ghi chú. Khi triển khai cần bổ sung test thực thi; sự tồn tại của file không có nghĩa test đã chạy thành công.

| File/nhóm file | Chức năng |
|---|---|
| `controller/ControllerContractTest.java` | Kiểm tra đầu vào, đầu ra và phản hồi HTTP sau khi chốt API. |
| Các file trong `service/` | Kiểm tra nghiệp vụ bằng dữ liệu và repository giả lập phù hợp. |
| `integration/ProductQueryIntegrationTest.java`, `integration/PromotionQueryIntegrationTest.java`, `integration/ReportQueryIntegrationTest.java` | Kiểm tra truy vấn thực trên DB thử nghiệm. |
| `integration/CheckoutTransactionTest.java` | Kiểm tra commit và rollback. |
| `integration/CheckoutConcurrencyTest.java` | Kiểm tra giao dịch tranh chấp tồn kho. |
| `benchmark/ProductSearchBenchmark.java`, `benchmark/RevenueAggregationBenchmark.java` | Dành cho đo tìm kiếm và tổng hợp khi có công cụ, dữ liệu phù hợp. |

Mỗi kịch bản cần lưu dữ liệu chuẩn bị, cách chạy, kết quả mong đợi, kết quả thực tế và môi trường. Ảnh/log phải đi kèm giải thích để người đọc hiểu điều kiện kiểm tra và giới hạn kết luận.
