# Đối chiếu 12 tiêu chí

Tài liệu mô tả nhiệm vụ, ví dụ và các file dự kiến cho 12 tính năng. Nhóm chưa chốt mặt hàng kinh doanh; tên sản phẩm, loại hàng và thuộc tính trong ví dụ chỉ dùng để minh họa. `Product` là phần thông tin chung. Các file như `Book`, `Clothes`, `Electronics` và DTO chi tiết tương ứng là gợi ý từ bộ khung ban đầu, có thể đổi tên, điều chỉnh chức năng hoặc bỏ tùy sản phẩm và thiết kế DB được chọn.

Các bảng file liệt kê những thành phần liên quan đến từng tính năng, không có nghĩa mọi file đều được gọi trong mọi yêu cầu. Entity áp dụng cho phương án JPA; các file xử lý lỗi và cấu hình được dùng chung. Tên API, trường dữ liệu và quy tắc còn mở sẽ được thống nhất khi triển khai.

## 01. Đăng bán sản phẩm đa định dạng

- Tiêu chí: Insert; data storage & management.
- Controller: `SellerProductController.java`.
- Service + implementation: `ProductService.java`, `ProductServiceImpl.java`.
- Repository chính: `ProductRepository.java`.

### Nhiệm vụ

Chức năng cho phép người bán đăng một sản phẩm mới vào gian hàng, lựa chọn loại sản phẩm và nhập các thông tin tương ứng. Danh sách loại sản phẩm sẽ được xác định theo mặt hàng kinh doanh mà nhóm lựa chọn.

Mỗi sản phẩm có thông tin chung như tên, giá, số lượng tồn kho, mô tả và danh mục. Bên cạnh đó, từng loại có thể có bộ thuộc tính riêng. Ví dụ, sách có thể có số trang, quần áo có kích cỡ và chất liệu, đồ điện tử có thông số kỹ thuật. Đây là các ví dụ minh họa, chưa phải danh sách mặt hàng đã chốt. Các thuộc tính cụ thể sẽ được thống nhất với thiết kế database.

Backend xác định gian hàng từ tài khoản Seller đang đăng nhập, kiểm tra dữ liệu và lưu sản phẩm cùng các thông tin liên quan. Sau khi đăng thành công, hệ thống trả thông tin sản phẩm vừa tạo để frontend hiển thị. Nếu dữ liệu không hợp lệ, hệ thống trả thông báo để người bán điều chỉnh.

### Ví dụ

Người bán của gian hàng A đăng sản phẩm P01 với giá 200.000 đồng, số lượng 10, chọn danh mục phù hợp và nhập các thuộc tính riêng theo form của loại sản phẩm đó.

`SellerProductController` nhận dữ liệu rồi gọi `ProductService`. Trong `ProductServiceImpl`, hệ thống kiểm tra tài khoản có vai trò Seller, danh mục tồn tại, giá và số lượng hợp lệ, đồng thời bộ thông tin chi tiết phải phù hợp với loại sản phẩm đã chọn. Sản phẩm được gắn với gian hàng của người đang đăng nhập.

Sau khi kiểm tra, `ProductRepository` lưu thông tin chung, thuộc tính riêng và liên kết danh mục theo thiết kế DB. Với phương án SQL lưu ở nhiều bảng, các thao tác này cần nằm trong cùng một transaction. Nếu lưu thuộc tính riêng thất bại sau khi phần thông tin chung đã được tạo, các thay đổi phải được rollback để tránh sản phẩm chỉ được lưu một phần.

Khi hoàn tất, `ProductMapper` chuyển dữ liệu đã lưu thành `ProductResponse`, bao gồm mã sản phẩm mới và các thông tin cần hiển thị. Nếu thiếu thuộc tính bắt buộc của loại sản phẩm được chọn, yêu cầu được từ chối và frontend nhận thông báo lỗi tương ứng.

### Các file liên quan

Ngoài controller, service và repository chính nêu trên, chức năng sử dụng các file sau. Entity được áp dụng theo phương án JPA; cách ánh xạ cụ thể phụ thuộc thiết kế DB cuối cùng.

Các file chi tiết theo loại hàng trong bảng là gợi ý, không bắt buộc triển khai đủ cả ba nhóm. Tên file, thuộc tính và phần kiểm tra dữ liệu có thể điều chỉnh theo sản phẩm thực tế. Nếu các mặt hàng dùng chung cấu trúc, có thể không cần tách các file chi tiết này.

| Nhóm | File | Chức năng |
|---|---|---|
| DTO đầu vào | `dto/product/CreateProductRequest.java` | Chứa thông tin chung, loại sản phẩm, danh mục và bộ thuộc tính riêng của sản phẩm cần đăng. |
| DTO đầu vào (gợi ý) | `dto/product/BookDetailsRequest.java` | Ví dụ DTO thuộc tính riêng cho sách; thay đổi theo mặt hàng được chọn. |
| DTO đầu vào (gợi ý) | `dto/product/ClothesDetailsRequest.java` | Ví dụ DTO thuộc tính riêng cho quần áo; thay đổi theo mặt hàng được chọn. |
| DTO đầu vào (gợi ý) | `dto/product/ElectronicsDetailsRequest.java` | Ví dụ DTO thuộc tính riêng cho đồ điện tử; thay đổi theo mặt hàng được chọn. |
| DTO đầu ra | `dto/product/ProductResponse.java` | Chứa thông tin sản phẩm vừa tạo để trả về frontend. |
| Entity | `entity/Product.java` | Biểu diễn thông tin chung của sản phẩm và quan hệ với người bán. |
| Entity (gợi ý) | `entity/Book.java`, `entity/Clothes.java`, `entity/Electronics.java` | Ví dụ cách tách dữ liệu riêng theo loại hàng; có thể đổi tên, điều chỉnh chức năng hoặc bỏ theo thiết kế sản phẩm. |
| Entity | `entity/Seller.java`, `entity/Category.java` | Biểu diễn gian hàng sở hữu sản phẩm và danh mục được gán. |
| Repository hỗ trợ | `repository/SellerRepository.java` | Tìm hồ sơ Seller hoặc gian hàng gắn với tài khoản đang đăng nhập. |
| Repository hỗ trợ | `repository/CategoryRepository.java` | Kiểm tra và lấy các danh mục được chọn trước khi lưu liên kết với sản phẩm. |
| Mapper | `mapper/ProductMapper.java` | Chuyển dữ liệu sản phẩm đã lưu sang `ProductResponse`. |
| Enum | `enums/ProductType.java` | Xác định loại hàng và bộ thuộc tính riêng cần kiểm tra. |
| Enum | `enums/ProductStatus.java` | Biểu diễn trạng thái kinh doanh ban đầu theo quy tắc đã thống nhất. |
| Security | `security/CurrentUserService.java` | Cung cấp thông tin tài khoản và Seller đã xác thực để xác định người đăng bán. |
| Enum | `enums/AccountRole.java` | Cung cấp giá trị vai trò để kiểm tra quyền đăng bán của Seller. |
| Cấu hình dùng chung | `config/SecurityConfig.java` | Cấu hình yêu cầu xác thực và quyền truy cập chức năng đăng bán. |
| Lỗi | `exception/ForbiddenException.java` | Báo tài khoản không có quyền đăng bán. |
| Lỗi | `exception/NotFoundException.java` | Báo không tìm thấy hồ sơ Seller hoặc danh mục được yêu cầu. |
| Lỗi | `exception/BusinessException.java` | Báo dữ liệu vi phạm quy tắc nghiệp vụ, chẳng hạn thuộc tính chi tiết không phù hợp với loại hàng. |
| Xử lý lỗi dùng chung | `exception/GlobalExceptionHandler.java`, `dto/common/ErrorResponse.java` | Chuyển lỗi đầu vào hoặc lỗi xử lý thành phản hồi thống nhất cho frontend. |

Danh sách danh mục phục vụ form đăng sản phẩm được lấy qua chức năng hỗ trợ riêng, gồm `CategoryController.java`, `CategoryService.java`, `CategoryServiceImpl.java`, `CategoryRepository.java` và `CategoryResponse.java`. Luồng tạo sản phẩm sử dụng các mã danh mục đã chọn và kiểm tra lại tính hợp lệ khi lưu, không gọi controller danh mục từ controller sản phẩm.

### Liên hệ với yêu cầu DBMS

Chức năng đáp ứng thao tác **Insert** khi lưu sản phẩm và dữ liệu liên quan. Với chủ đề **Data storage & management**, có thể sử dụng các nhóm sản phẩm có thuộc tính khác nhau để so sánh cách SQL lưu thông tin chung và chi tiết ở các bảng liên quan với cách NoSQL lưu document có thuộc tính theo từng loại. Việc lựa chọn cấu trúc lưu trữ cần được giải thích dựa trên nhu cầu thêm sản phẩm, kiểm tra dữ liệu và truy xuất thông tin.

## 02. Cập nhật thông tin và tồn kho

- Tiêu chí: Update.
- Controller: `SellerProductController.java`.
- Service + implementation: `ProductService.java`, `ProductServiceImpl.java`.
- Repository chính: `ProductRepository.java`.

### Nhiệm vụ

Chức năng cho phép Seller chỉnh sửa thông tin sản phẩm thuộc gian hàng và bổ sung số lượng tồn kho. Backend kiểm tra quyền sở hữu, tính hợp lệ của giá, số lượng và các thuộc tính được phép sửa trước khi cập nhật.

Thao tác sửa thông tin và thao tác nhập thêm hàng cần được phân biệt. Khi Seller chỉ sửa tên hoặc giá, dữ liệu tồn kho cũ từ form không được ghi đè lên tồn kho đã thay đổi do khách đặt hàng. Nếu sản phẩm đã được bán, việc sửa giá hiện tại không làm thay đổi giá lưu trong đơn hàng trước đó.

### Ví dụ

Sản phẩm P01 đang có giá 200.000 đồng và tồn kho 10. Seller đổi giá thành 220.000 đồng và nhập thêm 5 sản phẩm. `SellerProductController` nhận yêu cầu; `ProductServiceImpl` kiểm tra Seller sở hữu P01 rồi gọi repository cập nhật các trường tương ứng.

Nếu cùng thời điểm có một checkout thành công mua 2 sản phẩm, tồn kho cuối cùng phải là 13. Backend cần thực hiện tăng/giảm số lượng bằng thao tác an toàn khi cập nhật đồng thời, thay vì đọc số 10 rồi ghi cố định thành 15. `ProductResponse` trả thông tin sau cập nhật; trường hợp xung đột dữ liệu phải có thông báo để frontend tải lại hoặc xử lý theo chính sách đã chọn.

### Các file liên quan

| Nhóm | File | Chức năng |
|---|---|---|
| DTO đầu vào | `dto/product/UpdateProductRequest.java` | Chứa các trường thông tin sản phẩm cần sửa. |
| DTO đầu vào | `dto/product/AdjustStockRequest.java` | Chứa số lượng điều chỉnh; phân biệt nhập thêm với đặt lại số lượng tuyệt đối. |
| DTO đầu ra | `dto/product/ProductResponse.java` | Trả thông tin sản phẩm sau cập nhật. |
| Entity | `entity/Product.java`, `entity/Seller.java`, `entity/Category.java` | Biểu diễn sản phẩm, chủ sở hữu và danh mục nếu thay đổi danh mục. |
| Repository hỗ trợ | `repository/CategoryRepository.java` | Kiểm tra danh mục mới khi yêu cầu có sửa danh mục. |
| Mapper | `mapper/ProductMapper.java` | Chuyển kết quả cập nhật thành DTO trả về. |
| Security | `security/CurrentUserService.java` | Xác định Seller đang thực hiện thao tác. |
| Lỗi | `exception/NotFoundException.java`, `exception/ForbiddenException.java` | Báo sản phẩm không tồn tại hoặc không thuộc quyền chỉnh sửa. |
| Lỗi | `exception/BusinessException.java`, `exception/ConflictException.java` | Báo dữ liệu không hợp lệ hoặc cập nhật xung đột với thao tác khác. |

Nếu cho phép sửa thuộc tính riêng của loại sản phẩm, sử dụng thêm DTO và entity chi tiết đã thống nhất ở tính năng 01. Các file Book/Clothes/Electronics hiện chỉ là gợi ý.

### Liên hệ với yêu cầu DBMS

Chức năng đáp ứng **Update**. Tình huống nhập kho đồng thời với checkout có thể dùng để minh họa **Concurrency control**, kiểm tra hệ thống không mất một trong hai lần cập nhật.

## 03. Ngừng kinh doanh và xóa sản phẩm

- Tiêu chí: Delete.
- Controller: `SellerProductController.java`.
- Service + implementation: `ProductService.java`, `ProductServiceImpl.java`.
- Repository chính: `ProductRepository.java`.

### Nhiệm vụ

Chức năng cho phép Seller ngừng kinh doanh sản phẩm hoặc xóa sản phẩm đủ điều kiện. Ngừng bán làm sản phẩm không còn được mua mới, nhưng vẫn giữ dữ liệu. Xóa sản phẩm loại bỏ bản ghi khỏi DB và cần xử lý các liên kết theo thiết kế dữ liệu.

Đề xuất giữ sản phẩm đã có lịch sử mua bán ở trạng thái ngừng bán để bảo toàn đơn hàng. Với sản phẩm chưa có đơn, có thể cho phép xóa sau khi kiểm tra và xử lý chi tiết loại hàng, danh mục, khuyến mãi và các dòng giỏ liên quan. Quy tắc cuối cùng cần thống nhất với người thiết kế DB.

### Ví dụ

Seller muốn xóa P02, một sản phẩm chưa từng được đặt mua nhưng đang có trong hai giỏ hàng. `ProductServiceImpl` kiểm tra quyền sở hữu và điều kiện xóa. Theo phương án tự động bỏ sản phẩm khỏi giỏ, repository xóa các dòng giỏ và liên kết được phép xóa, sau đó xóa sản phẩm trong cùng transaction.

Nếu P02 đã có lịch sử đơn, hệ thống từ chối xóa vật lý và cho phép ngừng bán theo quy tắc đã chọn. Kiểm tra điều kiện xóa cần kết hợp ràng buộc DB và kiểm soát đồng thời để tránh một checkout tạo đơn đúng lúc sản phẩm đang bị xóa.

### Các file liên quan

| Nhóm | File | Chức năng |
|---|---|---|
| Entity | `entity/Product.java`, `entity/Cart.java`, `entity/CartItem.java` | Biểu diễn sản phẩm và các dòng giỏ cần xử lý khi xóa. |
| Entity liên quan | `entity/OrderItem.java`, `entity/AppliesProduct.java` | Biểu diễn lịch sử mua và liên kết khuyến mãi cần kiểm tra; không xóa lịch sử đơn. |
| Repository hỗ trợ | `repository/CartRepository.java` | Xóa hoặc xử lý dòng giỏ chứa sản phẩm theo chính sách. |
| Repository hỗ trợ | `repository/OrderRepository.java`, `repository/PromotionRepository.java` | Hỗ trợ kiểm tra lịch sử mua và xử lý liên kết khuyến mãi nếu tách các truy vấn này khỏi ProductRepository. |
| Enum | `enums/ProductStatus.java` | Biểu diễn trạng thái ngừng bán. |
| DTO và mapper | `dto/product/ProductResponse.java`, `mapper/ProductMapper.java` | Trả trạng thái mới nếu thao tác ngừng bán cần trả lại sản phẩm. |
| Security | `security/CurrentUserService.java` | Xác định Seller có quyền thao tác. |
| Lỗi | `exception/NotFoundException.java`, `exception/ForbiddenException.java`, `exception/BusinessException.java`, `exception/ConflictException.java` | Báo sản phẩm không tồn tại, sai quyền, không đủ điều kiện xóa hoặc có thay đổi đồng thời. |

Thao tác xóa có thể nhận mã sản phẩm trên đường dẫn và trả kết quả theo hợp đồng API, không bắt buộc tạo thêm DTO xóa riêng. Bảng con của loại sản phẩm được xử lý theo schema thực tế.

### Liên hệ với yêu cầu DBMS

Để đáp ứng **Delete**, cần có trường hợp xóa vật lý một sản phẩm thử đủ điều kiện. Chỉ đổi trạng thái ngừng bán là **Update**, chưa minh chứng Delete. Xóa nhiều bản ghi liên quan cũng có thể minh họa transaction và quản lý ràng buộc dữ liệu.

## 04. Đơn hàng cần giao của Seller

- Tiêu chí: Query with a composite condition.
- Controller: `SellerOrderController.java`.
- Service + implementation: `OrderService.java`, `OrderServiceImpl.java`.
- Repository chính: `OrderRepository.java`.

### Nhiệm vụ

Chức năng cung cấp danh sách đơn hoặc phần hàng thuộc shop đang chờ xử lý. Seller có thể lọc theo trạng thái và ngày đặt, xem sản phẩm, số lượng cùng thông tin người nhận cần thiết cho việc giao hàng.

Backend chỉ trả dữ liệu thuộc shop đang đăng nhập. Nếu một đơn có nhiều Seller, cần thống nhất cách tách phần hàng và trạng thái giao nhận; một Seller không được xem hoặc cập nhật toàn bộ phần hàng của shop khác.

### Ví dụ

Seller của shop A chọn trạng thái “Chờ xác nhận” và ngày “Hôm nay”. `OrderServiceImpl` xác định khoảng thời gian của ngày đó theo múi giờ hệ thống; `OrderRepository` truy vấn với các điều kiện shop A, trạng thái chờ xác nhận và ngày đặt đồng thời thỏa mãn.

Kết quả được chuyển thành `OrderResponse` và phân trang để hiển thị bảng đơn. Một đơn có ba dòng hàng của shop A vẫn cần được hiển thị và đếm đúng theo cách phân trang đã chọn, không tự biến thành ba đơn do phép join.

### Các file liên quan

| Nhóm | File | Chức năng |
|---|---|---|
| DTO đầu vào | `dto/order/OrderFilterRequest.java` | Chứa trạng thái, khoảng ngày và phân trang. |
| DTO đầu ra | `dto/order/OrderResponse.java`, `dto/order/OrderItemResponse.java`, `dto/common/PageResponse.java` | Trả danh sách đơn và phần hàng Seller được phép xem. |
| Entity | `entity/Order.java`, `entity/OrderItem.java`, `entity/Buyer.java`, `entity/Seller.java`, `entity/Product.java` | Cung cấp dữ liệu đơn, sản phẩm, người mua và phạm vi shop. |
| Mapper | `mapper/OrderMapper.java` | Chuyển dữ liệu đơn sang response theo phạm vi Seller. |
| Enum | `enums/OrderStatus.java` | Thống nhất các trạng thái dùng để lọc. |
| Security | `security/CurrentUserService.java` | Xác định shop từ tài khoản Seller. |
| Lỗi | `exception/BusinessException.java`, `exception/ForbiddenException.java` | Báo khoảng ngày không hợp lệ hoặc không có quyền truy cập. |

Nếu bổ sung thao tác cập nhật trạng thái giao hàng, sử dụng thêm `UpdateOrderStatusRequest.java` và kiểm tra chuyển trạng thái tại `OrderServiceImpl`. Đây là phần mở rộng của màn hình, không phải điều kiện để minh chứng truy vấn lọc đơn.

### Liên hệ với yêu cầu DBMS

Chức năng đáp ứng **Query with a composite condition** thông qua nhiều điều kiện kết hợp. Có thể dùng truy vấn này để nghiên cứu **Indexing** và **Query processing** khi tăng số lượng đơn và chọn index phù hợp.

## 05. Tạo và áp dụng khuyến mãi

- Tiêu chí: Insert; query with a subquery khi tìm sản phẩm đủ điều kiện.
- Controller: `PromotionController.java`.
- Service + implementation: `PromotionService.java`, `PromotionServiceImpl.java`.
- Repository chính: `PromotionRepository.java`.

### Nhiệm vụ

Chức năng cho phép Seller tạo chương trình khuyến mãi với thời hạn, mức giảm, mức tiền tối thiểu và phạm vi sản phẩm áp dụng. Backend kiểm tra các sản phẩm thuộc shop, thời gian hợp lệ và điều kiện giảm giá trước khi lưu.

Ngoài bước tạo chương trình, hệ thống cần xác định sản phẩm đủ điều kiện áp dụng. Khi checkout, điều kiện được kiểm tra lại theo giỏ và giá hiện tại, vì kết quả kiểm tra trước đó có thể không còn đúng. Việc phân biệt Promotion, Voucher và các liên kết sản phẩm sẽ theo thiết kế DB cuối cùng.

### Ví dụ

Shop A tạo chương trình giảm 10% cho một nhóm sản phẩm trong thời gian đã chọn, áp dụng khi tổng tiền sản phẩm đủ điều kiện của shop đạt 500.000 đồng. `PromotionServiceImpl` kiểm tra dữ liệu và lưu chương trình cùng liên kết sản phẩm.

Khi tìm các sản phẩm được giảm, `PromotionRepository` có thể dùng truy vấn con `EXISTS` để kiểm tra mỗi sản phẩm có liên kết với chương trình còn hiệu lực hay không. Với giỏ có 600.000 đồng hàng đủ điều kiện, mức giảm minh họa là 60.000 đồng nếu không có trần giảm hay điều kiện bổ sung. Cách tính mức tối thiểu theo shop trong ví dụ cần được nhóm xác nhận khi triển khai.

### Các file liên quan

| Nhóm | File | Chức năng |
|---|---|---|
| DTO đầu vào | `dto/promotion/CreatePromotionRequest.java` | Chứa thời hạn, mức giảm, điều kiện và sản phẩm áp dụng. |
| DTO đầu vào | `dto/promotion/PromotionEligibilityRequest.java` | Chứa thông tin phục vụ kiểm tra phạm vi sản phẩm đủ điều kiện. |
| DTO đầu ra | `dto/promotion/PromotionResponse.java`, `dto/product/ProductResponse.java` | Trả chương trình và danh sách sản phẩm phù hợp. |
| Entity | `entity/Promotion.java`, `entity/Voucher.java`, `entity/AppliesProduct.java`, `entity/Product.java` | Biểu diễn chương trình, điều kiện và quan hệ sản phẩm theo schema được chọn. |
| Repository hỗ trợ | `repository/ProductRepository.java` | Kiểm tra sản phẩm tồn tại, còn bán và thuộc Seller. |
| Mapper | `mapper/ProductMapper.java` | Chuyển kết quả sản phẩm đủ điều kiện sang DTO khi cần. |
| Enum | `enums/DiscountType.java` | Phân biệt giảm số tiền và giảm phần trăm. |
| Security | `security/CurrentUserService.java` | Xác định Seller tạo chương trình. |
| Lỗi | `exception/BusinessException.java`, `exception/NotFoundException.java`, `exception/ForbiddenException.java`, `exception/ConflictException.java` | Báo điều kiện sai, dữ liệu không tồn tại, sai quyền hoặc xung đột mã/lượt sử dụng nếu có giới hạn. |

Việc tính và ghi nhận khuyến mãi lúc mua hàng được `CheckoutServiceImpl` phối hợp với `PromotionServiceImpl`. Không cần gọi controller khuyến mãi từ service checkout.

### Liên hệ với yêu cầu DBMS

Tạo chương trình đáp ứng **Insert**. Phần truy vấn sản phẩm đủ điều kiện phải sử dụng truy vấn con thực sự để đáp ứng **Query with a subquery**; chỉ thêm voucher chưa đủ. Truy vấn này có thể dùng để nghiên cứu **Query processing**.

## 06. Dashboard doanh thu Seller

- Tiêu chí: Aggregate functions; query processing.
- Controller: `SellerReportController.java`.
- Service + implementation: `ReportService.java`, `ReportServiceImpl.java`.
- Repository chính: `ReportRepository.java`.

### Nhiệm vụ

Chức năng giúp Seller xem tổng doanh thu, số đơn và biến động theo tháng. Backend tổng hợp dữ liệu thuộc shop hiện tại, trả kết quả để frontend hiển thị số liệu và biểu đồ.

Trước khi triển khai cần thống nhất đơn nào được tính, thời điểm ghi nhận doanh thu và cách xử lý giảm giá, hủy hoặc hoàn tiền. Nếu đơn gồm nhiều shop, doanh thu của Seller chỉ bao gồm phần hàng thuộc shop đó. Giá dùng cho báo cáo là giá đã lưu khi mua, không phải giá hiện tại của sản phẩm.

### Ví dụ

Trong kỳ báo cáo, shop A có hai đơn đủ điều kiện ghi nhận, với giá trị sau giảm giá lần lượt 400.000 và 600.000 đồng; một đơn 300.000 đồng đã hủy không được tính theo chính sách minh họa. Báo cáo trả doanh thu 1.000.000 đồng và 2 đơn.

`ReportServiceImpl` xác định shop và kỳ báo cáo; `ReportRepository` tổng hợp số liệu theo tháng. Khi một đơn có nhiều dòng sản phẩm, số đơn phải được đếm theo mã đơn khác nhau để tránh đếm lặp. Service chuyển kết quả thành `SellerRevenueResponse`; kỳ không phát sinh doanh thu được biểu diễn rõ là 0.

### Các file liên quan

| Nhóm | File | Chức năng |
|---|---|---|
| DTO đầu vào | `dto/report/ReportFilterRequest.java` | Chứa kỳ báo cáo và điều kiện được hỗ trợ. |
| DTO đầu ra | `dto/report/SellerRevenueResponse.java` | Chứa tổng tiền, số đơn và chuỗi dữ liệu theo tháng. |
| Entity liên quan | `entity/Order.java`, `entity/OrderItem.java`, `entity/PaymentInformation.java`, `entity/Seller.java` | Cung cấp dữ liệu nguồn để tổng hợp theo shop và tình trạng thanh toán. |
| Enum | `enums/OrderStatus.java`, `enums/PaymentStatus.java` | Xác định nhóm trạng thái được tính theo chính sách báo cáo. |
| Security | `security/CurrentUserService.java` | Giới hạn báo cáo theo Seller hiện tại. |
| Lỗi | `exception/BusinessException.java`, `exception/ForbiddenException.java` | Báo kỳ báo cáo không hợp lệ hoặc truy cập không được phép. |

Repository có thể trả kết quả tổng hợp trực tiếp, không cần tải toàn bộ entity đơn hàng để cộng tiền trong Java. Chưa cần tạo mapper báo cáo riêng nếu chuyển kết quả sang DTO đơn giản.

### Liên hệ với yêu cầu DBMS

Chức năng đáp ứng **Query with aggregate functions**, sử dụng tổng tiền, đếm đơn và nhóm theo tháng. Với **Query processing**, có thể so sánh SQL `GROUP BY`, `SUM`, `COUNT` với MongoDB Aggregation Pipeline trên cùng dữ liệu và cùng quy tắc tính, sau khi kiểm tra hai bên cho kết quả tương đương.

## 07. Tìm kiếm theo tên sản phẩm

- Tiêu chí: Query with a single condition; indexing.
- Controller: `ProductController.java`.
- Service + implementation: `ProductService.java`, `ProductServiceImpl.java`.
- Repository chính: `ProductRepository.java`.

### Nhiệm vụ

Chức năng cho phép người mua tìm sản phẩm theo tên hoặc từ khóa. Hệ thống trả danh sách phù hợp cùng các thông tin cần xem như tên, giá và gian hàng. Kết quả có phân trang để không tải toàn bộ sản phẩm trong một lần.

Nhóm cần thống nhất tìm theo tên chính xác, tiền tố hay chuỗi xuất hiện ở bất kỳ vị trí nào, đồng thời xác định cách xử lý chữ hoa/thường và dấu tiếng Việt. Kết quả không có sản phẩm phù hợp là danh sách rỗng hợp lệ; lỗi truy vấn phải được báo riêng.

### Ví dụ

Một sản phẩm có tên “Sản phẩm mẫu A”. Người mua nhập từ khóa “mẫu” và hệ thống sử dụng cách tìm chứa từ khóa trong ví dụ này. `ProductController` nhận bộ lọc qua `ProductFilterRequest`, service chuẩn hóa dữ liệu và repository tìm các tên phù hợp.

Kết quả được chuyển qua `ProductMapper` thành danh sách `ProductResponse`. Danh sách cần có thứ tự ổn định khi phân trang. Quy tắc chỉ hiển thị sản phẩm đang bán được áp dụng thống nhất với các màn hình khác.

### Các file liên quan

| Nhóm | File | Chức năng |
|---|---|---|
| DTO đầu vào | `dto/product/ProductFilterRequest.java` | Chứa từ khóa, phân trang và thứ tự sắp xếp. |
| DTO đầu ra | `dto/product/ProductResponse.java`, `dto/common/PageResponse.java` | Trả danh sách sản phẩm và thông tin trang. |
| Entity | `entity/Product.java`, `entity/Seller.java` | Cung cấp tên, giá và thông tin shop cần hiển thị. |
| Mapper | `mapper/ProductMapper.java` | Chuyển kết quả truy vấn sang DTO sản phẩm. |
| Enum | `enums/ProductStatus.java` | Hỗ trợ giới hạn sản phẩm được phép hiển thị. |
| Lỗi | `exception/BusinessException.java` | Báo tham số phân trang, sắp xếp hoặc từ khóa vi phạm giới hạn đã chọn. |
| Xử lý lỗi | `exception/GlobalExceptionHandler.java`, `dto/common/ErrorResponse.java` | Trả lỗi truy vấn khác với kết quả tìm kiếm rỗng. |

Nếu cho phép tìm kiếm công khai, chức năng không bắt buộc lấy người dùng qua `CurrentUserService`. Quyền truy cập được xác định tại cấu hình chung.

### Liên hệ với yêu cầu DBMS

Điều kiện tên sản phẩm đáp ứng **Query with a single condition** khi minh chứng riêng truy vấn theo tên. Nếu truy vấn ứng dụng thêm điều kiện trạng thái, cần trình bày rõ phần điều kiện bổ sung đó.

Với **Indexing**, đo thời gian và xem kế hoạch thực thi trước/sau index trên cùng dữ liệu. Tìm kiểu `LIKE '%từ khóa%'` không bảo đảm index B-tree được dùng để tìm nhanh theo khóa; cần chọn cách tìm và index phù hợp, không thay đổi ý nghĩa tìm kiếm giữa hai lần đo.

## 08. Lọc nâng cao theo danh mục

- Tiêu chí: Query with a join.
- Controller: `ProductController.java`.
- Service + implementation: `ProductService.java`, `ProductServiceImpl.java`.
- Repository chính: `ProductRepository.java`.

### Nhiệm vụ

Chức năng cho phép người mua kết hợp danh mục và khoảng giá để thu hẹp danh sách sản phẩm. Backend kiểm tra giá từ không lớn hơn giá đến, danh mục hợp lệ và trả các sản phẩm đáp ứng đồng thời các điều kiện.

Danh mục là cách nhóm sản phẩm để tìm kiếm, không mặc định trùng với loại sản phẩm có thuộc tính riêng. Một sản phẩm có thể thuộc nhiều danh mục nếu thiết kế DB cho phép; kết quả cần tránh lặp lại cùng một sản phẩm.

### Ví dụ

Người mua chọn danh mục C01, giá từ 100.000 đến 300.000 đồng. `ProductServiceImpl` kiểm tra bộ lọc; `ProductRepository` kết hợp dữ liệu sản phẩm với danh mục qua bảng liên kết nếu quan hệ là nhiều–nhiều.

P01 có giá 200.000 đồng và thuộc C01 nên được trả về; P02 có giá 400.000 đồng bị loại. Nếu P01 còn thuộc một danh mục khác, danh sách vẫn chỉ hiển thị P01 một lần và tổng số kết quả phân trang phải khớp.

### Các file liên quan

| Nhóm | File | Chức năng |
|---|---|---|
| DTO đầu vào | `dto/product/ProductFilterRequest.java` | Chứa mã danh mục, khoảng giá và thông tin phân trang. |
| DTO đầu ra | `dto/product/ProductResponse.java`, `dto/common/PageResponse.java` | Trả sản phẩm thỏa bộ lọc và tổng số kết quả theo hợp đồng API. |
| Entity | `entity/Product.java`, `entity/Category.java`, `entity/Seller.java` | Biểu diễn dữ liệu sản phẩm, danh mục và shop. |
| Repository hỗ trợ | `repository/CategoryRepository.java` | Kiểm tra danh mục được chọn. |
| Mapper | `mapper/ProductMapper.java` | Chuyển kết quả sang DTO hiển thị. |
| Enum | `enums/ProductStatus.java` | Giới hạn sản phẩm còn được phép bán hoặc hiển thị. |
| Lỗi | `exception/BusinessException.java`, `exception/NotFoundException.java` | Báo khoảng giá không hợp lệ hoặc danh mục không tồn tại. |

Danh sách lựa chọn danh mục được cung cấp bởi `CategoryController.java`, `CategoryService.java`, `CategoryServiceImpl.java` và `CategoryResponse.java`. Bảng liên kết danh mục được ánh xạ theo thiết kế DB; chưa bắt buộc có thêm entity riêng nếu mapping quan hệ đã đáp ứng.

### Liên hệ với yêu cầu DBMS

Chức năng đáp ứng **Query with a join** và có thể minh họa điều kiện kết hợp. Dữ liệu nhiều sản phẩm, nhiều danh mục cũng phù hợp để nghiên cứu **Indexing** và **Query processing**.

## 09. Quản lý giỏ hàng

- Tiêu chí: Insert + Update.
- Controller: `CartController.java`.
- Service + implementation: `CartService.java`, `CartServiceImpl.java`.
- Repository chính: `CartRepository.java`.

### Nhiệm vụ

Chức năng cho phép Buyer xem giỏ, thêm sản phẩm, thay đổi số lượng và bỏ sản phẩm khỏi giỏ. Nếu sản phẩm đã có, thao tác thêm sẽ cộng dồn; thao tác sửa số lượng đặt lại số lượng theo giá trị mới.

Backend xác định giỏ theo tài khoản hiện tại, kiểm tra sản phẩm còn bán và số lượng hợp lệ. Giá và tổng tiền được tính từ dữ liệu backend. Việc thêm vào giỏ chưa giữ hoặc trừ tồn kho theo phương án hiện tại; checkout vẫn phải kiểm tra lại khả năng đáp ứng.

### Ví dụ

Buyer đang có 1 sản phẩm P01 trong giỏ và thêm 2 sản phẩm nữa. `CartServiceImpl` đọc thông tin sản phẩm, kiểm tra điều kiện và yêu cầu `CartRepository` cập nhật số lượng thành 3 thay vì tạo hai dòng giống nhau.

Nếu Buyer sửa số lượng thành 2 ở bước tiếp theo, kết quả phải là 2, không phải cộng thêm 2. Hai yêu cầu thêm gửi gần nhau cần được xử lý để không mất cập nhật hoặc tạo dòng trùng. Sau khi lưu, backend trả `CartResponse` để frontend cập nhật số lượng và tổng tiền dự kiến.

### Các file liên quan

| Nhóm | File | Chức năng |
|---|---|---|
| DTO đầu vào | `dto/cart/AddCartItemRequest.java`, `dto/cart/UpdateCartItemRequest.java` | Phân biệt số lượng muốn cộng thêm với số lượng mới cần đặt. |
| DTO đầu ra | `dto/cart/CartResponse.java`, `dto/cart/CartItemResponse.java` | Trả giỏ hàng, từng dòng sản phẩm và tổng tiền dự kiến. |
| Entity | `entity/Cart.java`, `entity/CartItem.java`, `entity/Product.java`, `entity/Buyer.java` | Biểu diễn giỏ, chủ sở hữu và sản phẩm trong giỏ. |
| Repository hỗ trợ | `repository/ProductRepository.java` | Lấy giá, tồn kho và trạng thái kinh doanh của sản phẩm. |
| Enum | `enums/ProductStatus.java` | Kiểm tra sản phẩm còn được mua. |
| Security | `security/CurrentUserService.java` | Xác định Buyer sở hữu giỏ. |
| Lỗi | `exception/NotFoundException.java`, `exception/ForbiddenException.java`, `exception/BusinessException.java`, `exception/OutOfStockException.java` | Báo dữ liệu không tồn tại, sai quyền, số lượng sai hoặc không đủ hàng. |

Bộ khung chưa có `CartMapper`. Việc tạo response có thể đặt trong service; chỉ bổ sung mapper riêng khi cần tái sử dụng phần chuyển đổi.

### Liên hệ với yêu cầu DBMS

Chức năng đáp ứng **Insert** khi thêm dòng mới và **Update** khi đổi số lượng; xóa khỏi giỏ có thể bổ sung minh chứng Delete. Tình huống hai yêu cầu cùng sửa một dòng phù hợp để nghiên cứu **Concurrency control**.

## 10. Đặt hàng và thanh toán

- Tiêu chí: Insert + Update; transaction; concurrency control.
- Controller: `CheckoutController.java`.
- Service + implementation: `CheckoutService.java`, `CheckoutServiceImpl.java`.
- Repository chính: `OrderRepository.java`, `ProductRepository.java`, `PaymentRepository.java`, `CartRepository.java`.

### Nhiệm vụ

Chức năng chuyển giỏ hàng thành đơn mua, tính số tiền phải trả, lưu thông tin thanh toán và cập nhật tồn kho. Backend kiểm tra lại giỏ, giá, khuyến mãi, địa chỉ và khả năng đáp ứng tại thời điểm đặt hàng; không dùng tổng tiền frontend gửi lên làm kết quả chính thức.

Theo phương án demo nội bộ, các bước ghi đơn, chi tiết, payment, tồn kho và phần giỏ đã mua được thực hiện trong cùng transaction. Nhóm cần xác nhận thời điểm trừ kho và trách nhiệm của Java/procedure/trigger trước khi triển khai để một thay đổi không bị thực hiện hai lần. Tạo bản ghi thanh toán không mặc nhiên đồng nghĩa đã thu tiền, đặc biệt với thanh toán tiền mặt.

### Ví dụ

Buyer đặt 2 sản phẩm P01, đơn giá 200.000 đồng, không có giảm giá hay phí bổ sung trong ví dụ. `CheckoutServiceImpl` tính tổng 400.000 đồng, kiểm tra tồn kho, tạo đơn và chi tiết, lưu payment theo phương thức được chọn và xử lý giỏ hàng.

Để kiểm tra transaction, giả lập lỗi khi lưu payment sau bước cập nhật kho và tạo đơn. Sau rollback, không còn đơn tạo dở, kho trở về trước giao dịch và giỏ chưa bị mất các sản phẩm đó.

Để kiểm tra đồng thời, chuẩn bị sản phẩm chỉ còn 1 và hai Buyer cùng đặt mua 1. Repository phải thực hiện cập nhật kho có điều kiện hoặc khóa phù hợp trong transaction. Kết quả yêu cầu là một người thành công, người còn lại nhận lỗi hết hàng; tồn kho không âm. Chỉ đọc số lượng rồi giảm trong Java mà không có cơ chế bảo vệ chưa đáp ứng tình huống này.

### Các file liên quan

| Nhóm | File | Chức năng |
|---|---|---|
| DTO đầu vào | `dto/order/CheckoutRequest.java` | Chứa địa chỉ, phương thức thanh toán, mã khuyến mãi và thông tin chống gửi lặp nếu triển khai. |
| DTO đầu ra | `dto/order/CheckoutResponse.java` | Trả mã đơn, số tiền và trạng thái sau checkout. |
| Service hỗ trợ | `service/PaymentService.java`, `service/implementation/PaymentServiceImpl.java` | Tạo hoặc xử lý thông tin thanh toán trong luồng được chọn. |
| Service hỗ trợ | `service/PromotionService.java`, `service/implementation/PromotionServiceImpl.java` | Kiểm tra lại điều kiện giảm giá và ghi nhận lượt dùng nếu có. |
| Repository hỗ trợ | `repository/PromotionRepository.java` | Cập nhật dữ liệu khuyến mãi trong transaction khi cần. |
| Entity | `entity/Cart.java`, `entity/CartItem.java`, `entity/Product.java` | Cung cấp hàng trong giỏ, giá và tồn kho. |
| Entity | `entity/Order.java`, `entity/OrderItem.java`, `entity/PaymentInformation.java` | Lưu đơn, thông tin sản phẩm tại thời điểm mua và payment. |
| Enum | `enums/OrderStatus.java`, `enums/PaymentStatus.java`, `enums/PaymentMethod.java`, `enums/ProductStatus.java` | Thống nhất trạng thái đơn, thanh toán, phương thức và điều kiện bán sản phẩm. |
| Security | `security/CurrentUserService.java` | Xác định Buyer thực hiện checkout. |
| Lỗi | `exception/OutOfStockException.java`, `exception/BusinessException.java`, `exception/ConflictException.java`, `exception/NotFoundException.java`, `exception/ForbiddenException.java` | Báo hết hàng, giỏ hoặc điều kiện không hợp lệ, yêu cầu xung đột, dữ liệu thiếu hoặc sai quyền. |
| Cấu hình | `config/PersistenceConfig.java` | Bổ sung cấu hình transaction nếu cấu hình tự động chưa đáp ứng; không bắt buộc phải viết cấu hình riêng. |

Nếu có bước thanh toán riêng sau đặt hàng, có thể sử dụng thêm `PaymentController.java`, `PaymentRequest.java` và `PaymentResponse.java`. Checkout gọi service thanh toán, không gọi controller thanh toán. Nếu tích hợp cổng bên ngoài, cần luồng xác nhận và xử lý lặp riêng vì transaction DB không thể tự rollback giao dịch bên ngoài.

### Liên hệ với yêu cầu DBMS

Chức năng kết hợp **Insert** và **Update**, là ví dụ chính cho **Transaction** và **Concurrency control**. Hai nội dung cần hai kịch bản riêng: gây lỗi giữa chuỗi thao tác để kiểm tra rollback, và gửi yêu cầu đồng thời để kiểm tra tranh chấp tồn kho.

## 11. Lịch sử mua hàng

- Tiêu chí: Query with a join.
- Controller: `BuyerOrderController.java`.
- Service + implementation: `OrderService.java`, `OrderServiceImpl.java`.
- Repository chính: `OrderRepository.java`.

### Nhiệm vụ

Chức năng cho phép Buyer xem danh sách và chi tiết các đơn đã đặt, gồm thời gian, sản phẩm, số lượng, tổng tiền, trạng thái đơn và thanh toán. Dữ liệu được giới hạn theo người đang đăng nhập và có phân trang khi số đơn tăng.

Thông tin lịch sử cần phản ánh giao dịch tại thời điểm mua. Tên, loại hàng, đơn giá và mức giảm đã ghi nhận không được tự thay đổi khi Seller cập nhật sản phẩm hiện tại. Cách lưu các thông tin này cần được thống nhất trong thiết kế chi tiết đơn.

### Ví dụ

Buyer từng mua P01 với giá 200.000 đồng. Sau đó Seller đổi giá thành 220.000 đồng. Khi Buyer mở lịch sử, dòng hàng trong đơn cũ vẫn hiển thị đơn giá 200.000 đồng và tổng tiền đúng tại thời điểm đặt.

`OrderServiceImpl` lấy Buyer hiện tại và yêu cầu `OrderRepository` truy vấn đơn cùng chi tiết, thanh toán và tham chiếu sản phẩm khi cần. `OrderMapper` tạo response từ dữ liệu lịch sử; nếu sản phẩm đã ngừng bán, đơn cũ vẫn phải hiển thị được. Với nhiều lần thử thanh toán, cần tổng hợp hoặc chọn thông tin đúng để một đơn không bị nhân bản trong danh sách.

### Các file liên quan

| Nhóm | File | Chức năng |
|---|---|---|
| DTO đầu vào | `dto/order/OrderFilterRequest.java` | Chứa trạng thái, khoảng ngày và phân trang nếu hỗ trợ lọc lịch sử. |
| DTO đầu ra | `dto/order/OrderResponse.java`, `dto/order/OrderItemResponse.java`, `dto/common/PageResponse.java` | Trả danh sách và chi tiết đơn của Buyer. |
| Entity | `entity/Order.java`, `entity/OrderItem.java`, `entity/PaymentInformation.java`, `entity/Product.java` | Cung cấp thông tin đơn, dòng hàng, thanh toán và dữ liệu sản phẩm liên quan. |
| Mapper | `mapper/OrderMapper.java` | Chuyển dữ liệu sang response, ưu tiên giá và tên đã ghi nhận khi mua. |
| Enum | `enums/OrderStatus.java`, `enums/PaymentStatus.java` | Biểu diễn trạng thái hiển thị và lọc. |
| Security | `security/CurrentUserService.java` | Giới hạn truy vấn theo Buyer hiện tại. |
| Lỗi | `exception/NotFoundException.java`, `exception/ForbiddenException.java`, `exception/BusinessException.java` | Báo không tìm thấy đơn, không được phép xem hoặc bộ lọc sai. |

Hủy đơn là thao tác bổ sung do `OrderServiceImpl` xử lý theo trạng thái cho phép; không thực hiện hoàn kho hay thay đổi payment chỉ vì người dùng mở lịch sử.

### Liên hệ với yêu cầu DBMS

Chức năng đáp ứng **Query with a join** khi kết hợp đơn, chi tiết đơn, thanh toán và dữ liệu sản phẩm phù hợp với schema. Có thể dùng để nghiên cứu **Query processing**, đặc biệt khi phân trang và tránh lặp dữ liệu do quan hệ một–nhiều.

## 12. Dashboard chi tiêu Buyer

- Tiêu chí: Aggregate functions.
- Controller: `BuyerReportController.java`.
- Service + implementation: `ReportService.java`, `ReportServiceImpl.java`.
- Repository chính: `ReportRepository.java`.

### Nhiệm vụ

Chức năng giúp Buyer xem tổng số tiền đã chi tiêu và phân bố theo nhóm sản phẩm trong một khoảng thời gian hoặc toàn bộ lịch sử. Backend chỉ tổng hợp giao dịch thuộc Buyer hiện tại và áp dụng thống nhất quy tắc thanh toán, giảm giá, hủy và hoàn tiền.

Nhóm phân loại trong báo cáo sẽ được xác định sau khi chốt sản phẩm. Nếu dùng loại sản phẩm, cần thống nhất giá trị loại và dữ liệu lịch sử. Nếu dùng danh mục mà một sản phẩm thuộc nhiều danh mục, phải có quy tắc phân bổ để một khoản tiền không bị cộng nhiều lần.

### Ví dụ

Theo chính sách chỉ tính giao dịch đã thanh toán và chưa hoàn tiền trong ví dụ, Buyer đã chi 300.000 đồng cho nhóm A và 200.000 đồng cho nhóm B. Báo cáo trả tổng 500.000 đồng cùng hai khoản theo nhóm; một đơn chưa thanh toán không được cộng vào.

`ReportServiceImpl` xác định Buyer và kỳ báo cáo, sau đó gọi `ReportRepository` tổng hợp số tiền từ các dòng hàng và thông tin thanh toán phù hợp. Nếu có mã giảm giá chung cho đơn, cách phân bổ xuống dòng hàng phải thống nhất để tổng các nhóm khớp tổng chi tiêu. Kết quả được trả qua `BuyerSpendingResponse`.

### Các file liên quan

| Nhóm | File | Chức năng |
|---|---|---|
| DTO đầu vào | `dto/report/ReportFilterRequest.java` | Chứa khoảng thời gian cần thống kê. |
| DTO đầu ra | `dto/report/BuyerSpendingResponse.java` | Chứa tổng chi tiêu và số tiền theo từng nhóm sản phẩm. |
| Entity liên quan | `entity/Order.java`, `entity/OrderItem.java`, `entity/PaymentInformation.java`, `entity/Buyer.java` | Cung cấp số tiền lịch sử, trạng thái thanh toán và chủ sở hữu giao dịch. |
| Enum | `enums/OrderStatus.java`, `enums/PaymentStatus.java` | Xác định các giao dịch được tính theo chính sách báo cáo. |
| Phân loại dự kiến | `enums/ProductType.java` | Hỗ trợ phân nhóm nếu báo cáo dùng loại sản phẩm; giá trị cần điều chỉnh theo mặt hàng được chọn. |
| Security | `security/CurrentUserService.java` | Xác định Buyer được xem báo cáo. |
| Lỗi | `exception/BusinessException.java`, `exception/ForbiddenException.java` | Báo kỳ báo cáo không hợp lệ hoặc truy cập không được phép. |

Nếu quyết định thống kê theo danh mục, truy vấn cần bổ sung dữ liệu liên kết danh mục phù hợp; không mặc định thay loại sản phẩm bằng danh mục mà vẫn giữ nguyên phép cộng tiền.

### Liên hệ với yêu cầu DBMS

Chức năng đáp ứng **Query with aggregate functions** qua phép tổng hợp theo Buyer và nhóm sản phẩm. Có thể sử dụng thêm để nghiên cứu **Query processing** trên SQL và NoSQL với cùng dữ liệu và cùng quy tắc tính chi tiêu.

## Các phần hỗ trợ dùng chung

| Nhóm | File chính | Chức năng |
|---|---|---|
| Tài khoản | `AuthController.java`, `AuthService.java`, `AuthServiceImpl.java` | Đăng ký và xác thực tài khoản để sử dụng các chức năng cần đăng nhập. |
| Hồ sơ | `AccountController.java`, `AccountService.java`, `AccountServiceImpl.java` | Cung cấp và cập nhật thông tin cá nhân. |
| Danh mục | `CategoryController.java`, `CategoryService.java`, `CategoryServiceImpl.java` | Cung cấp danh mục dùng trong form đăng bán và bộ lọc. |
| Xác thực và quyền | `SecurityConfig.java`, `CustomUserDetailsService.java`, `CurrentUserService.java`, `AccountRole.java` | Xác định tài khoản, vai trò và quyền truy cập; service tiếp tục kiểm tra quyền sở hữu dữ liệu. |
| Xác thực tùy chọn | `TokenService.java` | Sử dụng nếu nhóm chọn cơ chế token; không bắt buộc cho phương án session. |
| Xử lý lỗi | `GlobalExceptionHandler.java`, `ErrorResponse.java` | Chuẩn hóa lỗi cho tất cả chức năng, kể cả các bảng phía trên không lặp lại hai file này. |
| Kết nối frontend | `CorsConfig.java` | Cấu hình origin frontend được gọi API từ trình duyệt. |

Các chức năng dùng chung không làm thay đổi cách phân công theo 12 tính năng. Một thành viên phụ trách tính năng sẽ làm các lớp liên quan và phối hợp với người phụ trách file chung khi cần thay đổi.

## Ghi chú về minh chứng DBMS

Sáu chủ đề DBMS không cần phân đều cho 12 tính năng. Một tính năng có thể minh họa nhiều chủ đề bằng các kịch bản khác nhau. **Data backup and recovery** chưa có chức năng trực tiếp trong danh sách này; có thể thực hiện demo sao lưu, khôi phục riêng trên database thử nghiệm.

Theo đề bài, các chủ đề được chọn cần được trình bày và so sánh trên hai DBMS; ứng dụng cần chạy tốt trên ít nhất một DBMS. Không bắt buộc triển khai toàn bộ 12 tính năng trên cả hai hệ quản trị chỉ để thực hiện các phép so sánh.
