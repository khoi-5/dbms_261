# Các quy tắc nghiệp vụ cần thống nhất

Tài liệu ghi lại những quyết định ảnh hưởng đến backend, frontend và database. Các phương án dưới đây là đề xuất để thảo luận, chưa phải quy tắc đã chốt. Thành viên phụ trách tính năng cần thống nhất các mục liên quan trước khi viết phần xử lý.

Danh sách tính năng được trình bày tại [01-feature-map.md](01-feature-map.md); trách nhiệm từng lớp được giải thích tại [02-architecture.md](02-architecture.md).

## 1. Tài khoản và quyền truy cập

Backend xác định người dùng từ thông tin đăng nhập đã xác thực. Ví dụ, khi thêm vào giỏ, Buyer được xác định từ tài khoản hiện tại; mã Buyer do frontend gửi lên không đủ để chứng minh quyền sử dụng giỏ đó.

| Nội dung cần thống nhất | Đề xuất và ảnh hưởng |
|---|---|
| Vai trò tài khoản | Xác định tài khoản chỉ là Buyer hoặc Seller, hay có thể có cả hai vai trò. Quyết định này ảnh hưởng hồ sơ, quan hệ DB và kiểm tra quyền. |
| Cơ chế đăng nhập | Chọn session hoặc token và cách frontend gửi thông tin xác thực. TokenService chỉ cần khi phương án sử dụng token. |
| Quyền sở hữu | Seller chỉ sửa sản phẩm của shop; Buyer chỉ thao tác giỏ và đơn của tài khoản đó. Service kiểm tra quyền sở hữu bên cạnh vai trò. |
| Tài khoản cũ | Nếu tái sử dụng dữ liệu mẫu có mật khẩu dạng rõ, cần chuyển đổi hoặc tạo tài khoản thử mới với mật khẩu được băm. Không sử dụng mật khẩu cũ như một giá trị hash. |

## 2. Sản phẩm và thuộc tính riêng

Nhóm chưa chốt mặt hàng kinh doanh. Product biểu diễn thông tin chung như tên, giá, tồn kho và người bán. Thuộc tính riêng được xác định sau khi lựa chọn sản phẩm thực tế.

Các file Book, Clothes, Electronics và DTO chi tiết tương ứng chỉ là gợi ý. Có thể đổi tên, điều chỉnh chức năng hoặc bỏ nếu các mặt hàng dùng chung cấu trúc. Việc chọn JPA và cách ánh xạ bảng cần thống nhất với người thiết kế DB.

| Nội dung cần thống nhất | Đề xuất và ảnh hưởng |
|---|---|
| Loại sản phẩm | Xác định thuộc tính chung, thuộc tính riêng và trường bắt buộc của từng loại. |
| Danh mục | Xác định một sản phẩm thuộc một hay nhiều danh mục. Danh mục tìm kiếm không mặc định giống loại sản phẩm có thuộc tính riêng. |
| Đổi loại | Xác định có cho phép đổi loại sau khi đăng không. Nếu đã có lịch sử mua, phải giữ được thông tin tại thời điểm giao dịch. |
| Giá và số lượng | Thống nhất kiểu tiền, số chữ số thập phân và giới hạn giá, số lượng. DTO, Java và DB phải sử dụng giới hạn tương thích. |

## 3. Tồn kho và giỏ hàng

Đề xuất giỏ hàng chỉ ghi nhận nhu cầu mua, chưa giữ hoặc trừ tồn kho. Checkout kiểm tra lại và cập nhật kho bằng thao tác có kiểm soát đồng thời.

Ví dụ, kho ban đầu là 10, Seller nhập thêm 5 và Buyer mua 2 cùng thời điểm. Nếu cả hai thao tác thành công thì kết quả phải là 13. Thao tác cập nhật sau không được ghi đè mất kết quả trước đó.

| Nội dung cần thống nhất | Đề xuất và ảnh hưởng |
|---|---|
| Nhập thêm hàng | Phân biệt tăng thêm với đặt lại số lượng tuyệt đối; tách cập nhật kho khỏi sửa thông tin chung. |
| Thêm và sửa giỏ | Thêm lại sản phẩm thì cộng dồn; sửa số lượng là đặt giá trị mới. Cần tránh tạo dòng trùng khi có yêu cầu đồng thời. |
| Số lượng bằng 0 | Chọn trả lỗi hoặc xem là xóa dòng giỏ, rồi áp dụng thống nhất trên FE và BE. |
| Kiểm tra kho | Có thể kiểm tra khi thêm vào giỏ để báo sớm; checkout vẫn phải kiểm tra lại. |
| Giỏ thay đổi khi checkout | Chọn khóa, kiểm tra phiên bản hoặc cập nhật đúng phần đã mua để không xóa nhầm hàng vừa được thêm. |

## 4. Ngừng bán, xóa và lịch sử sản phẩm

Ngừng bán và xóa vật lý là hai thao tác khác nhau. Đề xuất giữ sản phẩm đã có đơn ở trạng thái ngừng bán; sản phẩm chưa có lịch sử có thể được xóa sau khi xử lý các liên kết phù hợp.

Ví dụ, sản phẩm thử chưa được mua có thể được xóa cùng các dòng giỏ theo chính sách đã chọn. Sản phẩm đã xuất hiện trong đơn cần giữ được thông tin lịch sử; không xóa dây chuyền đơn hàng khi xóa sản phẩm.

Nhóm cần thống nhất cách xử lý thuộc tính riêng, danh mục, khuyến mãi và giỏ. Kiểm tra điều kiện xóa phải kết hợp transaction, ràng buộc DB và kiểm soát đồng thời để tránh checkout tạo đơn giữa bước kiểm tra và bước xóa.

Để minh chứng Delete, cần có trường hợp xóa dữ liệu thực sự. Chỉ đổi trạng thái ngừng bán là Update.

## 5. Đơn hàng và phạm vi Seller

Một giỏ có thể chứa hàng từ nhiều shop. Cần chọn cách tổ chức đơn trước khi triển khai checkout và màn hình quản lý đơn.

| Phương án | Nội dung cần xử lý |
|---|---|
| Một đơn chứa nhiều shop | Quản lý phần hàng và trạng thái giao nhận của từng shop; Seller chỉ xem phần thuộc quyền xử lý. |
| Tách đơn theo shop | Một checkout có thể tạo nhiều đơn; kết quả trả về, thanh toán và khuyến mãi phải phản ánh việc tách đơn. |

Tên, loại hàng, giá, số lượng và giảm giá tại thời điểm mua cần được lưu đủ để tái hiện giao dịch. Ví dụ, khi Seller tăng giá từ 200.000 lên 220.000 đồng, đơn cũ vẫn hiển thị đơn giá 200.000 đồng.

Các trạng thái đơn và chuyển đổi được phép cần có bảng thống nhất. Enum định nghĩa giá trị; service kiểm tra điều kiện chuyển trạng thái, chẳng hạn đơn đang giao có được phép hủy hay không.

## 6. Checkout và thanh toán

Đề xuất cho demo nội bộ: tạo đơn, chi tiết, payment, cập nhật kho và xử lý giỏ trong cùng transaction. Tạo payment record không đồng nghĩa đã nhận tiền; trạng thái phụ thuộc phương thức và bước xác nhận.

| Nội dung cần thống nhất | Đề xuất và ảnh hưởng |
|---|---|
| Thời điểm trừ kho | Chọn trừ khi đặt hàng hoặc khi thanh toán hoàn tất. Nếu trì hoãn, cần xác định cơ chế giữ chỗ và giải phóng hàng. |
| Nơi cập nhật kho | Chọn Java, stored procedure hoặc trigger chịu trách nhiệm. Không trừ hoặc hoàn kho ở hai nơi cho cùng giao dịch. |
| Hủy đơn | Chỉ hoàn lượng đã thực sự trừ và hoàn đúng một lần; trạng thái và dữ liệu liên quan phải nhất quán. |
| Yêu cầu gửi lặp | Xác định cách nhận biết cùng một lần checkout/thanh toán để tránh tạo đơn hoặc ghi nhận thanh toán hai lần. |
| Thanh toán thật hay mô phỏng | Demo ghi DB có thể dùng transaction nội bộ. Cổng bên ngoài cần xác minh phản hồi, trạng thái chờ và xử lý bù khi thất bại. |

Transaction DB không tự hoàn tác giao dịch ở hệ thống thanh toán bên ngoài. Nếu tích hợp thật, cần thiết kế riêng luồng này trước khi triển khai.

## 7. Khuyến mãi

Điều kiện khuyến mãi phải được kiểm tra lại tại checkout. Thông tin hiển thị trước đó chỉ phản ánh thời điểm tra cứu, không bảo đảm mã vẫn còn hiệu lực khi đặt hàng.

| Nội dung cần thống nhất | Ví dụ hoặc ảnh hưởng |
|---|---|
| Thời hạn | Chọn múi giờ và quy tắc tại đúng thời điểm bắt đầu/kết thúc. |
| Hóa đơn tối thiểu | Tính trên toàn giỏ, phần hàng của shop hay chỉ sản phẩm đủ điều kiện. |
| Mức giảm | Giảm số tiền/phần trăm, trần giảm và làm tròn; không giảm vượt khoản tiền đủ điều kiện. |
| Cộng dồn | Xác định được dùng nhiều chương trình hay không và thứ tự áp dụng. |
| Lượt sử dụng | Nếu giới hạn, kiểm tra và tăng lượt phải an toàn đồng thời; rollback cùng checkout khi thất bại. |
| Phân bổ giảm giá | Với giảm ở cấp đơn, cần phân bổ xuống dòng hàng để báo cáo theo shop hoặc nhóm sản phẩm khớp tổng tiền. |

## 8. Doanh thu và chi tiêu

Các báo cáo cần dùng cùng định nghĩa giao dịch được tính. Nhóm phải chốt trạng thái đơn, thanh toán, thời điểm ghi nhận và cách xử lý hoàn tiền. Chính sách cần được mô tả cho frontend để hiển thị đúng ý nghĩa số liệu.

Doanh thu Seller chỉ tính hàng thuộc shop. Số đơn phải tránh đếm lặp khi một đơn có nhiều dòng. Chi tiêu Buyer phân theo nhóm sản phẩm được chọn, chưa cố định theo sách, quần áo hoặc điện tử.

Nếu một sản phẩm thuộc nhiều danh mục, cần quy tắc phân bổ khi báo cáo theo danh mục. Tổng các nhóm phải khớp tổng chung sau quy tắc giảm giá và làm tròn.

## 9. Ghi nhận quyết định

Sau khi thống nhất, cập nhật bảng dưới và điều chỉnh tài liệu tính năng, DTO, thiết kế DB liên quan. Các mục chưa chốt không được xem là quyết định của nhóm.

| Nội dung | Kết luận | Người phụ trách | Ngày cập nhật |
|---|---|---|---|
| Mặt hàng, thuộc tính và danh mục | Chưa chốt | — | — |
| Vai trò và cơ chế đăng nhập | Chưa chốt | — | — |
| JPA/JDBC và quản lý schema | Chưa chốt | — | — |
| Đơn nhiều shop | Chưa chốt | — | — |
| Thời điểm trừ kho và nơi cập nhật | Chưa chốt | — | — |
| Thanh toán, hủy và xử lý lặp | Chưa chốt | — | — |
| Điều kiện khuyến mãi | Chưa chốt | — | — |
| Chính sách doanh thu, chi tiêu | Chưa chốt | — | — |
