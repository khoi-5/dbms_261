# Bàn giao F01, F08, F09, F10

## Chuẩn hóa cổng — kiểm tra lại ngày 12/11/2026

- Frontend `http://localhost:5173`, backend `http://localhost:8080`, SQL Server
  `localhost:1433`, database `BKPEE_DB`. Dùng `npm run dev` và `mvn spring-boot:run`
  bình thường, không cần tham số đổi cổng.
- API client mặc định gọi 8080, nhưng hướng dẫn/smoke cũ dùng cổng khác. Khi backend
  chỉ chạy ở cổng khác thì frontend không thể kết nối 8080. Tại lúc kiểm tra lại,
  cả hai server đều chưa chạy và HTTP bị từ chối kết nối. Không quan sát được
  Network tab của phiên trình duyệt từng báo lỗi nên không khẳng định thêm nguyên
  nhân riêng của phiên đó. CORS hiện tại đã đúng và không cần sửa SecurityConfig.
- Đã xác minh module do Vite phục vụ chứa `VITE_API_URL=http://localhost:8080/api`.
  Chạy API client frontend thật qua Node fetch tới backend/SQL: sản phẩm và danh mục
  đều thành công; Guest không gửi Authorization, JSON phân trang được đọc đúng.
- `mvn clean test`: BUILD SUCCESS, 7 tests qua, 1 SQL test được bỏ qua có chủ đích
  vì test đó ghi dữ liệu. Frontend 6 tests qua và production build qua.
- GET products: 200, totalElements=3000, totalPages=250, size=12. GET categories:
  200, 30 danh mục. CORS GET và preflight Login/Register/Cart đều qua; origin lạ
  bị từ chối. Login sai trả 401; Register rỗng trả 400; giỏ chưa xác thực trả 401.
- Token QA ký trong bộ nhớ xác minh GET accounts/me và giỏ QA đã có sẵn đều 200.
  Đây là kiểm tra JWT/GET, không phải đăng nhập bằng mật khẩu hoặc đăng ký thành công.
  Không chạy lại luồng đăng ký/thêm/sửa/xóa giỏ vì yêu cầu lần này không ghi SQL.
- Chỉ đọc SQL; số bản ghi trước/sau giữ nguyên: Product 3000, Category 30,
  Account 2012, Cart 1808, Cart_Item 3000. Không chạy lại seed/schema.
- Browser access host không sẵn có: chưa xác minh UI `/products` trong trình duyệt.
  HTTP HTML/module 200 và API client thật qua không thay thế kiểm thử UI.

Các kết quả 8 Maven tests / 54 smoke assertions ở phần dưới là kiểm thử của lần
triển khai chức năng trước, không phải các test ghi SQL đã chạy lại lần chuẩn hóa.

## Phạm vi và kết quả

Triển khai React/JSX và Spring Boot/JDBC trên schema SQL Server hiện có. Không thêm
dependency frontend/backend, không đổi schema/index, không chạy lại seed, không sửa
MongoDB. Không triển khai checkout, voucher, đơn hàng hoặc báo cáo.

- F01: đăng ký Buyer, đăng nhập username/email, BCrypt cost 12, JWT HS256,
  thông tin tài khoản hiện tại, AuthContext, route theo vai trò, logout phía client.
- F08/F09: danh sách công khai, tìm theo tên, category/giá, phân trang, chọn variant,
  loading/error/empty. Query thật, không fallback mock.
- F10: giỏ Buyer xác định từ JWT và kiểm tra lại hồ sơ DB; thêm/cộng dồn, đặt lại số
  lượng, xóa dòng, tổng tiền do backend tính; không giữ/trừ tồn kho.
- Frontend build và API client tests đã qua. HTTP/SQL smoke tests và Maven SQL
  integration tests đã qua. Chưa xác minh tương tác UI trong trình duyệt hoặc độ
  khớp pixel với ảnh Figma: browser host không sẵn có và truy cập Chrome native
  hết thời gian chờ phê duyệt. Không coi build/API tests là UI end-to-end test.

## File tạo mới

Backend:

- `src/main/java/com/bkpee/auth/AccountAuthService.java`
- `src/main/java/com/bkpee/auth/AuthApi.java`
- `src/main/java/com/bkpee/auth/ApiErrors.java`
- `src/main/java/com/bkpee/auth/DemoSellerProvisioner.java`
- `src/main/java/com/bkpee/buyer/CatalogApi.java`
- `src/main/java/com/bkpee/buyer/BuyerCartService.java`
- `src/main/java/com/bkpee/buyer/CartApi.java`
- `src/test/java/com/bkpee/integration/BuyerSqlIntegrationTest.java`
- `scripts/smoke_buyer.py`
- `scripts/create_demo_buyer.py`
- `scripts/create_demo_seller.py`

Frontend:

- `.env.example`
- `src/auth/AuthContext.jsx`, `src/auth/ProtectedRoute.jsx`
- `src/services/api.js`, `src/services/api.test.js`
- `src/components/BuyerLayout.jsx`
- `src/components/ProductCard.jsx`, `src/components/ProductImage.jsx`
- `src/pages/AuthPage.jsx`, `src/pages/ProductsPage.jsx`
- `src/pages/CartPage.jsx`, `src/pages/PlaceholderPage.jsx`

File chỉnh trong lần triển khai này:

- `backend/src/main/java/com/bkpee/security/SecurityConfig.java`: công khai GET categories.
- `backend/src/main/java/com/bkpee/security/JwtService.java`: hỗ trợ roles lấy từ DB,
  giữ overload cấp token một role cho code/test cũ.
- `frontend/src/App.jsx`, `frontend/src/App.css`: routes và giao diện Buyer/Auth.
- `frontend/src/components/SellerLayout.jsx`: nối logout thực tế.
- `frontend/index.html`: ngôn ngữ, tiêu đề, mô tả.

Các thay đổi có sẵn của bootstrap (main, application.yml, pom, JWT config, v.v.)
được giữ nguyên. Không sửa `SellerProductManagement.jsx` hoặc `AddProductModal.jsx`.
Các file nghiệp vụ cũ chỉ chứa comment được giữ lại; implementation mới nằm trong
package `auth` và `buyer` để không biến mô tả thiết kế thành code giả đã hoàn thành.

## Endpoint

| Method | Path | Quyền / request |
|---|---|---|
| POST | `/api/auth/register` | Public; username,email,password,firstName,lastName,phone,cccd; luôn tạo Buyer |
| POST | `/api/auth/login` | Public; identity,password |
| GET | `/api/accounts/me` | JWT; kiểm tra tài khoản và roles trong DB |
| GET | `/api/categories` | Guest |
| GET | `/api/products` | Guest; keyword,categoryId,minPrice,maxPrice,page,size |
| GET | `/api/products/{productId}/variants` | Guest; variant đang được bán và còn kho |
| GET | `/api/buyer/cart` | Buyer hiện tại |
| POST | `/api/buyer/cart/items` | Buyer; variantId,quantity; cộng dồn |
| PUT | `/api/buyer/cart/items/{variantId}` | Buyer; quantity; đặt giá trị mới |
| DELETE | `/api/buyer/cart/items/{variantId}` | Buyer; xóa chỉ dòng thuộc giỏ hiện tại |

Auth trả `{token,account:{id,username,email,firstName,lastName,roles}}`.
Không có endpoint đăng ký Seller công khai hoặc endpoint logout thu hồi JWT.
Token lưu trong sessionStorage của tab; logout xóa token/state. Token đã phát
hành vẫn có hiệu lực tới hạn nếu được sao chép trước logout. Chưa có refresh/revoke.
403 hiển thị lỗi quyền; 401 xóa phiên; frontend có timer theo `exp`, backend kiểm
tra chữ ký, issuer và hạn dùng. Account không ACTIVE bị từ chối ở login/me/cart.

Catalog trả `{items,page,size,totalElements,totalPages}`; `page` bắt đầu 0,
`size` mặc định 12, tối đa 48. Giá không âm, tối đa 2 chữ số thập phân và phù hợp
decimal(18,2). Category lọc chính xác ID, chưa tự bao gồm category con.

Cart trả `{id,items,total,totalQuantity}`. Mỗi item gồm variantId,productId,name,
shop,image,price,stock,active,sellerStatus,quantity,subtotal. Request không nhận giá
hay tổng tiền; Buyer_ID/Cart_ID do client thêm không được dùng làm danh tính.
Số lượng và variantId phải là số nguyên dương trong giới hạn INT; 0 không là xóa.

## Quy tắc schema và SQL

**CCCD:** cột `Account.CCCD` nullable UNIQUE không phải filtered unique index;
SQL Server chỉ cho một NULL. Đăng ký yêu cầu CMND 9 số hoặc CCCD 12 số, không tạo
giá trị giả và không sửa index. Account API không trả CCCD/password/hash.
Thông tin hồ sơ đăng ký và CCCD là dữ liệu thử do người chạy demo cung cấp.

**F08 — single business search condition:** `p.Product_Name LIKE :keyword ESCAPE '~'`.
Escape `%`, `_`, `[` và `~` để từ khóa được xem là literal. Các tham số được bind,
không nối dữ liệu người dùng vào SQL. Các JOIN và điều kiện bán hàng vẫn áp dụng.

**F09 — JOIN + aggregate + HAVING + pagination:**

```sql
SELECT p.Product_ID, p.Product_Name, c.Category_ID, c.Category_Name,
       MIN(v.Price) AS price, COUNT(*) AS variantCount
FROM Product p
JOIN Category c ON c.Category_ID=p.Category_ID
JOIN Product_Variant v ON v.Product_ID=p.Product_ID
JOIN Seller s ON s.Account_ID=p.Seller_ID
JOIN Account a ON a.Account_ID=s.Account_ID
WHERE v.Is_Active=1 AND v.Quantity_Stock>0 AND a.Account_Status=N'ACTIVE'
  AND p.Product_Name LIKE :keyword ESCAPE '~'
  -- AND c.Category_ID=:categoryId, khi có bộ lọc
GROUP BY p.Product_ID,p.Product_Name,c.Category_ID,c.Category_Name
HAVING 1=1
  -- AND MIN(v.Price)>=:minPrice AND MIN(v.Price)<=:maxPrice, khi có bộ lọc
```

Mỗi Product chỉ một dòng. Giá hiển thị và lọc là MIN của variant active còn kho,
không phải giá của variant bất kỳ. Chọn variant trong hộp mua có thể cho giá cao
hơn khoảng tìm kiếm vì bộ lọc là trên giá “từ” của Product. Ảnh lấy bằng OUTER APPLY
TOP 1 variant có giá thấp nhất, tie-break Variant_ID. Bọc query để COUNT_BIG và dùng
ORDER BY Product_ID OFFSET/FETCH cho trang; không trả toàn bộ 3.000 Product.

**F10 — JOIN + transactional DML:**

- JOIN Cart_Item → Product_Variant → Product → Seller → Account; Cart xác định bằng
  Buyer_ID từ JWT đã đối chiếu Buyer/Account trong DB.
- Khóa hàng Buyer bằng UPDLOCK,HOLDLOCK trong transaction để serialize tạo giỏ,
  thêm và cập nhật cùng Buyer; kiểm tra variant/kho trong transaction.
- Thêm: đọc số lượng đã có, INSERT hoặc UPDATE tổng mới; sửa: UPDATE số lượng mới.
- Xóa: `DELETE FROM Cart_Item WHERE Cart_ID=? AND Variant_ID=?`.
- Tổng tiền SQL từng dòng: `CAST(v.Price*ci.Quantity AS decimal(28,2))`; cộng BigDecimal
  ở backend. Không dùng số tiền client.
- `Cart.Total_product` được quy ước là số dòng variant (COUNT), `totalQuantity` là
  tổng số đơn vị. Giỏ không giữ kho; F11 phải kiểm tra và trừ kho trong transaction.
- Variant ngừng bán/hết kho trong giỏ vẫn được hiển thị cảnh báo và có thể xóa;
  thao tác tăng/đặt số lượng phải qua kiểm tra trạng thái/kho.

## Kiểm thử và giới hạn

1. `mvn test -q`: các test JWT/security độc lập DB đã qua.
2. `$env:RUN_SQL_INTEGRATION='true'; mvn test -q`: 8 tests (7 security + 1 SQL),
   không fail/error/skip. SQL test tạo Buyer/Seller QA mới, kiểm tra BCrypt,
   login Seller thực tế, khóa rồi khôi phục chính Buyer QA, JWT hết hạn, sai role,
   role claim không thay được hồ sơ Buyer trong DB. Không sửa trạng thái seed.
3. `python scripts/smoke_buyer.py`: 54 kiểm tra HTTP với SQL thật, tìm/lọc kết hợp,
   phân trang, escaped wildcard, giá MIN, duplicate/invalid input, giỏ persist,
   tính tiền, tăng đồng thời, không truy cập giỏ người khác, không nhận role Seller
   từ đăng ký public. Chỉ tạo tài khoản QA mới; xóa các dòng giỏ chính test tạo.
4. `node --test src/services/api.test.js`: 5 tests qua; kiểm tra Bearer/JSON,
   401, 403, lỗi mạng/nghiệp vụ và bỏ token sau logout. Đây là test API client,
   không phải kiểm thử thao tác UI.
5. `npm.cmd run build`: qua. HTTP frontend `/products`: 200.
6. Profile `demo-account`: đã chạy thành công với dữ liệu QA và mật khẩu ngẫu nhiên
   trong environment; tạo một Seller mới, tự đóng context và Maven thoát mã 0.

Test SQL mặc định tắt để `mvn test` không vô tình ghi database. Khi bật, tài khoản
QA được giữ lại, mật khẩu ngẫu nhiên chỉ trong bộ nhớ; không in token/password.
Mỗi lần chạy smoke tạo 2 Buyer; mỗi lần chạy SQL integration tạo 1 Buyer + 1 Seller.
Không reset seed hoặc xóa tài khoản hàng loạt. Identity có thể tăng do transaction
rollback trong các lần phát hiện constraint; đây không phải reset database.

## Chạy và demo trên Windows PowerShell

Giữ `backend/.env` đã cấu hình SQL/JWT; không đưa secret vào Git. Java 21, Maven,
Node hiện có. Cổng chuẩn: frontend localhost:5173, backend localhost:8080 và SQL
Server localhost:1433. Nếu cổng bị chiếm, kiểm tra PID; không tự dừng tiến trình khác.

Terminal backend:

```powershell
cd E:\dbms\backend
mvn spring-boot:run
```

Terminal frontend:

```powershell
cd E:\dbms\frontend
npm.cmd ci --no-audit --no-fund
npm run dev
```

Mở `http://localhost:5173/products` để thử Guest search/filter/pagination. Đăng ký
Buyer mới với dữ liệu thử duy nhất; chọn mua → variant → giỏ → sửa số lượng → tải
lại → xóa → logout. Checkout chỉ là placeholder, không tạo đơn/thanh toán.

Tạo demo Buyer với BCrypt thật (không có mật khẩu cố định trong Git):

```powershell
cd E:\dbms\backend
$env:API_BASE='http://localhost:8080/api'
python scripts/create_demo_buyer.py
```

Tạo demo Seller mới, không đổi hash tài khoản seed:

```powershell
cd E:\dbms\backend
python scripts/create_demo_seller.py
```

Script Seller hỏi dữ liệu và mật khẩu kín, truyền qua environment của process con,
khởi động profile `demo-account` trên port ngẫu nhiên, INSERT Account/User/Seller
trong transaction rồi đóng context. Không có API tương đương công khai. Username,
email, phone, CCCD và shop phải mới. Không dùng profile này cho server website thường.
Seed hash minh họa vẫn không đăng nhập được; không tự chuyển hash seed.

Kiểm tra kết nối chỉ đọc, không tạo tài khoản hoặc sửa giỏ:

```powershell
cd E:\dbms\backend
python scripts/check_connection.py
```

Các lệnh dưới đây có GHI dữ liệu QA. Chỉ chạy khi chủ động kiểm thử chức năng,
không chạy để kiểm tra cổng/kết nối. Chạy lại smoke:

```powershell
cd E:\dbms\backend
$env:API_BASE='http://localhost:8080/api'
python scripts/smoke_buyer.py
$env:RUN_SQL_INTEGRATION='true'
mvn test -q
Remove-Item Env:RUN_SQL_INTEGRATION
```

## Route và phần phụ thuộc nhóm

- Công khai: `/` redirect `/products`, `/products`, `/login`, `/register`.
- Buyer: `/cart`; placeholder `/checkout`, `/orders`, `/spending`, `/profile`.
- Seller: giữ `/seller/products`, `/seller/dashboard`, `/seller/orders`,
  `/seller/promotions`; bọc kiểm tra role. Logout Seller đã nối AuthContext.
- Logic Seller F02–F04 không bị viết lại; các fetch/mock/hardcoded ID và endpoint
  Seller cũ vẫn là tồn đọng của module đó, không được coi đã tích hợp nhờ F01.
- Nhóm Seller cần nối API của họ với API client và danh tính JWT, cung cấp ảnh thật.
  Buyer có placeholder ảnh khi seed URL thiếu/hỏng; không thay ảnh bằng sản phẩm mock.
- F11 cần kiểm tra lại giá/kho, trạng thái Seller, voucher và xử lý transaction.
- F05–F07/F12–F13 và hồ sơ vẫn để thành viên khác làm.
- Cần kiểm tra UI thủ công trên desktop/mobile và đối chiếu hai ảnh trước nghiệm thu.
