// ==============================================================================
// BTL HỆ QUẢN TRỊ CSDL (DBMS) - M5: QUERY PROCESSING BENCHMARK (MONGODB)
// File: mongodb_query_processing.js
// Mục đích: So sánh Aggregation Pipeline, tối ưu hóa $match pushdown và $lookup
//           tương đương ngữ nghĩa với sqlserver_query_processing.sql (F06, F07, F13)
// Cách chạy: mongosh "mongodb://localhost:27017/bkpee_db" mongodb_query_processing.js
// ==============================================================================

const dbName = "bkpee_db";
const currentDb = db.getSiblingDB(dbName);
const RUNS = 5;

function benchmark(label, fn) {
  let lastResult = null;
  const times = [];
  for (let i = 0; i < RUNS; i++) {
    const t0 = Date.now();
    lastResult = fn();
    times.push(Date.now() - t0);
  }
  const avg = (times.reduce((a, b) => a + b, 0) / times.length).toFixed(2);
  print(`\n>>> ${label}`);
  print(`    Runs (${RUNS}x): [${times.join(", ")}] ms | Avg: ${avg} ms | Rows: ${lastResult.length}`);
  printjson(lastResult.slice(0, 5));
}

function summarizeExplain(label, explainDoc) {
  print(`\n--- EXPLAIN: ${label} ---`);
  if (explainDoc.stages) {
    const first = explainDoc.stages[0];
    const cursor = first.$cursor;
    if (cursor && cursor.executionStats) {
      print(`    Winning Stage     : ${cursor.queryPlanner.winningPlan.stage}`);
      print(`    Docs Examined     : ${cursor.executionStats.totalDocsExamined}`);
      print(`    Keys Examined     : ${cursor.executionStats.totalKeysExamined}`);
      print(`    Execution Time    : ${cursor.executionStats.executionTimeMillis} ms`);
    } else {
      print(`    Pipeline Stages   : ${explainDoc.stages.map(s => Object.keys(s)[0]).join(" -> ")}`);
    }
  } else if (explainDoc.executionStats) {
    print(`    Winning Stage     : ${explainDoc.queryPlanner.winningPlan.stage}`);
    print(`    Docs Examined     : ${explainDoc.executionStats.totalDocsExamined}`);
    print(`    Keys Examined     : ${explainDoc.executionStats.totalKeysExamined}`);
    print(`    nReturned         : ${explainDoc.executionStats.nReturned}`);
    print(`    Execution Time    : ${explainDoc.executionStats.executionTimeMillis} ms`);
  }
}

print("======================================================================");
print("M5 QUERY PROCESSING BENCHMARK — MONGODB (bkpee_db)");
print("======================================================================");

// ------------------------------------------------------------------------------
// Q1 (F07): Doanh thu theo tháng của Seller #2 (DELIVERED, năm 2026)
// So sánh TỐI ƯU HÓA: Unoptimized ($unwind trước) vs Optimized ($match trước)
// ------------------------------------------------------------------------------
const q1Unoptimized = [
  { $unwind: "$shop_orders" },
  { $unwind: "$shop_orders.items" },
  {
    $match: {
      "shop_orders.seller_id": 2,
      "shop_orders.delivery_status": "DELIVERED",
      order_time: { $gte: new Date("2026-01-01T00:00:00Z"), $lt: new Date("2027-01-01T00:00:00Z") }
    }
  },
  {
    $group: {
      _id: { year: { $year: "$order_time" }, month: { $month: "$order_time" } },
      orders: { $addToSet: "$shop_orders.shop_order_id" },
      total_items_sold: { $sum: "$shop_orders.items.quantity" },
      monthly_revenue: { $sum: "$shop_orders.items.line_total" }
    }
  },
  {
    $project: {
      _id: 0,
      year: "$_id.year",
      month: "$_id.month",
      total_orders: { $size: "$orders" },
      total_items_sold: 1,
      monthly_revenue: 1
    }
  },
  { $sort: { year: 1, month: 1 } }
];

const q1Optimized = [
  // Đẩy $match lên đầu để tận dụng compound index { "shop_orders.seller_id": 1, order_time: -1 }
  {
    $match: {
      "shop_orders.seller_id": 2,
      order_time: { $gte: new Date("2026-01-01T00:00:00Z"), $lt: new Date("2027-01-01T00:00:00Z") }
    }
  },
  { $unwind: "$shop_orders" },
  {
    $match: {
      "shop_orders.seller_id": 2,
      "shop_orders.delivery_status": "DELIVERED"
    }
  },
  { $unwind: "$shop_orders.items" },
  {
    $group: {
      _id: { year: { $year: "$order_time" }, month: { $month: "$order_time" } },
      orders: { $addToSet: "$shop_orders.shop_order_id" },
      total_items_sold: { $sum: "$shop_orders.items.quantity" },
      monthly_revenue: { $sum: "$shop_orders.items.line_total" }
    }
  },
  {
    $project: {
      _id: 0,
      year: "$_id.year",
      month: "$_id.month",
      total_orders: { $size: "$orders" },
      total_items_sold: 1,
      monthly_revenue: 1
    }
  },
  { $sort: { year: 1, month: 1 } }
];

benchmark("Q1a (Unoptimized - $unwind before $match)", () => currentDb.orders.aggregate(q1Unoptimized).toArray());
summarizeExplain("Q1a Unoptimized", currentDb.orders.explain("executionStats").aggregate(q1Unoptimized));

benchmark("Q1b (Optimized - $match pushdown before $unwind)", () => currentDb.orders.aggregate(q1Optimized).toArray());
summarizeExplain("Q1b Optimized", currentDb.orders.explain("executionStats").aggregate(q1Optimized));

// ------------------------------------------------------------------------------
// Q2 (F13): Chi tiêu của Buyer #5 gom theo Category ($match + $unwind + $lookup)
// Minh chứng chi phí $lookup khi dữ liệu danh mục không được nhúng trong order items
// ------------------------------------------------------------------------------
const q2BuyerSpending = [
  { $match: { buyer_id: 5 } },
  { $unwind: "$shop_orders" },
  { $match: { "shop_orders.delivery_status": { $nin: ["CANCELLED", "RETURNED"] } } },
  { $unwind: "$shop_orders.items" },
  {
    $lookup: {
      from: "products",
      localField: "shop_orders.items.product_id",
      foreignField: "_id",
      as: "product_doc"
    }
  },
  { $unwind: "$product_doc" },
  {
    $lookup: {
      from: "categories",
      localField: "product_doc.category_id",
      foreignField: "_id",
      as: "category_doc"
    }
  },
  { $unwind: "$category_doc" },
  {
    $group: {
      _id: {
        category_id: "$category_doc._id",
        category_name: "$category_doc.category_name",
        target_type: "$category_doc.target_type"
      },
      order_ids: { $addToSet: "$_id" },
      items_purchased: { $sum: "$shop_orders.items.quantity" },
      total_spent: { $sum: "$shop_orders.items.line_total" }
    }
  },
  {
    $project: {
      _id: 0,
      category_id: "$_id.category_id",
      category_name: "$_id.category_name",
      target_type: "$_id.target_type",
      order_count: { $size: "$order_ids" },
      items_purchased: 1,
      total_spent: 1
    }
  },
  { $sort: { total_spent: -1 } }
];

benchmark("Q2 (F13 - Buyer #5 Spending by Category via $lookup)", () => currentDb.orders.aggregate(q2BuyerSpending).toArray());
summarizeExplain("Q2 Buyer Spending", currentDb.orders.explain("executionStats").aggregate(q2BuyerSpending));

// ------------------------------------------------------------------------------
// Q3 (F06): Tìm các biến thể đang đủ điều kiện khuyến mãi (tương đương SQL EXISTS)
// ------------------------------------------------------------------------------
const now = new Date();
const q3EligibleProducts = [
  {
    $match: {
      quantity: { $gt: 0 },
      start_date: { $lte: now },
      expiration_date: { $gte: now }
    }
  },
  { $unwind: "$applicable_variant_ids" },
  { $group: { _id: "$applicable_variant_ids", active_promo_count: { $sum: 1 } } },
  {
    $lookup: {
      from: "products",
      localField: "_id",
      foreignField: "variants.variant_id",
      as: "product"
    }
  },
  { $unwind: "$product" },
  { $unwind: "$product.variants" },
  {
    $match: {
      $expr: { $eq: ["$product.variants.variant_id", "$_id"] },
      "product.variants.is_active": true,
      "product.variants.quantity_stock": { $gt: 0 }
    }
  },
  {
    $project: {
      _id: 0,
      variant_id: "$_id",
      product_name: "$product.product_name",
      variant_name: "$product.variants.variant_name",
      price: "$product.variants.price",
      active_promo_count: 1
    }
  },
  { $sort: { variant_id: 1 } }
];

benchmark("Q3 (F06 - Active Promoted Variants via Pipeline + $lookup)", () => currentDb.promotions.aggregate(q3EligibleProducts).toArray());
summarizeExplain("Q3 Promoted Variants", currentDb.promotions.explain("executionStats").aggregate(q3EligibleProducts));

print("\n======================================================================");
print("[+] HOÀN TẤT BENCHMARK QUERY PROCESSING TRÊN MONGODB!");
print("======================================================================");
