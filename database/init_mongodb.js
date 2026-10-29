// ==============================================================================
// BTL HỆ QUẢN TRỊ CSDL (DBMS) - HỆ THỐNG TMĐT BKPEE
// File: init_mongodb.js
// Chạy trong: mongosh hoặc MongoDB Compass
// Lệnh chạy: mongosh "mongodb://localhost:27017/bkpee_db" init_mongodb.js
// ==============================================================================

const dbName = "bkpee_db";
const currentDb = db.getSiblingDB(dbName);

print(`[*] Đang chuyển sang database: ${dbName}...`);

// 1. Xóa các collection cũ nếu có
const collections = [
  "accounts",
  "categories",
  "shipping_providers",
  "products",
  "carts",
  "promotions",
  "orders",
  "evaluations",
  "reports"
];

collections.forEach(col => {
  currentDb.getCollection(col).drop();
});

print("[+] Đã làm sạch các collection cũ.");

// ==============================================================================
// 2. TẠO INDEXES TỐI ƯU TRUY VẤN
// ==============================================================================
print("[*] Đang tạo các chỉ mục (Indexes)...");

// 2.1 Accounts indexes
currentDb.accounts.createIndex({ username: 1 }, { unique: true });
currentDb.accounts.createIndex({ email: 1 }, { unique: true });
currentDb.accounts.createIndex({ phone: 1 }, { unique: true });
currentDb.accounts.createIndex({ roles: 1 });

// 2.2 Categories indexes
currentDb.categories.createIndex({ category_name: 1 }, { unique: true });
currentDb.categories.createIndex({ parent_category_id: 1 });

// 2.3 Shipping Providers indexes
currentDb.shipping_providers.createIndex({ provider_name: 1 }, { unique: true });

// 2.4 Products indexes (Hỗ trợ lọc danh mục, giá, shop và Text Search)
currentDb.products.createIndex({ seller_id: 1 });
currentDb.products.createIndex({ category_id: 1, min_price: 1 });
currentDb.products.createIndex({ product_name: "text", description: "text" });
currentDb.products.createIndex({ "variants.variant_id": 1 });

// 2.5 Orders indexes (Lọc theo buyer, shop trong mảng nhúng, và ngày đặt)
currentDb.orders.createIndex({ buyer_id: 1, order_time: -1 });
currentDb.orders.createIndex({ "shop_orders.seller_id": 1, order_time: -1 });
currentDb.orders.createIndex({ "payment.transaction_code": 1 }, { unique: true });

// 2.6 Promotions indexes
currentDb.promotions.createIndex({ seller_id: 1, expiration_date: 1 });
currentDb.promotions.createIndex({ applicable_variant_ids: 1 });

// 2.7 Evaluations indexes
currentDb.evaluations.createIndex({ product_id: 1, rating: -1 });
currentDb.evaluations.createIndex({ variant_id: 1 });

// 2.8 Reports indexes
currentDb.reports.createIndex({ reporter_id: 1 });
currentDb.reports.createIndex({ reported_account_id: 1 });

print("[+] Đã tạo chỉ mục thành công.");

// ==============================================================================
// 3. NẠP DỮ LIỆU MẪU (SEED DATA MONGODB)
// ==============================================================================
print("[*] Đang nạp dữ liệu mẫu vào MongoDB...");

// 3.1 Accounts
currentDb.accounts.insertMany([
  {
    _id: 1,
    username: "admin_root",
    password_hash: "$2a$10$hashed_admin_pwd",
    fname: "Văn",
    lname: "Quản Trị",
    phone: "0901000001",
    email: "admin@bkpee.vn",
    gender: "Nam",
    avatar: "https://bkpee.vn/img/admin.png",
    address: "Quận 10, TP.HCM",
    cccd: "079090000001",
    date_of_birth: new Date("1995-05-15"),
    account_status: "ACTIVE",
    roles: ["ADMIN"],
    admin_profile: { admin_role: "SUPER_ADMIN" }
  },
  {
    _id: 2,
    username: "seller_fahasa",
    password_hash: "$2a$10$hashed_seller_pwd1",
    fname: "Thị",
    lname: "Nhà Sách",
    phone: "0902000002",
    email: "fahasa@bkpee.vn",
    gender: "Nữ",
    avatar: "https://bkpee.vn/img/fahasa.png",
    address: "Quận 1, TP.HCM",
    cccd: "079090000002",
    date_of_birth: new Date("1990-10-20"),
    account_status: "ACTIVE",
    roles: ["SELLER"],
    user_profile: { trust_score: 100 },
    seller_profile: {
      shop_name: "Fahasa Official Store",
      bank_account_number: "190345678901"
    }
  },
  {
    _id: 3,
    username: "seller_coolmate",
    password_hash: "$2a$10$hashed_seller_pwd2",
    fname: "Đức",
    lname: "Thời Trang",
    phone: "0903000003",
    email: "coolmate@bkpee.vn",
    gender: "Nam",
    avatar: "https://bkpee.vn/img/coolmate.png",
    address: "Hà Đông, Hà Nội",
    cccd: "079090000003",
    date_of_birth: new Date("1992-03-12"),
    account_status: "ACTIVE",
    roles: ["SELLER"],
    user_profile: { trust_score: 98 },
    seller_profile: {
      shop_name: "Coolmate Activewear",
      bank_account_number: "190345678902"
    }
  },
  {
    _id: 4,
    username: "seller_cellphones",
    password_hash: "$2a$10$hashed_seller_pwd3",
    fname: "Thành",
    lname: "Điện Máy",
    phone: "0904000004",
    email: "cellphones@bkpee.vn",
    gender: "Nam",
    avatar: "https://bkpee.vn/img/cellphones.png",
    address: "Bình Thạnh, TP.HCM",
    cccd: "079090000004",
    date_of_birth: new Date("1988-08-08"),
    account_status: "ACTIVE",
    roles: ["SELLER"],
    user_profile: { trust_score: 95 },
    seller_profile: {
      shop_name: "CellphoneS Flagship",
      bank_account_number: "190345678903"
    }
  },
  {
    _id: 5,
    username: "buyer_hienle",
    password_hash: "$2a$10$hashed_buyer_pwd1",
    fname: "Thúy",
    lname: "Lê Hiền",
    phone: "0905000005",
    email: "thuyhien@bkpee.vn",
    gender: "Nữ",
    avatar: "https://bkpee.vn/img/buyer1.png",
    address: "Thủ Đức, TP.HCM",
    cccd: "079090000005",
    date_of_birth: new Date("2003-07-25"),
    account_status: "ACTIVE",
    roles: ["BUYER"],
    user_profile: { trust_score: 100 },
    buyer_profile: {
      addresses: [
        {
          receiver_name: "Lê Hiền Thúy",
          phone: "0905000005",
          address: "KTX Khu A ĐHQG TP.HCM, Dĩ An, Bình Dương",
          is_default: true
        },
        {
          receiver_name: "Lê Hiền Thúy",
          phone: "0905000005",
          address: "Nhà riêng: 123 Võ Văn Ngân, Thủ Đức, TP.HCM",
          is_default: false
        }
      ]
    }
  },
  {
    _id: 6,
    username: "buyer_khoinguyen",
    password_hash: "$2a$10$hashed_buyer_pwd2",
    fname: "Khôi",
    lname: "Nguyễn",
    phone: "0906000006",
    email: "khoinguyen@bkpee.vn",
    gender: "Nam",
    avatar: "https://bkpee.vn/img/buyer2.png",
    address: "Quận 7, TP.HCM",
    cccd: "079090000006",
    date_of_birth: new Date("2002-11-14"),
    account_status: "ACTIVE",
    roles: ["BUYER"],
    user_profile: { trust_score: 100 },
    buyer_profile: {
      addresses: [
        {
          receiver_name: "Nguyễn Khôi",
          phone: "0906000006",
          address: "456 Nguyễn Lương Bằng, Quận 7, TP.HCM",
          is_default: true
        }
      ]
    }
  }
]);

// 3.2 Categories
currentDb.categories.insertMany([
  { _id: 1, category_name: "Sách & Văn Phòng Phẩm", parent_category_id: null, admin_id: 1 },
  { _id: 2, category_name: "Thời Trang & May Mặc", parent_category_id: null, admin_id: 1 },
  { _id: 3, category_name: "Thiết Bị Điện Tử", parent_category_id: null, admin_id: 1 },
  { _id: 4, category_name: "Sách Công Nghệ & Kỹ Thuật", parent_category_id: 1, admin_id: 1 },
  { _id: 5, category_name: "Áo Thun Nam Nữ", parent_category_id: 2, admin_id: 1 },
  { _id: 6, category_name: "Tai Nghe & Phụ Kiện", parent_category_id: 3, admin_id: 1 }
]);

// 3.3 Shipping Providers
currentDb.shipping_providers.insertMany([
  { _id: 1, provider_name: "Giao Hàng Tiết Kiệm (GHTK)", phone: "19006092", address: "Tòa nhà VTV, Cầu Giấy, Hà Nội", admin_id: 1, base_shipping_fee: 22000 },
  { _id: 2, provider_name: "Giao Hàng Nhanh (GHN)", phone: "1900636677", address: "Tân Bình, TP.HCM", admin_id: 1, base_shipping_fee: 25000 },
  { _id: 3, provider_name: "Viettel Post", phone: "19008095", address: "Ba Đình, Hà Nội", admin_id: 1, base_shipping_fee: 20000 }
]);

// 3.4 Products
currentDb.products.insertMany([
  {
    _id: 1,
    seller_id: 2,
    category_id: 4,
    product_name: "Giáo trình Cơ Sở Dữ Liệu (Database Systems)",
    description: "Sách tham khảo chuẩn quốc tế biên soạn bởi ĐHQG-HCM.",
    manufacturer: "NXB Đại học Quốc gia",
    product_type: "BOOK",
    attributes: {
      publisher: "Nhà Xuất Bản ĐHQG TP.HCM",
      authors: ["PGS.TS. Trần Minh", "ThS. Nguyễn Thị Lan"]
    },
    variants: [
      { variant_id: 1, variant_name: "Bìa Mềm", price: 120000, quantity_stock: 150, is_active: true, image: "https://bkpee.vn/img/books/csdl-tap1.png" },
      { variant_id: 2, variant_name: "Bìa Cứng", price: 180000, quantity_stock: 50, is_active: true, image: "https://bkpee.vn/img/books/csdl-biacung.png" }
    ],
    min_price: 120000,
    max_price: 180000,
    total_stock: 200
  },
  {
    _id: 2,
    seller_id: 3,
    category_id: 5,
    product_name: "Áo Thun Thể Thao Nam QuickDry Chạy Bộ",
    description: "Chất liệu Polyester tái chế siêu nhẹ, thoáng khí và khử mùi tối ưu.",
    manufacturer: "Coolmate Vietnam",
    product_type: "CLOTHES",
    attributes: {
      material: "92% Polyester, 8% Spandex"
    },
    variants: [
      { variant_id: 3, variant_name: "Màu Đen, Size L", price: 199000, quantity_stock: 80, is_active: true, image: "https://bkpee.vn/img/clothes/aothun-den-l.png" },
      { variant_id: 4, variant_name: "Màu Trắng, Size M", price: 199000, quantity_stock: 40, is_active: true, image: "https://bkpee.vn/img/clothes/aothun-trang-m.png" }
    ],
    min_price: 199000,
    max_price: 199000,
    total_stock: 120
  },
  {
    _id: 3,
    seller_id: 4,
    category_id: 6,
    product_name: "Tai Nghe Chống Ồn Sony WH-1000XM5",
    description: "Tai nghe Bluetooth cao cấp với công nghệ chống ồn chủ động hàng đầu thế giới.",
    manufacturer: "Sony Corporation",
    product_type: "ELECTRONICS",
    attributes: {
      warranty_id: "BH-SONY-VN-2026",
      warranty_time: "12 tháng chính hãng"
    },
    variants: [
      { variant_id: 5, variant_name: "Màu Bạc", price: 7990000, quantity_stock: 25, is_active: true, image: "https://bkpee.vn/img/electronics/sony-bac.png" }
    ],
    min_price: 7990000,
    max_price: 7990000,
    total_stock: 25
  }
]);

// 3.5 Carts
currentDb.carts.insertMany([
  {
    _id: 1,
    buyer_id: 5,
    total_product: 3,
    items: [
      { variant_id: 1, product_id: 1, quantity: 1, added_at: new Date() },
      { variant_id: 3, product_id: 2, quantity: 2, added_at: new Date() }
    ]
  },
  {
    _id: 2,
    buyer_id: 6,
    total_product: 0,
    items: []
  }
]);

// 3.6 Promotions
currentDb.promotions.insertMany([
  {
    _id: 1,
    seller_id: 2,
    type: "COUPON",
    quantity: 100,
    start_date: new Date("2026-10-01"),
    expiration_date: new Date("2026-12-31"),
    min_bill: 200000,
    discount_config: { percent_discount: 15.0, max_discount: 50000 },
    applicable_variant_ids: [1, 2]
  },
  {
    _id: 2,
    seller_id: 3,
    type: "VOUCHER",
    quantity: 50,
    start_date: new Date("2026-10-15"),
    expiration_date: new Date("2026-11-30"),
    min_bill: 300000,
    discount_config: { voucher_value: 30000 },
    applicable_variant_ids: [3]
  }
]);

// 3.7 Orders (Gom toàn bộ Order, Shop_Order, Shop_Order_Item, Payment)
currentDb.orders.insertOne({
  _id: 1,
  buyer_id: 5,
  buyer_name: "Lê Hiền Thúy",
  delivery_address: "KTX Khu A ĐHQG TP.HCM, Dĩ An, Bình Dương",
  order_time: new Date("2026-10-29T14:30:00Z"),
  total_price: 540000,
  shop_orders: [
    {
      shop_order_id: 1,
      seller_id: 2,
      shop_name: "Fahasa Official Store",
      shipping_provider: { provider_id: 1, provider_name: "Giao Hàng Tiết Kiệm (GHTK)" },
      tracking_number: "GHTK-FAHASA-001",
      delivery_status: "DELIVERED",
      shipping_fee: 22000,
      shipped_at: new Date("2026-10-29T16:00:00Z"),
      delivered_at: new Date("2026-10-30T09:30:00Z"),
      items: [
        { variant_id: 1, product_id: 1, product_name: "Giáo trình Cơ Sở Dữ Liệu (Bìa Mềm)", quantity: 1, purchase_price: 120000, line_total: 120000 }
      ]
    },
    {
      shop_order_id: 2,
      seller_id: 3,
      shop_name: "Coolmate Activewear",
      shipping_provider: { provider_id: 2, provider_name: "Giao Hàng Nhanh (GHN)" },
      tracking_number: "GHN-COOLMATE-002",
      delivery_status: "SHIPPING",
      shipping_fee: 25000,
      shipped_at: new Date("2026-10-29T17:00:00Z"),
      delivered_at: null,
      items: [
        { variant_id: 3, product_id: 2, product_name: "Áo Thun Thể Thao Nam (Đen, L)", quantity: 2, purchase_price: 199000, line_total: 398000 }
      ]
    }
  ],
  payment: {
    transaction_code: "TXN-BKPEE-20261029-001",
    payment_method: "VNPAY",
    payment_status: "COMPLETED",
    payment_time: new Date("2026-10-29T14:35:00Z")
  }
});

// 3.8 Evaluations
currentDb.evaluations.insertOne({
  _id: 1,
  buyer_id: 5,
  variant_id: 1,
  product_id: 1,
  rating: 5,
  content: "Sách in rất đẹp, bìa dày dặn, kiến thức chuẩn giáo trình DBMS của trường!",
  images: [
    "https://bkpee.vn/img/review/sach-thuc-te-1.jpg",
    "https://bkpee.vn/img/review/sach-thuc-te-2.jpg"
  ],
  created_at: new Date("2026-10-30T10:00:00Z")
});

// 3.9 Reports
currentDb.reports.insertOne({
  _id: 1,
  reporter_id: 5,
  reported_account_id: 4,
  admin_id: 1,
  reason: "Tư vấn sai thông tin sản phẩm",
  description: "Shop hẹn bảo hành 24 tháng nhưng tem chỉ ghi 12 tháng.",
  status: "RESOLVED",
  evidence_images: [
    "https://bkpee.vn/img/report/anh-chup-tem-bao-hanh.jpg"
  ],
  created_at: new Date("2026-10-28T08:00:00Z"),
  resolved_at: new Date("2026-10-28T17:00:00Z")
});

print("==============================================================");
print("[+] HOÀN TẤT NẠP DỮ LIỆU MONGODB CHO BKPEE_DB THÀNH CÔNG!");
print("==============================================================");
