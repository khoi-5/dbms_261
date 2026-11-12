# Nâng cấp có kiểm soát BKPEE — F01/F08/F09/F10

## Kết quả và giới hạn nghiệm thu

| Hạng mục | Kết quả |
|---|---|
| Backend `mvn clean package` | PASS; 12 tests, không fail/error/skip khi bật SQL tests trên DB test |
| Frontend `npm run build` | PASS; 42 modules |
| Node tests API client + catalog/quantity | PASS; 8 tests |
| Smoke API/SQL cũ | PASS; 54 assertions |
| API/SQL nâng cấp | PASS; 91 assertions |
| Seed mới | PASS; 3.000 Product, 9.000 Variant, mỗi subtype 1.000; các count bảng lớn được assert trong seed |
| Tái lập seed | PASS trên các bảng đối chiếu: Product, Variant, Account, Cart, Shop_Order có cùng count/checksum sau 2 lần nạp |
| Website `BKPEE_DB` | Không chạy DML/DDL/seed/backfill; count/checksum đối chiếu giữ nguyên |
| UI trong trình duyệt | NOT TESTED: browser access host không sẵn có; đã thử lại sau timeout |
| Seller F02–F07 | Không sửa file Seller; không tuyên bố đã kiểm thử E2E module của thành viên khác |

Không commit/push. Không thêm thư viện, đổi framework, sửa schema/index hoặc MongoDB.
Build/Node tests/API tests không thay thế kiểm thử tương tác và responsive trong browser.
Các trường hợp Guest mở modal, click con mắt, double-click, đổi URL/Back và JWT hết
hạn khi modal đang mở còn cần nghiệm thu UI; phía helper/API đã có kiểm tra tương ứng.

## Database kiểm thử và bảo vệ dữ liệu

- Nâng cấp: `BKPEE_TEST_20261112_227d8c31`.
- Benchmark gốc riêng: `BKPEE_TEST_20261112_227d8c31_baseline`.
- Chỉ các database trên được ghi trong kiểm thử. QA accounts và dữ liệu test được
  giữ để kiểm tra; database baseline không dùng cho test nghiệp vụ.
- Runner dùng server test 8082 và JWT secret ngẫu nhiên trong environment, đóng
  đúng process do runner tạo. Không sửa `.env` website hoặc frontend API 8080.
- Trước API write, test tạo marker trên DB test rồi tìm marker qua HTTP để xác
  nhận server đang phục vụ đúng DB. Test Java cũng chặn DB không có prefix test.
- Không backfill `Cart.Total_product` của website. Giá trị cũ chỉ được tính lại
  theo SUM khi chính người dùng thay đổi giỏ đó ở phiên bản mới.

Count/checksum tổng hợp chỉ đọc của website trước/sau:

| Bảng | Rows | CHECKSUM_AGG(BINARY_CHECKSUM(*)) |
|---|---:|---:|
| Account | 2013 | 1477166007 |
| Product | 3000 | -48742138 |
| Cart | 1809 | -345863862 |
| Cart_Item | 3001 | 431219 |

Đây là phép đối chiếu tổng hợp, không phải khẳng định checksum không có khả năng
va chạm. Các lệnh ghi của kiểm thử đều được trỏ rõ sang database test.

## Hợp đồng và hành vi mới

### Catalog

- Frontend `src/config/catalog.js` tập trung `CATALOG_PAGE_SIZE=12`, max 48 và
  hỗ trợ biến `VITE_CATALOG_PAGE_SIZE` / `VITE_CATALOG_MAX_PAGE_SIZE` khi cần.
- Backend `app.catalog.default-page-size=12`, `max-page-size=48`, có thể override
  bằng `CATALOG_DEFAULT_PAGE_SIZE` / `CATALOG_MAX_PAGE_SIZE`. Cấu hình hai phía cần
  đồng bộ khi chủ động thay đổi; số cột CSS Grid không liên quan page size.
- Frontend luôn gửi size, giữ size/filter/keyword/page trong URL; page API 0-based,
  UI 1-based. Size/page sai định dạng trong URL được đưa về mặc định; page vượt tổng
  trang được chuyển về trang cuối hợp lệ (hoặc 0 nếu rỗng), có thông báo.
- Đổi search/filter về page 0, giữ size đang hợp lệ. API vẫn chấp nhận size 1..max.
- Keyword trim khoảng trắng Unicode và NFC trước validation, không bỏ dấu hoặc
  đổi collation. Escape LIKE và bind tham số được giữ. Keyword rỗng bỏ predicate tên.
- Category vẫn lọc chính xác ID, chưa tự mở rộng sang con. Category tải độc lập với
  Product, có lỗi/retry riêng; không tải lại theo mỗi lần đổi trang.
- Giá hiển thị/lọc là MIN variant active, còn kho và Seller ACTIVE. OUTER APPLY
  chọn ảnh theo giá rồi Variant_ID. GROUP BY giữ một dòng/Product. Không tạo index.
- Giá `1.000` được nhận vì phần thập phân chỉ có số 0; `1.001` bị từ chối.

Các endpoint catalog và trường JSON hiện có giữ nguyên. SQL đã chuyển từ
CatalogApi sang CatalogJdbcRepository; response là record DTO thay Map.

### Chọn mua và giỏ

- Modal chọn variant, số lượng mặc định 1; nút +/- và nhập trực tiếp; kiểm tra số
  nguyên 1..stock; hiển thị đơn giá, kho và tạm tính. SVG thay glyph tìm kiếm.
- POST vẫn là `{variantId,quantity}` và cộng dồn; backend kiểm tra lại lượng đang
  có trong giỏ + lượng thêm. Lỗi kho cho biết lượng hiện có và tồn kho.
- Pending ref chặn POST trùng trước khi React render lại, khóa nút khi gửi, không
  tự retry POST. Lỗi mạng không rõ kết quả yêu cầu kiểm tra giỏ trước khi thêm lại.
- Guest cần login; JWT 401 xóa phiên theo API client hiện tại. Đóng modal/thông báo
  sau thành công; không báo thành công cho tài khoản đã đổi trong lúc request chạy.
- GET `/api/buyer/cart` chỉ SELECT, không UPDLOCK/HOLDLOCK và không tạo Cart.
  Chưa có giỏ trả `{id:null,items:[],total:0,totalQuantity:0}`.
- Các thao tác ghi giữ transaction, khóa cùng Buyer, kiểm tra ownership qua JWT +
  hồ sơ Buyer DB. Thêm giỏ lazy khi cần ghi, lỗi phải rollback việc tạo giỏ.
- `Total_product = SUM(Quantity)` khớp seed; `totalQuantity` cùng ý nghĩa. Giới hạn
  tổng theo INT của schema được kiểm tra trước cập nhật. Giỏ không giữ/trừ kho.
- CartPage tăng/giảm/xóa giữ nguyên. Cart response chuyển sang record DTO, giữ tên
  trường. Concurrent DB errors trả 409; không tự retry thao tác cộng thêm.

### Register, hồ sơ và mật khẩu

- PasswordField dùng SVG con mắt, button type=button, aria-label/aria-pressed;
  dùng cho Login/Register và cả ba ô đổi mật khẩu. Register UI yêu cầu confirmation.
- Backend kiểm tra confirmation nếu client gửi; client API cũ chưa gửi vẫn được
  hỗ trợ để giữ hợp đồng hiện có. BCrypt/new password tối đa 72 byte UTF-8.
- `/profile` trong BuyerLayout đã thực thi, có loading/save/error/success.
- GET/PUT `/api/buyer/profile`: response/input gồm firstName,lastName,address,
  gender,avatar. PUT là cập nhật đầy đủ các trường cho phép, không phải PATCH tùy ý.
- Họ/tên tối đa 50; địa chỉ 255; gender theo CHECK constraint; avatar tối đa 500,
  chỉ URL HTTP/HTTPS có host và không có user-info. Trường optional rỗng thành NULL.
- Identity lấy từ JWT, đối chiếu Buyer/ACTIVE trong DB. Email/phone/CCCD/role/ID/status
  và hash không nằm trong UPDATE whitelist; profile không trả các trường nhạy cảm.
- POST `/api/buyer/profile/password`: currentPassword,newPassword,confirmPassword;
  xác minh BCrypt cũ, khóa hàng trong transaction, hash BCrypt cost 12 mới, trả 204.
- Mật khẩu cũ sai/confirmation lệch trả 400, không làm client mất phiên chỉ vì nhập
  sai mật khẩu cũ. Đổi mật khẩu KHÔNG revoke JWT cũ; UI và tài liệu nói rõ điều đó.

## Seed và benchmark

Trước khi sửa đã tạo backup nguyên byte và ghi SHA-256:

```text
Original trước sửa = backup:
401c0854efd4597576ebc574440025715b0349836b4e10c34e2bd4587229c9b6
```

`03_seed_large.backup.sha256` ghi lại digest. `.gitattributes` đánh dấu backup -text
để Git không đổi line endings. KHÔNG chạy trực tiếp backup: nó vẫn có USE BKPEE_DB.
Helper tạo baseline chỉ thay tên DB trong bộ nhớ, giữ nguyên file backup.

Seed mới chỉ chấp nhận DB có prefix BKPEE_TEST_, một batch, XACT_ABORT + TRY/CATCH
và transaction; timestamp cố định. Mapping tạm dùng cùng Family/Category/tên/
manufacturer để sinh Product và subtype, không lấy IDENTITY modulo để phân loại.
Books ở 11–13, Clothes ở 14–16, Electronics ở 17–19; material/publisher/warranty
được gắn theo nhóm hợp lý. Không bổ sung cột size/màu vì schema chưa có.

Giữ 30 Category, 3.000 Product, 9.000 Variant, 1.000 mỗi subtype, 10.000 Order,
15.000 Shop_Order, 35.000 Shop_Order_Item, 3.000 Cart_Item và quy mô các bảng khác.
Assertion trong seed kiểm tra counts, mapping/category và SUM giỏ trước COMMIT.
Phân bố Category/giá/từ khóa đã thay đổi để dữ liệu đúng nghĩa; không so sánh số đo
Indexing cũ/mới như thể cùng dataset. Đo trước/sau index trên cùng dataset và giữ
database baseline gốc riêng. Chưa tạo index hay tuyên bố tối ưu hiệu năng.

## Chạy lại

Chạy website bình thường (không nạp lại seed): `mvn spring-boot:run` từ backend,
`npm run dev` từ frontend; giữ 8080/5173 và cấu hình SQL hiện tại.

Tạo database test MỚI rồi chạy build/test ghi dữ liệu chỉ trên DB đó:

```powershell
cd E:\dbms\backend
python scripts/prepare_upgrade_test_db.py BKPEE_TEST_demo_unique
python -u scripts/run_upgrade_checks.py BKPEE_TEST_demo_unique
```

Tên đã tồn tại sẽ bị từ chối ở bước prepare, không tự xóa DB người khác. Có thể
chạy runner lại trên DB test đã chuẩn bị; nó chỉ thêm dữ liệu QA trong DB đó.
`--skip-build --upgrade-only` chỉ dùng khi đang lặp test với JAR đã build đúng code.
Tạo bản benchmark gốc riêng bằng suffix mới và `--original-benchmark`.
SQLCMD chạy file UTF-8 BOM để tránh lỗi code page của stdin trên Windows.

```powershell
cd E:\dbms\frontend
node --test src/services/api.test.js src/config/catalog.test.js
npm run build
```

## Tất cả file chỉnh sửa

- `IMPLEMENTATION_F01_F08_F09_F10.md`
- `backend/.env.example`
- `backend/scripts/smoke_buyer.py`
- `backend/src/main/java/com/bkpee/auth/ApiErrors.java`
- `backend/src/main/java/com/bkpee/auth/AuthApi.java`
- `backend/src/main/java/com/bkpee/buyer/BuyerCartService.java`
- `backend/src/main/java/com/bkpee/buyer/CartApi.java`
- `backend/src/main/java/com/bkpee/buyer/CatalogApi.java`
- `backend/src/main/resources/application.yml`
- `backend/src/test/java/com/bkpee/integration/BuyerSqlIntegrationTest.java`
- `database/03_seed_large.sql`
- `frontend/.env.example`
- `frontend/README.md`
- `frontend/src/App.css`
- `frontend/src/App.jsx`
- `frontend/src/auth/AuthContext.jsx`
- `frontend/src/pages/AuthPage.jsx`
- `frontend/src/pages/ProductsPage.jsx`

## Tất cả file tạo mới

- `.gitattributes`
- `UPGRADE_F01_F08_F09_F10.md`
- `backend/scripts/prepare_upgrade_test_db.py`
- `backend/scripts/run_upgrade_checks.py`
- `backend/scripts/test_buyer_upgrade.py`
- `backend/src/main/java/com/bkpee/auth/BuyerProfileApi.java`
- `backend/src/main/java/com/bkpee/auth/BuyerProfileService.java`
- `backend/src/main/java/com/bkpee/buyer/CartModels.java`
- `backend/src/main/java/com/bkpee/buyer/CatalogJdbcRepository.java`
- `backend/src/main/java/com/bkpee/buyer/CatalogModels.java`
- `backend/src/main/java/com/bkpee/buyer/CatalogSettings.java`
- `backend/src/test/java/com/bkpee/buyer/CatalogQueryTest.java`
- `database/03_seed_large.backup.sql`
- `database/03_seed_large.backup.sha256`
- `frontend/src/components/Icons.jsx`
- `frontend/src/components/PasswordField.jsx`
- `frontend/src/components/ProductPurchaseModal.jsx`
- `frontend/src/config/catalog.js`
- `frontend/src/config/catalog.test.js`
- `frontend/src/pages/ProfilePage.jsx`

Không sửa CartPage, SellerLayout, pages/Seller, Security/JWT, package/pom,
01_schema.sql, dữ liệu/schema/index của BKPEE_DB hoặc MongoDB.
