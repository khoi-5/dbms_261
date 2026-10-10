# Kiến trúc và trách nhiệm

Hệ thống được thiết kế theo kiến trúc client–server. React phụ trách giao diện, còn Spring Boot tiếp nhận yêu cầu và cung cấp dữ liệu thông qua REST API. Backend được chia thành ba lớp chính: Controller, Service và Repository.

Luồng xử lý chính: React → Controller → Service → Repository → Database. Kết quả được trả về qua các lớp tương ứng để frontend hiển thị.

Các thư mục DTO, Entity, Mapper, Enums, Security, Exception và Config hỗ trợ những lớp chính này. Chúng không phải các bước bắt buộc phải đi qua theo thứ tự trong mọi yêu cầu. Backend trả dữ liệu JSON, vì vậy không có thư mục View riêng; phần giao diện được xây dựng trong React.

Tài liệu mô tả bộ khung dự kiến cho 12 tính năng đã thống nhất. Các file Java hiện chỉ chứa ghi chú, chưa có code thực thi. Chi tiết bảng dữ liệu, API và cơ chế xác thực sẽ được đối chiếu khi triển khai từng chức năng.

## Controller

Controller là lớp tiếp nhận yêu cầu từ frontend và trả kết quả sau khi xử lý. Ví dụ, khi người mua chọn “Thêm vào giỏ”, frontend gửi mã sản phẩm và số lượng đến `CartController`.

Dữ liệu đầu vào được tiếp nhận thông qua DTO, là đối tượng chứa các thông tin cần thiết cho từng yêu cầu. Tại bước này, các điều kiện cơ bản được kiểm tra, chẳng hạn mã sản phẩm không được để trống và số lượng phải là số nguyên dương. Controller sau đó gọi service tương ứng và trả kết quả về frontend để hiển thị.

Đối với chức năng thêm vào giỏ, `CartServiceImpl` chịu trách nhiệm kiểm tra trạng thái kinh doanh, số lượng tồn kho và cộng dồn số lượng nếu sản phẩm đã có trong giỏ. Controller gọi chức năng này thông qua `CartService`. Cách phân chia này giúp tách phần giao tiếp với frontend khỏi phần xử lý nghiệp vụ.

Với các chức năng yêu cầu đăng nhập, thông tin người dùng hiện tại được lấy qua thành phần `security`. Chẳng hạn, tài khoản sở hữu giỏ hàng được xác định từ thông tin đăng nhập đã xác thực. Mã Buyer hoặc vai trò Seller do frontend gửi lên không được dùng trực tiếp làm căn cứ cấp quyền. Khi chỉnh sửa sản phẩm, service còn phải kiểm tra sản phẩm có thuộc gian hàng của người bán đang đăng nhập hay không.

Thành viên phụ trách từng chức năng sẽ xây dựng controller tương ứng và thống nhất đường dẫn API, phương thức HTTP cùng dữ liệu gửi/nhận với thành viên phụ trách frontend. Các controller có thể sử dụng chung một service. Ví dụ, `ProductController` phục vụ người mua và `SellerProductController` phục vụ người bán đều sử dụng `ProductService`.

Các file trong thư mục `controller/`:

| File | Chức năng |
|---|---|
| `AuthController.java` | Nhận yêu cầu đăng nhập và đăng ký tài khoản. |
| `AccountController.java` | Xem, sửa hồ sơ và đổi mật khẩu của tài khoản đang đăng nhập. |
| `ProductController.java` | Tìm kiếm, lọc và xem chi tiết sản phẩm. |
| `SellerProductController.java` | Người bán đăng sản phẩm, sửa thông tin hoặc tồn kho, ngừng bán và yêu cầu xóa sản phẩm. |
| `CategoryController.java` | Lấy danh sách danh mục để hiển thị ở bộ lọc và form đăng sản phẩm. |
| `CartController.java` | Xem giỏ hàng, thêm sản phẩm, sửa số lượng và xóa sản phẩm khỏi giỏ. |
| `CheckoutController.java` | Nhận yêu cầu đặt hàng từ giỏ và gọi service thực hiện các bước tạo đơn. |
| `BuyerOrderController.java` | Người mua xem lịch sử, chi tiết đơn và gửi yêu cầu hủy đơn. |
| `SellerOrderController.java` | Người bán xem đơn cần giao, lọc đơn và cập nhật trạng thái phần hàng của shop mình. |
| `PaymentController.java` | Xử lý yêu cầu thanh toán riêng nếu có bước thanh toán sau khi đặt hàng. File này có thể chưa cần dùng nếu nhóm gộp thanh toán vào checkout. |
| `PromotionController.java` | Nhận yêu cầu tạo, xem khuyến mãi và tìm sản phẩm đủ điều kiện áp dụng. |
| `SellerReportController.java` | Lấy báo cáo doanh thu và số đơn của người bán. |
| `BuyerReportController.java` | Lấy báo cáo tổng chi tiêu và chi tiêu theo loại sản phẩm của người mua. |

## Service / implementation

Service là lớp xử lý nghiệp vụ của ứng dụng. Sau khi controller nhận yêu cầu, service kiểm tra các điều kiện cần thiết, gọi repository để đọc hoặc ghi dữ liệu và trả kết quả xử lý. Ví dụ, khi thêm sản phẩm vào giỏ, service kiểm tra sản phẩm còn bán, số lượng hợp lệ và quyết định thêm dòng mới hay cộng dồn vào dòng đã có.

Trong bộ khung này, lớp nghiệp vụ được tổ chức thành hai phần:

- `service/`: chứa các interface, khai báo tên chức năng, tham số đầu vào và kết quả trả về.
- `service/implementation/`: chứa các class có hậu tố `Impl`, triển khai phần xử lý của các interface tương ứng.

Ví dụ, `CartService` khai báo chức năng `addItem`, còn `CartServiceImpl` chứa các bước thực hiện chức năng đó. Controller gọi thông qua `CartService`; Spring cung cấp implementation phù hợp để thực thi. Đây là hai cách biểu diễn của cùng lớp nghiệp vụ, không phải hai bước xử lý chạy nối tiếp nhau.

Service trả dữ liệu hoặc kết quả nghiệp vụ; controller quyết định phản hồi HTTP. Những thao tác nhiều bước như checkout cần được điều phối tại service để có thể hoàn tác toàn bộ thay đổi khi xảy ra lỗi. Các quy tắc đã nằm trong procedure hoặc trigger phải được kiểm tra trước khi bổ sung xử lý trong Java, đặc biệt là trừ và hoàn tồn kho.

Các cặp file trong `service/` và `service/implementation/`:

| Interface | Implementation | Chức năng |
|---|---|---|
| `AuthService.java` | `AuthServiceImpl.java` | Xử lý đăng ký, đăng nhập và kiểm tra thông tin tài khoản. |
| `AccountService.java` | `AccountServiceImpl.java` | Xem, cập nhật hồ sơ và đổi mật khẩu. |
| `ProductService.java` | `ProductServiceImpl.java` | Tạo, sửa, ngừng bán, xóa, tìm kiếm và lọc sản phẩm; kiểm tra quyền sở hữu của Seller. |
| `CategoryService.java` | `CategoryServiceImpl.java` | Lấy danh mục và kiểm tra danh mục được chọn khi đăng hoặc lọc sản phẩm. |
| `CartService.java` | `CartServiceImpl.java` | Quản lý giỏ hàng, thêm hoặc cộng dồn số lượng, sửa và xóa dòng giỏ. |
| `CheckoutService.java` | `CheckoutServiceImpl.java` | Điều phối tính tiền, áp dụng khuyến mãi, cập nhật kho, tạo đơn và thông tin thanh toán. |
| `OrderService.java` | `OrderServiceImpl.java` | Lấy đơn của Buyer/Seller, kiểm tra chuyển trạng thái và xử lý hủy đơn theo quy định. |
| `PaymentService.java` | `PaymentServiceImpl.java` | Tạo thông tin thanh toán và xử lý trạng thái thanh toán theo phương thức được chọn. |
| `PromotionService.java` | `PromotionServiceImpl.java` | Tạo khuyến mãi, xác định sản phẩm đủ điều kiện và tính mức giảm khi đặt hàng. |
| `ReportService.java` | `ReportServiceImpl.java` | Xử lý phạm vi, thời gian và kết quả báo cáo doanh thu Seller, chi tiêu Buyer. |

## Repository

Repository là lớp trực tiếp làm việc với database. Khi service cần tìm sản phẩm, lưu giỏ hàng hoặc lấy doanh thu, repository thực hiện truy vấn tương ứng và trả dữ liệu để service tiếp tục xử lý.

Ví dụ, `ProductRepository` tìm sản phẩm theo mã và trả về dữ liệu sản phẩm. `CartServiceImpl` sử dụng thông tin tồn kho từ kết quả đó để xử lý yêu cầu thêm vào giỏ. Quyết định nghiệp vụ thuộc service, còn cách truy vấn và lưu dữ liệu thuộc repository.

Nếu sử dụng Spring Data JPA, các thao tác thông thường có thể được cung cấp thông qua `JpaRepository`. Những truy vấn đặc thù như báo cáo, truy vấn con hoặc gọi stored procedure có thể được viết riêng. Nếu nhóm chọn JDBC để thực hiện SQL trực tiếp, repository vẫn giữ vai trò này và không bắt buộc trả về JPA entity.

Không nhất thiết mỗi bảng phải có một repository riêng. Chẳng hạn, thao tác lưu đơn và các dòng chi tiết có thể được thực hiện thông qua `OrderRepository`, tùy cách thiết kế quan hệ. Khi triển khai cả SQL và MongoDB, cần xây dựng phần truy cập dữ liệu phù hợp cho từng hệ quản trị.

Các file trong thư mục `repository/`:

| File | Chức năng |
|---|---|
| `AccountRepository.java` | Tìm tài khoản theo thông tin đăng nhập, kiểm tra trùng và lưu thông tin tài khoản. |
| `BuyerRepository.java` | Đọc và lưu hồ sơ Buyer gắn với tài khoản. |
| `SellerRepository.java` | Đọc và lưu thông tin Seller, gian hàng và quan hệ với tài khoản. |
| `ProductRepository.java` | Truy vấn, lưu, cập nhật và xóa sản phẩm; hỗ trợ lọc danh mục, giá và cập nhật tồn kho an toàn. |
| `CategoryRepository.java` | Truy vấn danh mục và kiểm tra các mã danh mục được chọn. |
| `CartRepository.java` | Đọc giỏ, thêm hoặc cập nhật số lượng và xóa các dòng giỏ hàng. |
| `OrderRepository.java` | Lưu đơn và chi tiết đơn, truy vấn lịch sử Buyer, đơn của Seller và cập nhật trạng thái. |
| `PaymentRepository.java` | Lưu, tìm và cập nhật thông tin thanh toán của đơn hàng. |
| `PromotionRepository.java` | Lưu chương trình khuyến mãi, liên kết sản phẩm và truy vấn sản phẩm đủ điều kiện áp dụng. |
| `ReportRepository.java` | Thực hiện các truy vấn tổng hợp doanh thu, số đơn và chi tiêu. |

## DTO

DTO định nghĩa dữ liệu cần thiết cho từng yêu cầu hoặc kết quả trả về. Controller là nơi tiếp nhận request; DTO là cấu trúc dùng để chứa dữ liệu của request đó.

Ví dụ, frontend gửi mã sản phẩm và số lượng khi thêm vào giỏ. Spring chuyển dữ liệu nhận được thành đối tượng `AddCartItemRequest` rồi truyền vào phương thức của controller. Controller sử dụng đối tượng này để gọi service. DTO không tự tiếp nhận kết nối hoặc thực hiện thao tác thêm hàng.

Ở chiều trả về, `CartResponse` định nghĩa thông tin giỏ hàng mà frontend cần hiển thị. Controller trả đối tượng này và Spring chuyển thành JSON. Các DTO đầu vào có thể khai báo điều kiện cơ bản như trường bắt buộc hoặc số lượng dương; việc kiểm tra sản phẩm tồn tại, đủ hàng và thuộc quyền truy cập vẫn do service xử lý.

Các DTO được chia theo chức năng. Tên có hậu tố `Request` dành cho dữ liệu đầu vào, `Response` dành cho dữ liệu đầu ra. DTO không cần chứa toàn bộ cột của bảng trong database.

Các file trong thư mục `dto/`:

| Thư mục con | File | Chức năng |
|---|---|---|
| `auth/` | `LoginRequest.java` | Chứa thông tin đăng nhập. |
| `auth/` | `RegisterRequest.java` | Chứa thông tin tạo tài khoản và vai trò được phép đăng ký. |
| `auth/` | `AuthResponse.java` | Chứa kết quả xác thực và thông tin tài khoản cần trả về. |
| `account/` | `UpdateProfileRequest.java` | Chứa các trường hồ sơ được phép cập nhật. |
| `account/` | `ChangePasswordRequest.java` | Chứa thông tin cần kiểm tra khi đổi mật khẩu. |
| `account/` | `AccountResponse.java` | Trả thông tin tài khoản, không bao gồm mật khẩu hoặc mã băm mật khẩu. |
| `product/` | `CreateProductRequest.java` | Chứa thông tin đăng bán sản phẩm, loại hàng và danh mục. |
| `product/` | `UpdateProductRequest.java` | Chứa thông tin sản phẩm cần chỉnh sửa. |
| `product/` | `AdjustStockRequest.java` | Chứa số lượng điều chỉnh kho theo quy tắc đã thống nhất. |
| `product/` | `ProductFilterRequest.java` | Chứa từ khóa, danh mục, khoảng giá và thông tin phân trang, sắp xếp. |
| `product/` | `BookDetailsRequest.java` | Chứa các thuộc tính riêng của sách. |
| `product/` | `ClothesDetailsRequest.java` | Chứa các thuộc tính riêng của quần áo. |
| `product/` | `ElectronicsDetailsRequest.java` | Chứa các thuộc tính riêng của đồ điện tử. |
| `product/` | `ProductResponse.java` | Trả thông tin sản phẩm, gian hàng và các thuộc tính cần hiển thị. |
| `category/` | `CategoryResponse.java` | Trả thông tin danh mục. |
| `cart/` | `AddCartItemRequest.java` | Chứa mã sản phẩm và số lượng muốn thêm vào giỏ. |
| `cart/` | `UpdateCartItemRequest.java` | Chứa số lượng mới của một dòng giỏ hàng. |
| `cart/` | `CartItemResponse.java` | Trả thông tin một sản phẩm trong giỏ, số lượng và thành tiền. |
| `cart/` | `CartResponse.java` | Trả danh sách sản phẩm và tổng tiền dự kiến của giỏ. |
| `order/` | `CheckoutRequest.java` | Chứa thông tin đặt hàng như địa chỉ, phương thức thanh toán và mã khuyến mãi. |
| `order/` | `CheckoutResponse.java` | Trả mã đơn, số tiền và trạng thái sau khi đặt hàng. |
| `order/` | `OrderFilterRequest.java` | Chứa điều kiện lọc đơn theo trạng thái, thời gian và phân trang. |
| `order/` | `UpdateOrderStatusRequest.java` | Chứa trạng thái đơn hoặc phần hàng cần cập nhật. |
| `order/` | `OrderItemResponse.java` | Trả thông tin một dòng hàng tại thời điểm đặt mua. |
| `order/` | `OrderResponse.java` | Trả thông tin đơn, các dòng hàng và tình trạng thanh toán theo phạm vi được xem. |
| `payment/` | `PaymentRequest.java` | Chứa thông tin yêu cầu thanh toán; số tiền chính thức được xác định ở backend. |
| `payment/` | `PaymentResponse.java` | Trả phương thức, số tiền và trạng thái thanh toán. |
| `promotion/` | `CreatePromotionRequest.java` | Chứa thời hạn, mức giảm, điều kiện và phạm vi sản phẩm áp dụng. |
| `promotion/` | `PromotionEligibilityRequest.java` | Chứa thông tin cần dùng để tìm sản phẩm đủ điều kiện khuyến mãi. |
| `promotion/` | `PromotionResponse.java` | Trả thông tin và điều kiện của chương trình khuyến mãi. |
| `report/` | `ReportFilterRequest.java` | Chứa khoảng thời gian và các điều kiện báo cáo được hỗ trợ. |
| `report/` | `SellerRevenueResponse.java` | Trả tổng doanh thu, số đơn và dữ liệu theo tháng của Seller. |
| `report/` | `BuyerSpendingResponse.java` | Trả tổng chi tiêu và chi tiêu theo loại sản phẩm của Buyer. |
| `common/` | `PageResponse.java` | Chứa danh sách kết quả cùng thông tin phân trang. |
| `common/` | `ErrorResponse.java` | Chứa mã lỗi, thông báo và thông tin lỗi đầu vào cần trả cho frontend. |

## Entity

Entity biểu diễn dữ liệu lưu trong database dưới dạng đối tượng Java. Nếu sử dụng JPA, entity còn khai báo cách ánh xạ giữa class với bảng, giữa thuộc tính với cột và giữa các đối tượng có quan hệ với nhau.

Ví dụ, repository đọc một dòng trong bảng sản phẩm và trả về đối tượng `Product` chứa mã, tên, giá và tồn kho. Service sử dụng đối tượng đó để kiểm tra điều kiện hoặc cập nhật thông tin. Entity không phải một bước xử lý nằm sau repository; đây là kiểu dữ liệu mà repository có thể nhận vào hoặc trả về.

DTO được thiết kế theo dữ liệu cần trao đổi của từng thao tác, còn entity được thiết kế theo dữ liệu lưu trữ. Vì vậy, `ProductResponse` có thể chỉ chứa những trường cần hiển thị, trong khi `Product` còn chứa quan hệ với Seller và thông tin quản lý khác.

Các entity dưới đây là đề xuất cho phương án JPA. Tên bảng, khóa, thuộc tính và quan hệ phải được đối chiếu với thiết kế của thành viên phụ trách DB. Nếu chọn viết SQL trực tiếp bằng JDBC, repository có thể trả đối tượng Java thông thường hoặc DTO mà không cần JPA entity.

Các file trong thư mục `entity/`:

| File | Chức năng |
|---|---|
| `Account.java` | Biểu diễn tài khoản, thông tin đăng nhập và vai trò. |
| `Buyer.java` | Biểu diễn hồ sơ người mua liên kết với tài khoản. |
| `Seller.java` | Biểu diễn hồ sơ người bán và thông tin gian hàng. |
| `Product.java` | Biểu diễn thông tin chung của sản phẩm như tên, giá, tồn kho, loại và người bán. |
| `Book.java` | Biểu diễn thuộc tính riêng của sản phẩm sách. |
| `Clothes.java` | Biểu diễn thuộc tính riêng của sản phẩm quần áo. |
| `Electronics.java` | Biểu diễn thuộc tính riêng của sản phẩm điện tử. |
| `Category.java` | Biểu diễn danh mục dùng để phân loại và lọc sản phẩm. |
| `Cart.java` | Biểu diễn giỏ hàng thuộc một Buyer. |
| `CartItem.java` | Biểu diễn sản phẩm và số lượng trong giỏ hàng. |
| `Order.java` | Biểu diễn thông tin chung của đơn hàng, người mua, thời gian và trạng thái. |
| `OrderItem.java` | Biểu diễn dòng hàng trong đơn và thông tin giá, tên, loại sản phẩm tại thời điểm mua. |
| `PaymentInformation.java` | Biểu diễn phương thức, số tiền và trạng thái thanh toán của đơn hàng. |
| `Promotion.java` | Biểu diễn chương trình khuyến mãi của người bán. |
| `Voucher.java` | Biểu diễn mã hoặc điều kiện giảm giá theo thiết kế DB đã thống nhất. |
| `AppliesProduct.java` | Biểu diễn liên kết giữa chương trình khuyến mãi và sản phẩm áp dụng. |

## Mapper

Mapper thực hiện việc chuyển dữ liệu giữa các đối tượng, thường là từ entity sang DTO trả về. Ví dụ, `Account` chứa tên đăng nhập, email và mã băm mật khẩu, nhưng `AccountResponse` chỉ cần những thông tin được phép hiển thị. `AccountMapper` tạo response và sao chép các trường phù hợp từ entity.

DTO định nghĩa kết quả gồm những trường nào; mapper điền dữ liệu vào các trường đó. Mapper không thực hiện truy vấn database và không chuyển đối tượng thành JSON. Việc trả JSON do cơ chế xử lý response của Spring đảm nhiệm.

Những phép chuyển đổi được sử dụng nhiều nơi nên đặt trong mapper để tránh lặp code. Với chuyển đổi đơn giản chỉ xuất hiện một lần, có thể thực hiện trong service. Không bắt buộc mỗi entity phải có một file mapper riêng.

Các file trong thư mục `mapper/`:

| File | Chức năng |
|---|---|
| `AccountMapper.java` | Chuyển dữ liệu tài khoản sang DTO và loại các trường nhạy cảm khỏi kết quả trả về. |
| `ProductMapper.java` | Chuyển thông tin sản phẩm, loại hàng, danh mục và gian hàng sang DTO phù hợp. |
| `OrderMapper.java` | Chuyển dữ liệu đơn và chi tiết đơn sang response, giữ thông tin tại thời điểm mua và phạm vi người dùng được xem. |

## Enums

Enum định nghĩa một tập giá trị cố định trong Java. Ví dụ, trạng thái đơn hàng có thể gồm chờ xử lý, đang giao, hoàn thành và đã hủy. Các phần trong chương trình sử dụng cùng một bộ giá trị để tránh khác cách viết hoặc nhập sai tên trạng thái.

Ràng buộc trong database kiểm tra dữ liệu được lưu, còn enum giúp code Java sử dụng các giá trị thống nhất trước khi lưu xuống DB. Hai phần cần được thiết kế tương ứng. Với dữ liệu thường xuyên thay đổi hoặc cần quản lý bằng giao diện, bảng dữ liệu có thể phù hợp hơn enum cố định.

Enum chỉ định nghĩa các giá trị; service kiểm tra khi nào được chuyển từ giá trị này sang giá trị khác. Chẳng hạn, `OrderStatus` không tự quyết định một đơn đang giao có được phép hủy hay không.

Các file trong thư mục `enums/`:

| File | Chức năng |
|---|---|
| `AccountRole.java` | Định nghĩa vai trò tài khoản như Buyer và Seller. |
| `ProductType.java` | Định nghĩa các loại sản phẩm Books, Clothes và Electronics theo giá trị thống nhất với DB. |
| `ProductStatus.java` | Định nghĩa trạng thái kinh doanh của sản phẩm. |
| `OrderStatus.java` | Định nghĩa các trạng thái đơn hàng. |
| `PaymentStatus.java` | Định nghĩa các trạng thái thanh toán. |
| `PaymentMethod.java` | Định nghĩa các phương thức thanh toán được hỗ trợ. |
| `DiscountType.java` | Định nghĩa hình thức giảm giá, chẳng hạn giảm theo số tiền hoặc phần trăm. |

## Security

Security hỗ trợ xác thực tài khoản và xác định quyền truy cập. Khi một chức năng yêu cầu đăng nhập, backend cần biết người gửi yêu cầu là ai và có vai trò nào trước khi cho phép thực hiện thao tác.

Ví dụ, khi thêm vào giỏ, tài khoản Buyer được xác định từ thông tin xác thực. Khi sửa sản phẩm, backend kiểm tra vai trò Seller; service tiếp tục kiểm tra sản phẩm có thuộc gian hàng của Seller đó hay không. Kiểm tra vai trò không thay thế kiểm tra quyền sở hữu từng dữ liệu.

Cơ chế xác thực bằng session hoặc token sẽ được nhóm lựa chọn khi triển khai. Chỉ cần sử dụng `TokenService` nếu phương án xác thực có dùng token.

Các file trong thư mục `security/`:

| File | Chức năng |
|---|---|
| `CurrentUserService.java` | Cung cấp thông tin tài khoản, vai trò và Buyer/Seller đang đăng nhập cho các chức năng cần dùng. |
| `CustomUserDetailsService.java` | Nạp thông tin tài khoản từ database để tích hợp với Spring Security. |
| `TokenService.java` | Hỗ trợ tạo và xử lý token theo cơ chế xác thực được chọn; có thể bỏ nếu sử dụng session và không cần token. |

## Exception

Exception biểu diễn các trường hợp xử lý thất bại. Ví dụ, service phát hiện số lượng đặt mua vượt tồn kho thì phát sinh `OutOfStockException`. Luồng xử lý bình thường dừng lại và chuyển sang xử lý lỗi.

`GlobalExceptionHandler` tập trung việc chuyển lỗi thành phản hồi HTTP và `ErrorResponse`. Nhờ đó, các controller không phải lặp lại cách trả lỗi cho cùng một tình huống. Frontend cũng có thể phân biệt lỗi không đủ hàng, không tìm thấy dữ liệu và lỗi hệ thống để hiển thị thông báo phù hợp.

Với thao tác nhiều bước trong transaction, cần cấu hình việc rollback phù hợp với loại exception sử dụng. Chỉ tạo một class exception chưa đủ để bảo đảm mọi thay đổi dữ liệu đều được hoàn tác.

Các file trong thư mục `exception/`:

| File | Chức năng |
|---|---|
| `GlobalExceptionHandler.java` | Chuyển các lỗi thành phản hồi thống nhất; không trả chi tiết SQL, mật khẩu hoặc stack trace cho frontend. |
| `BusinessException.java` | Biểu diễn lỗi vi phạm quy tắc nghiệp vụ chung. |
| `NotFoundException.java` | Báo không tìm thấy dữ liệu cần thao tác, chẳng hạn sản phẩm hoặc đơn hàng. |
| `ForbiddenException.java` | Báo tài khoản không có quyền thực hiện thao tác. |
| `OutOfStockException.java` | Báo sản phẩm không đủ số lượng để đáp ứng yêu cầu. |
| `ConflictException.java` | Báo xung đột dữ liệu như trùng thông tin hoặc trạng thái đã thay đổi bởi thao tác khác. |

## Config

Config chứa các lớp thiết lập cách backend hoạt động. Đây là phần cấu hình dùng chung, không phải nơi xử lý từng chức năng mua bán.

Ví dụ, `CorsConfig` xác định frontend ở địa chỉ nào được phép gọi API từ trình duyệt. `SecurityConfig` thiết lập cơ chế đăng nhập và quy tắc truy cập. CORS không thay thế việc xác thực và phân quyền người dùng.

Các giá trị thay đổi theo môi trường như cổng chạy, địa chỉ database và thông tin kết nối được đặt trong cấu hình hoặc biến môi trường phù hợp. Các class trong `config/` sử dụng những giá trị này khi cần thiết.

Các file trong thư mục `config/`:

| File | Chức năng |
|---|---|
| `SecurityConfig.java` | Cấu hình Spring Security, cơ chế xác thực, quy tắc truy cập và bộ mã hóa mật khẩu. |
| `CorsConfig.java` | Cấu hình các origin frontend được phép gọi API. |
| `PersistenceConfig.java` | Bổ sung cấu hình truy cập dữ liệu và transaction khi cấu hình tự động của Spring Boot chưa đáp ứng yêu cầu. |

## File khởi động và Resources

`BackendNewApplication.java` là điểm khởi động Spring Boot khi phần code thực thi được bổ sung. File này khởi tạo ứng dụng; các xử lý như đặt hàng, trừ kho hoặc tạo báo cáo vẫn nằm trong các lớp nghiệp vụ tương ứng.

Thư mục `src/main/resources/` chứa cấu hình và các tài nguyên phục vụ backend. Nếu sử dụng công cụ migration, các thay đổi cấu trúc DB được lưu thành script có thứ tự để các thành viên cập nhật cùng một phiên bản database.

Các file liên quan hiện có:

| File | Chức năng |
|---|---|
| `src/main/java/com/bkpee/BackendNewApplication.java` | Điểm khởi động ứng dụng; hiện chỉ có ghi chú triển khai. |
| `src/main/resources/application.yml` | Dành cho cấu hình môi trường, cổng chạy và kết nối DB; hiện chỉ có ghi chú, chưa chứa cấu hình chạy thực tế. |
| `src/main/resources/db/migration/README.md` | Hướng dẫn tổ chức script cập nhật DB; chưa có migration SQL thực thi. |

## Ví dụ phối hợp giữa các phần

Với chức năng thêm sản phẩm vào giỏ, luồng dự kiến như sau:

1. Frontend gửi mã sản phẩm và số lượng. Thông tin đăng nhập được thành phần security xác thực.
2. Spring chuyển dữ liệu gửi lên thành `AddCartItemRequest`; `CartController` tiếp nhận đối tượng này và lấy Buyer đang đăng nhập.
3. Controller gọi `CartService`. Implementation được sử dụng là `CartServiceImpl`.
4. Service gọi `ProductRepository` và `CartRepository` để lấy sản phẩm và giỏ hàng. Nếu dùng JPA, dữ liệu được biểu diễn qua các entity liên quan.
5. Service kiểm tra điều kiện, thêm hoặc cộng dồn số lượng và yêu cầu repository lưu thay đổi. Thao tác thêm vào giỏ chưa trừ tồn kho.
6. Kết quả được chuyển thành `CartResponse` trong service hoặc qua mapper nếu bổ sung mapper riêng cho giỏ. Controller trả kết quả và Spring chuyển thành JSON.
7. Nếu có lỗi, `GlobalExceptionHandler` chuyển lỗi thành phản hồi phù hợp thay cho kết quả thành công.

## Transaction

Transaction là cơ chế bảo đảm một nhóm thao tác dữ liệu được hoàn thành cùng nhau hoặc được hoàn tác khi thất bại. Đây là nội dung phối hợp giữa service và database, không phải một thư mục riêng trong bộ khung.

Trong demo checkout, `CheckoutServiceImpl` điều phối các bước tạo đơn, lưu chi tiết, tạo thông tin thanh toán, cập nhật tồn kho và xử lý giỏ hàng. Nếu một bước thất bại, transaction cần rollback các thay đổi liên quan. Các service và repository được gọi trong luồng này phải tham gia transaction phù hợp, tránh lưu thành công từng phần riêng biệt.

Transaction cũng cần kết hợp cơ chế kiểm soát đồng thời để xử lý trường hợp hai người cùng mua sản phẩm chỉ còn một đơn vị. Việc chỉ đọc tồn kho rồi cập nhật mà không có bảo vệ đồng thời có thể dẫn đến bán vượt số lượng.

Nhóm cần thống nhất thời điểm trừ kho và phần chịu trách nhiệm thực hiện: Java, stored procedure hoặc trigger. Một thay đổi tồn kho không được thực hiện lặp ở nhiều nơi. Tạo thông tin thanh toán cũng không đồng nghĩa đã thu tiền thành công; trạng thái phải phù hợp với phương thức thanh toán.

Phạm vi transaction DB nêu trên phù hợp với demo thanh toán nội bộ. Nếu tích hợp cổng thanh toán bên ngoài, cần thiết kế thêm luồng xác nhận, xử lý yêu cầu lặp và bù trừ khi thất bại, vì transaction DB không thể tự hoàn tác giao dịch của hệ thống bên ngoài.

Các file giữ vai trò chính trong luồng này:

| File | Chức năng |
|---|---|
| `CheckoutServiceImpl.java` | Xác định và điều phối toàn bộ thao tác của một lần checkout. |
| `PaymentServiceImpl.java` | Xử lý thông tin thanh toán và tham gia transaction checkout khi dùng demo nội bộ. |
| `PromotionServiceImpl.java` | Kiểm tra khuyến mãi và cập nhật lượt sử dụng nếu có, nhất quán với kết quả đặt hàng. |
| `ProductRepository.java` | Cập nhật tồn kho bằng thao tác có kiểm soát đồng thời. |
| `OrderRepository.java` | Lưu đơn và các dòng chi tiết trong cùng luồng giao dịch. |
| `PaymentRepository.java` | Lưu dữ liệu thanh toán. |
| `CartRepository.java` | Cập nhật phần giỏ đã đặt hàng theo kết quả checkout. |
