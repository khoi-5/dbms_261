// BKPEE V2 - MongoDB schema: 9 collections, 21 indexes.
// Chay bang mongosh ket noi toi bkpee_db. Khong xoa du lieu cu.
(() => {
  if (db.getName() !== "bkpee_db") throw new Error("Hay ket noi dung database bkpee_db.");
  const currentDb = db; // Never switch database context.
const collections = ["accounts", "categories", "shipping_providers", "products", "carts", "promotions", "orders", "evaluations", "reports"];
const infos = currentDb.getCollectionInfos();
if (infos.some(c => !c.name.startsWith("system.") && !collections.includes(c.name)))
  throw new Error("Unexpected collection; inspect this database before proceeding.");
if (infos.some(c => collections.includes(c.name) &&
    (c.type !== "collection" || c.options?.capped || c.options?.timeseries)))
  throw new Error("Incompatible view/capped/time-series collection; refusing replacement.");

for (const name of collections) {
  if (!infos.some(c => c.name === name)) currentDb.createCollection(name);
}
// Exact original definitions from ../init_mongodb.js. Never drop conflicting indexes.
// Index 01 | Collection: accounts | Field(s): username
// Mục đích: Unique: tránh trùng tên đăng nhập.
currentDb.accounts.createIndex({ username: 1 }, { unique: true });
// Index 02 | Collection: accounts | Field(s): email
// Mục đích: Unique: tránh trùng email.
currentDb.accounts.createIndex({ email: 1 }, { unique: true });
// Index 03 | Collection: accounts | Field(s): phone
// Mục đích: Unique: tránh trùng số điện thoại.
currentDb.accounts.createIndex({ phone: 1 }, { unique: true });
// Index 04 | Collection: accounts | Field(s): roles
// Mục đích: Lọc tài khoản theo vai trò.
currentDb.accounts.createIndex({ roles: 1 });
// Index 05 | Collection: categories | Field(s): category_name
// Mục đích: Unique: tránh trùng tên danh mục.
currentDb.categories.createIndex({ category_name: 1 }, { unique: true });
// Index 06 | Collection: categories | Field(s): parent_category_id
// Mục đích: Tra cứu danh mục con theo danh mục cha.
currentDb.categories.createIndex({ parent_category_id: 1 });
// Index 07 | Collection: categories | Field(s): target_type
// Mục đích: Lọc danh mục theo loại sản phẩm.
currentDb.categories.createIndex({ target_type: 1 });
// Index 08 | Collection: shipping_providers | Field(s): provider_name
// Mục đích: Unique: tránh trùng tên đơn vị vận chuyển.
currentDb.shipping_providers.createIndex({ provider_name: 1 }, { unique: true });
// Index 09 | Collection: products | Field(s): seller_id
// Mục đích: Lọc sản phẩm theo người bán.
currentDb.products.createIndex({ seller_id: 1 });
// Index 10 | Collection: products | Field(s): category_id, min_price
// Mục đích: Compound index: lọc theo danh mục và giá tối thiểu.
currentDb.products.createIndex({ category_id: 1, min_price: 1 });
// Index 11 | Collection: products | Field(s): product_name, description
// Mục đích: Text index: tìm kiếm toàn văn tên và mô tả.
currentDb.products.createIndex({ product_name: "text", description: "text" });
// Index 12 | Collection: products | Field(s): variants.variant_id
// Mục đích: Tra cứu biến thể nhúng theo variant_id.
currentDb.products.createIndex({ "variants.variant_id": 1 });
// Index 13 | Collection: orders | Field(s): buyer_id, order_time DESC
// Mục đích: Lịch sử đơn theo người mua, mới nhất trước.
currentDb.orders.createIndex({ buyer_id: 1, order_time: -1 });
// Index 14 | Collection: orders | Field(s): shop_orders.seller_id, order_time DESC
// Mục đích: Lọc đơn có shop của seller và sắp xếp thời gian.
currentDb.orders.createIndex({ "shop_orders.seller_id": 1, order_time: -1 });
// Index 15 | Collection: orders | Field(s): payment.transaction_code
// Mục đích: Unique: tránh trùng mã giao dịch thanh toán.
currentDb.orders.createIndex({ "payment.transaction_code": 1 }, { unique: true });
// Index 16 | Collection: promotions | Field(s): seller_id, expiration_date
// Mục đích: Tra cứu khuyến mãi theo người bán và hạn dùng.
currentDb.promotions.createIndex({ seller_id: 1, expiration_date: 1 });
// Index 17 | Collection: promotions | Field(s): applicable_variant_ids
// Mục đích: Tra cứu khuyến mãi áp dụng cho một variant.
currentDb.promotions.createIndex({ applicable_variant_ids: 1 });
// Index 18 | Collection: evaluations | Field(s): product_id, rating DESC
// Mục đích: Tra cứu đánh giá sản phẩm theo số sao.
currentDb.evaluations.createIndex({ product_id: 1, rating: -1 });
// Index 19 | Collection: evaluations | Field(s): variant_id
// Mục đích: Tra cứu đánh giá theo biến thể.
currentDb.evaluations.createIndex({ variant_id: 1 });
// Index 20 | Collection: reports | Field(s): reporter_id
// Mục đích: Tra cứu khiếu nại theo người gửi.
currentDb.reports.createIndex({ reporter_id: 1 });
// Index 21 | Collection: reports | Field(s): reported_account_id
// Mục đích: Tra cứu khiếu nại theo tài khoản bị báo cáo.
currentDb.reports.createIndex({ reported_account_id: 1 });
print("MONGODB_V2_SCHEMA_READY: 9 collections, 21 secondary indexes requested.");
})();
