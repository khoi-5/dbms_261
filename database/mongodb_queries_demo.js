// ==============================================================================
// BTL HỆ QUẢN TRỊ CSDL (DBMS) - HỆ THỐNG TMĐT BKPEE
// File: mongodb_queries_demo.js
// Mục đích: Các kịch bản truy vấn mẫu NoSQL (Aggregation Pipeline, Text Search, Explain)
// Chạy trong: MongoDB Compass (tab Mongosh) hoặc mongosh CLI
// ==============================================================================

const dbName = "bkpee_db";
const currentDb = db.getSiblingDB(dbName);

print(`[*] Đang truy vấn trên CSDL: ${dbName}...\n`);

// ==============================================================================
// QUERY 1: Thống kê doanh thu và số đơn thành công của từng Gian Hàng
// Mục đích lý thuyết: So sánh với câu lệnh SQL Server cần JOIN qua 4 bảng
// (Seller JOIN Shop_Order JOIN Shop_Order_Item JOIN Product_Variant)
// ==============================================================================
print(">>> [DEMO 1] Báo cáo doanh thu theo Gian Hàng (Aggregation Pipeline):");
const revenueReport = currentDb.orders.aggregate([
  // 1. Tách mảng đơn con shop_orders
  { $unwind: "$shop_orders" },
  // 2. Lọc đơn đã giao thành công
  { $match: { "shop_orders.delivery_status": "DELIVERED" } },
  // 3. Tách mảng món hàng items bên trong
  { $unwind: "$shop_orders.items" },
  // 4. Nhóm theo seller_id và cộng dồn doanh thu
  {
    $group: {
      _id: "$shop_orders.seller_id",
      shop_name: { $first: "$shop_orders.shop_name" },
      total_delivered_orders: { $addToSet: "$shop_orders.shop_order_id" },
      total_revenue: { $sum: "$shop_orders.items.line_total" }
    }
  },
  // 5. Định dạng lại trường hiển thị
  {
    $project: {
      seller_id: "$_id",
      shop_name: 1,
      total_delivered_orders: { $size: "$total_delivered_orders" },
      total_revenue: 1,
      _id: 0
    }
  },
  // 6. Sắp xếp theo doanh thu giảm dần
  { $sort: { total_revenue: -1 } },
  { $limit: 10 }
]).toArray();

printjson(revenueReport);
print("\n" + "=".repeat(70) + "\n");

// ==============================================================================
// QUERY 2: Tìm kiếm toàn văn bản (Full-Text Search) trên sản phẩm
// Mục đích lý thuyết: Tận dụng Text Index trên MongoDB thay vì LIKE '%...%' chậm chạp
// ==============================================================================
print(">>> [DEMO 2] Tìm kiếm toàn văn bản (Full-Text Search: 'chống ồn hoặc CSDL'):");
const textSearchResults = currentDb.products.find(
  { $text: { $search: "chống ồn CSDL" } },
  { score: { $meta: "textScore" }, product_name: 1, manufacturer: 1, min_price: 1, _id: 0 }
).sort({ score: { $meta: "textScore" } }).limit(5).toArray();

printjson(textSearchResults);
print("\n" + "=".repeat(70) + "\n");

// ==============================================================================
// QUERY 3: Đọc trọn vẹn chi tiết đơn hàng (Zero JOINs)
// Mục đích lý thuyết: Tính chất 'Locality of Reference' trong Document Model
// ==============================================================================
print(">>> [DEMO 3] Đọc chi tiết đơn hàng #1 (Chỉ tốn 1 lần I/O disk duy nhất):");
const orderDetail = currentDb.orders.findOne(
  { _id: 1 },
  { buyer_name: 1, total_price: 1, "shop_orders.shop_name": 1, "shop_orders.items": 1, "payment.payment_status": 1 }
);

printjson(orderDetail);
print("\n" + "=".repeat(70) + "\n");

// ==============================================================================
// QUERY 4: Phân tích Execution Plan (Tối ưu hóa chỉ mục Compound Index)
// Mục đích lý thuyết: Minh chứng Index Scan (IXSCAN) thay vì Collection Scan (COLLSCAN)
// ==============================================================================
print(">>> [DEMO 4] Phân tích Execution Plan khi lọc sản phẩm theo Category & Giá:");
const explainStats = currentDb.products.explain("executionStats").find({
  category_id: 4,
  min_price: { $gte: 100000, $lte: 200000 }
});

print(`- Chiến lược quét (Winning Plan Stage): ${explainStats.queryPlanner.winningPlan.stage}`);
print(`- Tổng số document quét (totalDocsExamined): ${explainStats.executionStats.totalDocsExamined}`);
print(`- Tổng số kết quả trả về (nReturned): ${explainStats.executionStats.nReturned}`);
print(`- Thời gian thực thi (executionTimeMillis): ${explainStats.executionStats.executionTimeMillis} ms`);
