// V2 LARGE SEED for mongosh. Original sources: ../setup_mongodb.py (large),
// ../03_seed_large.sql and ../init_mongodb.js (document model/indexes).
// Deterministic UTC dates/IDs. Corrects original cross-product/seller references.
// No deletion, schema changes, retries or multi-collection transaction.
// Stop other writers and run exactly one seed process. Partial failure needs review.
(() => {
  const expectedHost = null;
  const confirmation = null;
  const targetName = "bkpee_db";
  if (db.getName() !== targetName) throw new Error("Connect directly to bkpee_db.");
  if (typeof expectedHost !== "string" || !expectedHost.trim() || db.getMongo().host !== expectedHost)
    throw new Error("Missing or incorrect expectedHost; independently verify server identity.");
  if (confirmation !== "SEED bkpee_db") throw new Error("Confirmation required: SEED bkpee_db");
  const currentDb = db; // Never switch database context.
  const counts = { accounts: 2001, categories: 30, shipping_providers: 10, products: 3000,
    carts: 2000, promotions: 500, orders: 10000, evaluations: 6000, reports: 1000 };
  const collections = Object.keys(counts);
  const infos = currentDb.getCollectionInfos();
  if (infos.some(c => !c.name.startsWith("system.") && !collections.includes(c.name)))
    throw new Error("Unexpected collection; inspect this database before proceeding.");
  for (const name of collections) {
    const info = infos.find(c => c.name === name);
    if (!info || info.type !== "collection" || info.options?.capped || info.options?.timeseries)
      throw new Error("Run script 03 first; incompatible or missing collection: " + name);
    if (currentDb.getCollection(name).countDocuments({}) !== 0)
      throw new Error("Empty collections required; existing documents in " + name);
  }
  const requiredIndexes = [
    ["accounts", { username: 1 }, { unique: true }],
    ["accounts", { email: 1 }, { unique: true }],
    ["accounts", { phone: 1 }, { unique: true }],
    ["accounts", { roles: 1 }, {}],
    ["categories", { category_name: 1 }, { unique: true }],
    ["categories", { parent_category_id: 1 }, {}],
    ["categories", { target_type: 1 }, {}],
    ["shipping_providers", { provider_name: 1 }, { unique: true }],
    ["products", { seller_id: 1 }, {}],
    ["products", { category_id: 1, min_price: 1 }, {}],
    ["products", { product_name: "text", description: "text" }, {}],
    ["products", { "variants.variant_id": 1 }, {}],
    ["orders", { buyer_id: 1, order_time: -1 }, {}],
    ["orders", { "shop_orders.seller_id": 1, order_time: -1 }, {}],
    ["orders", { "payment.transaction_code": 1 }, { unique: true }],
    ["promotions", { seller_id: 1, expiration_date: 1 }, {}],
    ["promotions", { applicable_variant_ids: 1 }, {}],
    ["evaluations", { product_id: 1, rating: -1 }, {}],
    ["evaluations", { variant_id: 1 }, {}],
    ["reports", { reporter_id: 1 }, {}],
    ["reports", { reported_account_id: 1 }, {}]
  ];
  for (const [name, keys, options] of requiredIndexes) {
    const found = currentDb.getCollection(name).getIndexes().some(index => {
      const fields = Object.keys(keys).filter(k => keys[k] === "text");
      const matches = fields.length
        ? index.key._fts === "text" && Object.keys(index.weights || {}).length === fields.length &&
          fields.every(k => index.weights[k] === 1)
        : JSON.stringify(index.key) === JSON.stringify(keys);
      return matches && !!index.unique === !!options.unique && !index.sparse &&
        !index.partialFilterExpression && !index.hidden &&
        (!index.collation || index.collation.locale === "simple");
    });
    if (!found) throw new Error("Missing/incompatible index on " + name + "; inspect script 03.");
  }

  // Pure factory: no database, clock, randomness or I/O. IDs use SQL seed ordinals.
  function makeDataset() {
    const epoch = Date.UTC(2026, 9, 30);
    const date = (days = 0, minutes = 0) => new Date(epoch + days * 86400000 + minutes * 60000);
    const pad = (n, width) => String(n).padStart(width, "0");
    // Existing demo bcrypt hash copied unchanged from the original seeds; no new password.
    const demoHash = "$2a$12$h1U/fVmlo3BtMYSWX7IseucGx96mQsrwnS1VcTBwm3hlIaAKxrtPe";
    const audit = (at, by) => ({ created_at: at, created_by: by, updated_at: at, updated_by: by });
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
    const providerRows = [
      ["Giao Hàng Tiết Kiệm (GHTK)", "19006092", "Cầu Giấy, Hà Nội", 22000],
      ["Giao Hàng Nhanh (GHN)", "1900636677", "Tân Bình, TP.HCM", 25000],
      ["Viettel Post", "19008095", "Ba Đình, Hà Nội", 20000],
      ["VNPost (Bưu Điện Việt Nam)", "1900545481", "Hoàn Kiếm, Hà Nội", 18000],
      ["J&T Express", "19001088", "Bình Thạnh, TP.HCM", 23000],
      ["Ninja Van", "1900886877", "Quận 7, TP.HCM", 24000],
      ["BEST Express", "19001031", "Bình Tân, TP.HCM", 21000],
      ["Shopee Xpress (SPX)", "19001221", "Thủ Đức, TP.HCM", 19000],
      ["GrabExpress Siêu Tốc", "19001555", "Quận 1, TP.HCM", 35000],
      ["Ahamove Giao Trong Ngày", "1900545411", "Quận 3, TP.HCM", 30000]
    ];
    function account(id) {
      if (id === 1) return { _id: 1, username: "admin_root", password_hash: demoHash,
        fname: "Văn", lname: "Quản Trị", phone: "0901000000", email: "admin@bkpee.vn",
        gender: "Nam", avatar: "https://bkpee.vn/img/admin.png", address: "Quận 10, TP.HCM",
        cccd: "079090000000", date_of_birth: new Date(Date.UTC(1995, 4, 15)),
        account_status: "ACTIVE", roles: ["ADMIN"], admin_profile: { admin_role: "SUPER_ADMIN" },
        ...audit(date(), 1) };
      const n = id - 1;
      const a = { _id: id, username: (n <= 200 ? "seller_" : "buyer_") + pad(n, 4),
        password_hash: demoHash, fname: ["Nguyễn", "Trần", "Lê", "Phạm", "Hoàng"][n % 5],
        lname: ["Anh Tuấn", "Thị Mai", "Minh Khôi", "Thúy Hiền"][n % 4],
        phone: "091" + pad(n, 7), email: "user_" + n + "@bkpee.vn", gender: n % 2 ? "Nữ" : "Nam",
        avatar: "https://bkpee.vn/avatar/user_" + n + ".png",
        address: "Số " + (n * 7 % 300 + 1) + " Đường " + (n % 50 + 1) + ", TP. Hồ Chí Minh",
        cccd: "0791" + pad(n, 8), date_of_birth: new Date(Date.UTC(2026, 0, 1) - (6000 + n * 13 % 10000) * 86400000),
        account_status: "ACTIVE", roles: n <= 200 ? ["SELLER", "BUYER"] : ["BUYER"],
        user_profile: { trust_score: 80 + id % 21 }, ...audit(date(-(n % 365)), 1) };
      if (n <= 200) a.seller_profile = { shop_name: "Gian Hàng Official Shop " + n,
        bank_name: "Vietcombank", bank_account_holder: "CHU TK GIAN HANG " + pad(id, 4),
        bank_account_number: "9704" + pad(id, 12), bank_branch: "TP. Ho Chi Minh" };
      a.buyer_profile = { addresses: [{ receiver_name: a.fname + " " + a.lname,
        phone: a.phone, address: a.address, is_default: true }] };
      if (id % 2 === 0) a.buyer_profile.addresses.push({ receiver_name: a.fname + " " + a.lname,
        phone: a.phone, address: "Văn phòng công ty: Tầng " + (id % 15 + 1) + ", Tòa nhà Landmark " +
          (id % 5 + 1) + ", TP.HCM", is_default: false });
      return a;
    }
    function category(id) {
      const [name, parent, type] = categoryRows[id - 1];
      return { _id: id, category_name: name, parent_category_id: parent,
        target_type: type, admin_id: 1, ...audit(date(), 1) };
    }
    function provider(id) {
      const [name, phone, address, fee] = providerRows[id - 1];
      return { _id: id, provider_name: name, phone, address, admin_id: 1,
        base_shipping_fee: fee, ...audit(date(), 1) };
    }
    function product(id) {
      const family = id % 3, group = Math.floor(id / 3) % 3;
      const type = ["BOOK", "CLOTHES", "ELECTRONICS"][family];
      const cat = [11, 14, 17][family] + group;
      const bookNames = [
        ["Sách Hệ quản trị cơ sở dữ liệu", "Sách Lập trình Java", "Sách Trí tuệ nhân tạo", "Sách Phân tích dữ liệu"][Math.floor(id / 9) % 4],
        ["Sách Quản trị doanh nghiệp", "Sách Khởi nghiệp thực hành", "Sách Kinh tế học căn bản"][Math.floor(id / 9) % 3],
        "Truyện tranh Hành trình khám phá"];
      const name = family === 0 ? bookNames[group] : family === 1
        ? ["Áo thun cotton cổ tròn", "Quần jeans dáng thẳng", "Giày thể thao thoáng khí"][group]
        : ["Tai nghe Bluetooth chống ồn", "Điện thoại thông minh", "Laptop học tập và làm việc"][group];
      const manufacturer = family === 0 ? "NXB Tri Thức" : family === 1
        ? (group === 2 ? "Biti's" : "Coolmate") : ["Sony", "Samsung", "Lenovo"][group];
      const attributes = family === 0 ? { publisher: manufacturer,
        authors: ["Tác giả " + (id % 50 + 1), ...(id % 2 === 0 ? ["Đồng tác giả " + (id % 30 + 1)] : [])] }
        : family === 1 ? { material: ["100% Cotton", "Denim", "Vải lưới và cao su"][group] }
        : { warranty_id: "WARRANTY-VN-" + pad(id, 6), warranty_time: ["12 tháng", "24 tháng", "36 tháng"][group] };
      const base = family === 0 ? 50000 + id % 40 * 5000 : family === 1 ? 150000 + id % 40 * 25000
        : [500000 + id % 20 * 100000, 3000000 + id % 20 * 500000, 8000000 + id % 20 * 500000][group];
      const names = [["Bìa mềm", "Bìa cứng", "Bản đặc biệt"], ["Size M", "Size L", "Size XL"],
        ["Màu Đen", "Màu Bạc", "Bản 256GB"]][family];
      const variants = [1, 2, 3].map(k => ({ variant_id: (id - 1) * 3 + k, variant_name: names[k - 1],
        price: base * k, quantity_stock: 50 + id * 7 % 450, is_active: true,
        image: "https://bkpee.vn/img/product/variant_" + id + "_" + k + ".png" }));
      return { _id: id, seller_id: 2 + id % 200, category_id: cat, product_name: name + " - Mẫu " + id,
        description: "Sản phẩm " + ["Books", "Clothes", "Electronics"][family] + ", thông tin và thuộc tính theo đúng danh mục.",
        manufacturer, product_type: type, attributes, variants, min_price: base, max_price: base * 3,
        total_stock: variants.reduce((s, v) => s + v.quantity_stock, 0), ...audit(date(-(id % 300)), 2 + id % 200) };
    }
    function variant(id) {
      const p = product(Math.floor((id - 1) / 3) + 1);
      return { product: p, variant: p.variants[(id - 1) % 3] };
    }
    // Every seller owns 15 products / 45 variants. Pick only from that seller's set.
    function ownedVariant(seller, slot) {
      const k = slot % 45, firstProduct = seller - 2 || 200;
      return (firstProduct + 200 * Math.floor(k / 3) - 1) * 3 + k % 3 + 1;
    }
    function cart(id) {
      const buyer = id + 1;
      const items = id <= 1500 ? [1, 2].map(k => {
        const vid = 1 + (id * 11 + k * 137) % 8500;
        return { variant_id: vid, product_id: variant(vid).product._id,
          quantity: 1 + id % 4, added_at: date() };
      }) : [];
      return { _id: id, buyer_id: buyer, total_product: items.reduce((s, i) => s + i.quantity, 0),
        total_price: items.reduce((s, i) => s + variant(i.variant_id).variant.price * i.quantity, 0),
        items, ...audit(date(), buyer) };
    }
    function promotion(id) {
      const seller = 2 + id % 200, coupon = id % 2 === 0;
      return { _id: id, seller_id: seller, type: coupon ? "COUPON" : "VOUCHER",
        quantity: 100 + id * 5 % 500, start_date: new Date(Date.UTC(2026, 0, 1)),
        expiration_date: new Date(Date.UTC(2026, 11, 31, 23, 59, 59)), min_bill: 100000 + id % 10 * 50000,
        discount_config: coupon ? { percent_discount: 10 + id % 8 * 5, max_discount: 50000 + id % 5 * 20000 }
          : { voucher_value: 20000 + id % 10 * 10000 },
        applicable_variant_ids: [ownedVariant(seller, id * 17 % 45)], ...audit(date(), seller) };
    }
    function order(id) {
      const buyer = 202 + id % 1800, at = date(0, -(id * 23 % 400000));
      const status = ["PENDING", "CONFIRMED", "SHIPPING", "CANCELLED", "DELIVERED", "DELIVERED"][id % 6];
      const shops = (id % 2 === 0 ? [0, 1] : [0]).map(offset => {
        const sid = id + Math.floor((id - 1) / 2) + offset, seller = 2 + (id + offset) % 200;
        const sp = provider(1 + id % 10);
        const items = Array.from({ length: sid % 3 === 0 ? 3 : 2 }, (_, k) => {
          const vid = ownedVariant(seller, (sid * 13 + k * 17) % 45), v = variant(vid);
          const quantity = 1 + sid % 3;
          return { variant_id: vid, product_id: v.product._id, product_name: v.product.product_name,
            quantity, purchase_price: v.variant.price, line_total: quantity * v.variant.price };
        });
        return { shop_order_id: sid, seller_id: seller, shop_name: account(seller).seller_profile.shop_name,
          shipping_provider: { provider_id: sp._id, provider_name: sp.provider_name },
          tracking_number: "SPX-BKPEE-" + pad(id, 7) + "-" + offset, delivery_status: status,
          shipping_fee: sp.base_shipping_fee, discount_amount: 0,
          shipped_at: ["SHIPPING", "DELIVERED"].includes(status) ? new Date(at.getTime() + 4 * 3600000) : null,
          delivered_at: status === "DELIVERED" ? new Date(at.getTime() + 2 * 86400000) : null, items };
      });
      // Historical orders do not apply promotions. Quantity is remaining demo stock,
      // not recomputed by replaying historical orders (same policy as SQL large seed).
      return { _id: id, buyer_id: buyer, buyer_name: account(buyer).fname + " " + account(buyer).lname,
        delivery_address: "Địa chỉ giao hàng số " + id + ", Phường " + (id % 20 + 1) + ", TP. Hồ Chí Minh",
        order_time: at, total_price: shops.reduce((s, so) => s + so.items.reduce((n, i) => n + i.line_total, 0)
          + so.shipping_fee - so.discount_amount, 0), shop_orders: shops,
        payment: { transaction_code: "PAY-BKPEE-TXN-" + pad(id, 8),
          payment_method: ["COD", "VNPAY", "MOMO", "BANKING"][id % 4],
          payment_status: status === "DELIVERED" ? "COMPLETED" : status === "CANCELLED" ? "FAILED" : "PENDING",
          payment_time: at }, ...audit(at, buyer) };
    }
    function evaluation(id) {
      // Select a delivered order, then an item actually bought by this buyer.
      const block = Math.floor((id - 1) / 2) % 1666;
      const o = order(block * 6 + (id % 2 === 0 ? 5 : 4)), item = o.shop_orders[0].items[0];
      const at = new Date(o.order_time.getTime() + 3 * 86400000);
      return { _id: id, buyer_id: o.buyer_id, variant_id: item.variant_id, product_id: item.product_id,
        rating: 3 + id % 3, content: ["Sản phẩm đúng mô tả, giao hàng nhanh.", "Chất lượng tốt so với giá tiền.",
          "Đóng gói cẩn thận, sẽ tiếp tục ủng hộ."][id % 3],
        images: id % 2 === 0 ? ["https://bkpee.vn/img/review/" + id + "_1.jpg"] : [], ...audit(at, o.buyer_id) };
    }
    function report(id) {
      const buyer = 202 + id % 1800, seller = 2 + id % 200, created = date(-(id % 90));
      const resolved = id % 3 === 2, updated = resolved ? date(0, 300) : created;
      return { _id: id, reporter_id: buyer, reported_account_id: seller, admin_id: 1,
        reason: ["Hàng nhận được không đúng hình ảnh", "Shop chậm xác nhận đơn", "Cần kiểm tra bảo hành", "Tư vấn chưa phù hợp"][id % 4],
        description: "Nội dung khiếu nại từ khách hàng số " + id,
        status: ["PENDING", "IN_PROGRESS", "RESOLVED"][id % 3],
        evidence_images: ["https://bkpee.vn/img/report/evidence_" + id + ".jpg"],
        resolved_at: resolved ? updated : null, ...audit(created, buyer), updated_at: updated,
        updated_by: resolved ? 1 : buyer };
    }
    return { accounts: account, categories: category, shipping_providers: provider, products: product,
      carts: cart, promotions: promotion, orders: order, evaluations: evaluation, reports: report, variant };
  }

  function verifyDocument(name, d, source) {
    const check = (ok, message) => { if (!ok) throw new Error(name + " #" + d._id + ": " + message); };
    const buyer = id => Number.isInteger(id) && id >= 2 && id <= 2001;
    const seller = id => Number.isInteger(id) && id >= 2 && id <= 201;
    const validVariant = id => Number.isInteger(id) && id >= 1 && id <= 9000;
    const itemCheck = i => {
      check(validVariant(i.variant_id), "invalid variant reference");
      check(i.product_id === source.variant(i.variant_id).product._id, "variant/product mismatch");
      check(Number.isSafeInteger(i.quantity) && i.quantity > 0, "invalid quantity");
    };
    if (name === "products") {
      check(seller(d.seller_id) && d.category_id >= 1 && d.category_id <= 30, "seller/category reference");
      const c = source.categories(d.category_id);
      check(c.target_type === d.product_type && c.parent_category_id === { BOOK: 1, CLOTHES: 2, ELECTRONICS: 3 }[d.product_type], "category/type mismatch");
      check(d.variants.length === 3 && new Set(d.variants.map(v => v.variant_id)).size === 3, "variant IDs");
      d.variants.forEach((v, k) => check(v.variant_id === (d._id - 1) * 3 + k + 1 && v.price >= 0 && v.quantity_stock >= 0, "variant ownership/values"));
      check(d.min_price === Math.min(...d.variants.map(v => v.price)) && d.max_price === Math.max(...d.variants.map(v => v.price)) &&
        d.total_stock === d.variants.reduce((s, v) => s + v.quantity_stock, 0), "product aggregates");
    } else if (name === "carts") {
      check(buyer(d.buyer_id), "buyer reference"); d.items.forEach(itemCheck);
      check(new Set(d.items.map(i => i.variant_id)).size === d.items.length, "duplicate cart item");
      check(d.total_product === d.items.reduce((s, i) => s + i.quantity, 0) &&
        d.total_price === d.items.reduce((s, i) => s + source.variant(i.variant_id).variant.price * i.quantity, 0), "cart totals");
    } else if (name === "promotions") {
      check(seller(d.seller_id) && d.quantity >= 0 && d.expiration_date >= d.start_date, "promotion values");
      d.applicable_variant_ids.forEach(id => check(validVariant(id) && source.variant(id).product.seller_id === d.seller_id, "promotion seller/variant mismatch"));
      check(d.type === "COUPON" ? d.discount_config.percent_discount > 0 && d.discount_config.percent_discount <= 100
        : d.type === "VOUCHER" && d.discount_config.voucher_value > 0, "discount config");
    } else if (name === "orders") {
      check(buyer(d.buyer_id), "buyer reference");
      for (const so of d.shop_orders) {
        check(seller(so.seller_id), "seller reference");
        const sp = source.shipping_providers(so.shipping_provider.provider_id);
        check(sp.provider_name === so.shipping_provider.provider_name && sp.base_shipping_fee === so.shipping_fee, "provider/fee mismatch");
        check(new Set(so.items.map(i => i.variant_id)).size === so.items.length, "duplicate shop item");
        so.items.forEach(i => { itemCheck(i); check(source.variant(i.variant_id).product.seller_id === so.seller_id, "shop/item seller mismatch");
          check(i.line_total === i.quantity * i.purchase_price && Number.isSafeInteger(i.line_total), "line total"); });
        check(so.discount_amount === 0, "historical demo orders must not consume promotions");
      }
      check(new Set(d.shop_orders.map(so => so.seller_id)).size === d.shop_orders.length, "duplicate seller in order");
      check(d.total_price === d.shop_orders.reduce((s, so) => s + so.items.reduce((n, i) => n + i.line_total, 0) + so.shipping_fee - so.discount_amount, 0)
        && Number.isSafeInteger(d.total_price), "order total");
    } else if (name === "evaluations") {
      check(buyer(d.buyer_id) && d.rating >= 1 && d.rating <= 5 && validVariant(d.variant_id), "evaluation values");
      check(source.variant(d.variant_id).product._id === d.product_id, "evaluation variant/product mismatch");
    } else if (name === "reports") {
      check(buyer(d.reporter_id) && seller(d.reported_account_id) && d.admin_id === 1, "report references");
      check(!d.resolved_at || d.resolved_at >= d.created_at, "report timestamps");
    } else if (name === "categories") {
      check(d.admin_id === 1 && (d.parent_category_id === null || d.parent_category_id >= 1 && d.parent_category_id <= 10), "category references");
    } else if (name === "shipping_providers") check(d.admin_id === 1 && d.base_shipping_fee >= 0, "provider values");
  }

  // Each pass keeps only a single document plus small ID/unique-key sets in RAM.
  function verifyAll(source, readDocuments) {
    const summary = { documents: 0, variants: 0, addresses: 0, cart_items: 0, shop_orders: 0,
      order_items: 0, payments: 0, coupons: 0, vouchers: 0 };
    const shops = new Set(), transactions = new Set(), tracking = new Set();
    for (const [name, expected] of Object.entries(counts)) {
      const ids = new Set(), unique = new Map();
      const fields = name === "accounts" ? ["username", "email", "phone"] : name === "categories" ? ["category_name"]
        : name === "shipping_providers" ? ["provider_name"] : [];
      fields.forEach(f => unique.set(f, new Set()));
      let seen = 0;
      readDocuments(name, expected, d => {
        if (!Number.isInteger(d._id) || d._id < 1 || d._id > expected || ids.has(d._id)) throw new Error("Duplicate/out-of-range ID in " + name);
        ids.add(d._id); ++seen; ++summary.documents;
        for (const f of fields) { if (unique.get(f).has(d[f])) throw new Error("Duplicate " + name + "." + f); unique.get(f).add(d[f]); }
        verifyDocument(name, d, source);
        if (name === "accounts") summary.addresses += d.buyer_profile?.addresses.length || 0;
        if (name === "products") summary.variants += d.variants.length;
        if (name === "carts") summary.cart_items += d.items.length;
        if (name === "promotions") ++summary[d.type === "COUPON" ? "coupons" : "vouchers"];
        if (name === "orders") {
          ++summary.payments;
          if (transactions.has(d.payment.transaction_code)) throw new Error("Duplicate payment transaction");
          transactions.add(d.payment.transaction_code);
          for (const so of d.shop_orders) {
            if (shops.has(so.shop_order_id) || tracking.has(so.tracking_number)) throw new Error("Duplicate shop order/tracking ID");
            shops.add(so.shop_order_id); tracking.add(so.tracking_number);
            ++summary.shop_orders; summary.order_items += so.items.length;
          }
        }
      });
      if (seen !== expected) throw new Error("Unexpected count in " + name + ": " + seen);
    }
    const expected = { documents: 24541, variants: 9000, addresses: 3000, cart_items: 3000,
      shop_orders: 15000, order_items: 35000, payments: 10000, coupons: 250, vouchers: 250 };
    for (const k of Object.keys(expected)) if (summary[k] !== expected[k]) throw new Error("Unexpected nested count: " + k);
    return summary;
  }
  function canonical(value) {
    if (value instanceof Date) return value.toISOString();
    if (Array.isArray(value)) return value.map(canonical);
    if (value && typeof value === "object") return Object.fromEntries(Object.keys(value).sort().map(k => [k, canonical(value[k])]));
    return value;
  }
  const source = makeDataset();
  const preflight = verifyAll(source, (name, n, visit) => { for (let id = 1; id <= n; ++id) visit(source[name](id)); });
  print("Preflight passed: " + JSON.stringify(preflight));
  const batchSize = 250;
  let attemptedWrites = false;
  try {
    // Recheck immediately before writing. This is not a lock against concurrent writers.
    for (const name of collections) if (currentDb.getCollection(name).countDocuments({}) !== 0)
      throw new Error("Collections changed during preflight; refusing to seed.");
    for (const [name, n] of Object.entries(counts)) {
      for (let first = 1; first <= n; first += batchSize) {
        const batch = [];
        for (let id = first; id < first + batchSize && id <= n; ++id) batch.push(source[name](id));
        attemptedWrites = true;
        const result = currentDb.getCollection(name).insertMany(batch, { ordered: true });
        if (!result.acknowledged || Object.keys(result.insertedIds).length !== batch.length)
          throw new Error("Unconfirmed/incomplete insert in " + name);
      }
      print(name + ": inserted " + n);
    }
    const after = verifyAll(source, (name, n, visit) => {
      const col = currentDb.getCollection(name);
      if (col.countDocuments({}) !== n) throw new Error("Unexpected stored count: " + name);
      const cursor = col.find({}).sort({ _id: 1 }).batchSize(batchSize);
      while (cursor.hasNext()) {
        const actual = cursor.next();
        if (!Number.isInteger(actual._id) || actual._id < 1 || actual._id > n) throw new Error("Unexpected stored ID in " + name);
        const expected = source[name](actual._id);
        if (JSON.stringify(canonical(actual)) !== JSON.stringify(canonical(expected)))
          throw new Error("Stored document differs from deterministic fixture: " + name + " #" + actual._id);
        visit(actual);
      }
    });
    print("MONGODB_V2_LARGE_SEED_READY: " + JSON.stringify(after));
  } catch (error) {
    if (attemptedWrites) print("STOP: seed may be incomplete. Do not rerun, delete, or reset automatically. Inspect partial data first.");
    throw error;
  }
})();
