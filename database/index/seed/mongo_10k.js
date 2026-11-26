// INDEXING DATASET - 3000 products / 10000 variants; theo mo hinh Product/Variant V2.
// Chi ghi bkpee_index_db. Chay sau schema/02_mongodb_schema.js.
(() => {
  const PRODUCT_COUNT = 3000;
  const VARIANT_COUNT = 10000;
  const EXTRA_VARIANT_PRODUCTS = 1000;
  if (db.getName() !== "bkpee_index_db") throw new Error("Hay ket noi bkpee_index_db.");
  const names = ["accounts", "categories", "shipping_providers", "products", "carts", "promotions", "orders", "evaluations", "reports"];
  for (const name of names) {
    if (!db.getCollectionNames().includes(name)) throw new Error("Chay schema MongoDB Indexing truoc: " + name);
    if (db.getCollection(name).countDocuments({}) !== 0) throw new Error("Collection khong rong: " + name + ". Hay reset db Indexing truoc.");
  }
  if (db.products.getIndexes().length !== 1 || db.products.getIndexes()[0].name !== "_id_")
    throw new Error("products dang co index phu. Hay reset database Indexing truoc khi nap.");

  const date = new Date("2026-10-30T00:00:00.000Z");
  const pad = (v, width) => String(v).padStart(width, "0");
  const password_hash = "$2a$12$h1U/fVmlo3BtMYSWX7IseucGx96mQsrwnS1VcTBwm3hlIaAKxrtPe";
  const audit = by => ({ created_at: date, created_by: by, updated_at: date, updated_by: by });
  const categoryRows = [
    ["Sách & Văn Phòng Phẩm", null, "BOOK"], ["Thời Trang & May Mặc", null, "CLOTHES"],
    ["Thiết Bị Điện Tử", null, "ELECTRONICS"], ["Nhà Cửa & Đời Sống", null, "GENERAL"],
    ["Mẹ & Bé", null, "GENERAL"], ["Sức Khỏe & Sắc Đẹp", null, "GENERAL"],
    ["Thể Thao & Du Lịch", null, "GENERAL"], ["Ô Tô - Xe Máy", null, "GENERAL"],
    ["Bách Hóa Online", null, "GENERAL"], ["Đồ Chơi & Quà Tặng", null, "GENERAL"],
    ["Sách Công Nghệ & Kỹ Thuật", 1, "BOOK"], ["Sách Kinh Tế & Khởi Nghiệp", 1, "BOOK"],
    ["Truyện Tranh & Manga", 1, "BOOK"], ["Áo Thun Nam Nữ", 2, "CLOTHES"],
    ["Quần Jeans & Kaki", 2, "CLOTHES"], ["Giày Dép Thời Trang", 2, "CLOTHES"],
    ["Tai Nghe & Loa Bluetooth", 3, "ELECTRONICS"], ["Điện Thoại Thông Minh", 3, "ELECTRONICS"],
    ["Laptop & Máy Tính Bảng", 3, "ELECTRONICS"], ["Nội Thất Phòng Khách", 4, "GENERAL"],
    ["Đồ Gia Dụng Nhà Bếp", 4, "GENERAL"], ["Sữa & Thực Phẩm Cho Bé", 5, "GENERAL"],
    ["Tã Bỉm Trẻ Em", 5, "GENERAL"], ["Chăm Sóc Da Mặt", 6, "GENERAL"],
    ["Thực Phẩm Chức Năng", 6, "GENERAL"], ["Dụng Cụ Tập Gym", 7, "GENERAL"],
    ["Lều Trại & Phụ Kiện Phượt", 7, "GENERAL"], ["Mũ Bảo Hiểm Chính Hãng", 8, "GENERAL"],
    ["Đồ Ăn Vặt & Bánh Kẹo", 9, "GENERAL"], ["Mô Hình Lắp Ráp Anime", 10, "GENERAL"]
  ];
  const admin = { _id: 1, username: "admin_root", password_hash, fname: "Văn", lname: "Quản Trị",
    phone: "0901000000", email: "admin@bkpee.vn", gender: "Nam", account_status: "ACTIVE",
    roles: ["ADMIN"], admin_profile: { admin_role: "SUPER_ADMIN" }, ...audit(1) };
  function seller(n) {
    const id = n + 1;
    return { _id: id, username: "seller_" + pad(n, 4), password_hash,
      fname: ["Nguyễn", "Trần", "Lê", "Phạm", "Hoàng"][n % 5],
      lname: ["Anh Tuấn", "Thị Mai", "Minh Khôi", "Thúy Hiền"][n % 4],
      phone: "091" + pad(n, 7), email: "user_" + n + "@bkpee.vn", gender: n % 2 ? "Nữ" : "Nam",
      account_status: "ACTIVE", roles: ["SELLER", "BUYER"],
      seller_profile: { shop_name: "Gian Hàng Official Shop " + n,
        bank_name: "Vietcombank", bank_account_holder: "CHU TK GIAN HANG " + pad(id, 4),
        bank_account_number: "9704" + pad(id, 12), bank_branch: "TP. Ho Chi Minh" },
      user_profile: { trust_score: 80 + id % 21 }, ...audit(1) };
  }
  function category(id) {
    const [category_name, parent_category_id, target_type] = categoryRows[id - 1];
    return { _id: id, category_name, parent_category_id, target_type, admin_id: 1, ...audit(1) };
  }
  function product(id) {
    const family = id % 3, group = Math.floor(id / 3) % 3;
    const type = ["BOOK", "CLOTHES", "ELECTRONICS"][family];
    const cat = [11, 14, 17][family] + group;
    const books = [
      ["Sách Hệ quản trị cơ sở dữ liệu", "Sách Lập trình Java", "Sách Trí tuệ nhân tạo", "Sách Phân tích dữ liệu"][Math.floor(id / 9) % 4],
      ["Sách Quản trị doanh nghiệp", "Sách Khởi nghiệp thực hành", "Sách Kinh tế học căn bản"][Math.floor(id / 9) % 3],
      "Truyện tranh Hành trình khám phá"
    ];
    const name = family === 0 ? books[group] : family === 1
      ? ["Áo thun cotton cổ tròn", "Quần jeans dáng thẳng", "Giày thể thao thoáng khí"][group]
      : ["Tai nghe Bluetooth chống ồn", "Điện thoại thông minh", "Laptop học tập và làm việc"][group];
    const manufacturer = family === 0 ? "NXB Tri Thức" : family === 1
      ? (group === 2 ? "Biti's" : "Coolmate") : ["Sony", "Samsung", "Lenovo"][group];
    const base = family === 0 ? 50000 + id % 40 * 5000 : family === 1
      ? 150000 + id % 40 * 25000 : [500000 + id % 20 * 100000,
        3000000 + id % 20 * 500000, 8000000 + id % 20 * 500000][group];
    const variantNames = [["Bìa mềm", "Bìa cứng", "Bản đặc biệt"],
      ["Size M", "Size L", "Size XL"], ["Màu Đen", "Màu Bạc", "Bản 256GB"]][family];
    // Dau dataset co 4 variant/product, phan con lai co 3; ID khong trung va lien tuc.
    const count = id <= EXTRA_VARIANT_PRODUCTS ? 4 : 3;
    const firstId = (id - 1) * 3 + Math.min(id - 1, EXTRA_VARIANT_PRODUCTS) + 1;
    const fourthName = ["Bản sưu tầm", "Size XXL", "Bản 512GB"][family];
    const variants = Array.from({ length: count }, (_, i) => {
      const k = i + 1;
      return { variant_id: firstId + i,
        variant_name: k === 4 ? fourthName : variantNames[i], price: base * k,
        quantity_stock: 50 + (id * 7 % 450), is_active: true,
        image: "https://bkpee.vn/img/product/variant_" + id + "_" + k + ".png" };
    });
    const attributes = family === 0 ? { publisher: manufacturer,
      authors: ["Tác giả " + (id % 50 + 1), ...(id % 2 === 0 ? ["Đồng tác giả " + (id % 30 + 1)] : [])] }
      : family === 1 ? { material: ["100% Cotton", "Denim", "Vải lưới và cao su"][group] }
      : { warranty_id: "WARRANTY-VN-" + pad(id, 6),
        warranty_time: ["12 tháng", "24 tháng", "36 tháng"][group] };
    return { _id: id, seller_id: 2 + id % 200, category_id: cat,
      product_name: name + " - Mẫu " + id,
      description: "Sản phẩm " + ["Books", "Clothes", "Electronics"][family] + ", thông tin và thuộc tính theo đúng danh mục.",
      manufacturer, product_type: type, attributes, variants,
      min_price: base, max_price: base * count,
      total_stock: variants.reduce((s, v) => s + v.quantity_stock, 0), ...audit(2 + id % 200) };
  }

  // Kiem tra logic truoc khi ghi; chi luu tung batch 500 san pham.
  for (let id = 1; id <= PRODUCT_COUNT; id++) {
    const p = product(id);
    if (p.seller_id < 2 || p.seller_id > 201 || p.variants.length !== (id <= EXTRA_VARIANT_PRODUCTS ? 4 : 3) ||
        p.category_id < 11 || p.category_id > 19 ||
        p.min_price !== Math.min(...p.variants.map(v => v.price)) ||
        p.max_price !== Math.max(...p.variants.map(v => v.price)) ||
        p.variants.some((v, k) => v.variant_id !== (id - 1) * 3 + Math.min(id - 1, EXTRA_VARIANT_PRODUCTS) + k + 1))
      throw new Error("Du lieu product khong hop le: " + id);
  }
  print("Preflight OK: " + PRODUCT_COUNT + " products, " + VARIANT_COUNT + " variants.");
  // Không có transaction nhiều collection. Nếu lỗi giữa chừng, cần xem dữ liệu trước khi nạp lại.
  db.accounts.insertMany([admin, ...Array.from({ length: 200 }, (_, i) => seller(i + 1))]);
  db.categories.insertMany(Array.from({ length: 30 }, (_, i) => category(i + 1)));
  const batchSize = 500;
  for (let first = 1; first <= PRODUCT_COUNT; first += batchSize) {
    const batch = [];
    for (let id = first; id < Math.min(first + batchSize, PRODUCT_COUNT + 1); id++) batch.push(product(id));
    db.products.insertMany(batch, { ordered: true });
  }
  const actual = db.products.countDocuments({});
  if (actual !== PRODUCT_COUNT || db.accounts.countDocuments({}) !== 201 ||
      db.categories.countDocuments({}) !== 30 ||
      db.products.aggregate([{ $unwind: "$variants" }, { $count: "n" }]).toArray()[0]?.n !== VARIANT_COUNT)
    throw new Error("Sai so luong sau khi nap. Kiem tra database, khong nap lai ngay.");
  print("MONGODB_INDEX_SEED_READY: " + JSON.stringify({ products: actual, variants: VARIANT_COUNT, sellers: 200, categories: 30 }));
})();
