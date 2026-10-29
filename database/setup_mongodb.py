import sys
import argparse
from datetime import datetime, timedelta
from pymongo import MongoClient, ASCENDING, DESCENDING, TEXT

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

MONGO_URI = "mongodb://localhost:27017/"
DB_NAME = "bkpee_db"

def get_db():
    client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=3000)
    return client, client[DB_NAME]

def setup_indexes(db):
    print("[*] Đang tạo các chỉ mục (Indexes)...")
    
    db.accounts.create_index([("username", ASCENDING)], unique=True)
    db.accounts.create_index([("email", ASCENDING)], unique=True)
    db.accounts.create_index([("phone", ASCENDING)], unique=True)
    db.accounts.create_index([("roles", ASCENDING)])
    
    db.categories.create_index([("category_name", ASCENDING)], unique=True)
    db.categories.create_index([("parent_category_id", ASCENDING)])
    
    db.shipping_providers.create_index([("provider_name", ASCENDING)], unique=True)
    
    db.products.create_index([("seller_id", ASCENDING)])
    db.products.create_index([("category_id", ASCENDING), ("min_price", ASCENDING)])
    db.products.create_index([("product_name", TEXT), ("description", TEXT)])
    db.products.create_index([("variants.variant_id", ASCENDING)])
    
    db.orders.create_index([("buyer_id", ASCENDING), ("order_time", DESCENDING)])
    db.orders.create_index([("shop_orders.seller_id", ASCENDING), ("order_time", DESCENDING)])
    db.orders.create_index([("payment.transaction_code", ASCENDING)], unique=True)
    
    db.promotions.create_index([("seller_id", ASCENDING), ("expiration_date", ASCENDING)])
    db.promotions.create_index([("applicable_variant_ids", ASCENDING)])
    
    db.evaluations.create_index([("product_id", ASCENDING), ("rating", DESCENDING)])
    db.evaluations.create_index([("variant_id", ASCENDING)])
    
    db.reports.create_index([("reporter_id", ASCENDING)])
    db.reports.create_index([("reported_account_id", ASCENDING)])
    
    print("[+] Đã tạo xong chỉ mục.")

def clean_database(db):
    print("[*] Đang làm sạch collections cũ...")
    for col in ["accounts", "categories", "shipping_providers", "products", "carts", "promotions", "orders", "evaluations", "reports"]:
        db[col].drop()

def seed_small(db):
    print("[*] Đang nạp dữ liệu mẫu cơ bản (Small Seed) - Đồng bộ 100% với 02_seed_small.sql...")
    clean_database(db)
    setup_indexes(db)
    
    # 1. Accounts (Admin 1, Sellers 2, 3, 4, Buyers 5, 6)
    db.accounts.insert_many([
        {
            "_id": 1,
            "username": "admin_root",
            "password_hash": "$2a$10$hashed_admin_pwd",
            "fname": "Văn",
            "lname": "Quản Trị",
            "phone": "0901000001",
            "email": "admin@bkpee.vn",
            "gender": "Nam",
            "avatar": "https://bkpee.vn/img/admin.png",
            "address": "Quận 10, TP.HCM",
            "cccd": "079090000001",
            "date_of_birth": datetime(1995, 5, 15),
            "account_status": "ACTIVE",
            "roles": ["ADMIN"],
            "admin_profile": { "admin_role": "SUPER_ADMIN" }
        },
        {
            "_id": 2,
            "username": "seller_fahasa",
            "password_hash": "$2a$10$hashed_seller_pwd1",
            "fname": "Thị",
            "lname": "Nhà Sách",
            "phone": "0902000002",
            "email": "fahasa@bkpee.vn",
            "gender": "Nữ",
            "avatar": "https://bkpee.vn/img/fahasa.png",
            "address": "Quận 1, TP.HCM",
            "cccd": "079090000002",
            "date_of_birth": datetime(1990, 10, 20),
            "account_status": "ACTIVE",
            "roles": ["SELLER"],
            "user_profile": { "trust_score": 100 },
            "seller_profile": {
                "shop_name": "Fahasa Official Store",
                "bank_account_number": "190345678901"
            }
        },
        {
            "_id": 3,
            "username": "seller_coolmate",
            "password_hash": "$2a$10$hashed_seller_pwd2",
            "fname": "Đức",
            "lname": "Thời Trang",
            "phone": "0903000003",
            "email": "coolmate@bkpee.vn",
            "gender": "Nam",
            "avatar": "https://bkpee.vn/img/coolmate.png",
            "address": "Hà Đông, Hà Nội",
            "cccd": "079090000003",
            "date_of_birth": datetime(1992, 3, 12),
            "account_status": "ACTIVE",
            "roles": ["SELLER"],
            "user_profile": { "trust_score": 98 },
            "seller_profile": {
                "shop_name": "Coolmate Activewear",
                "bank_account_number": "190345678902"
            }
        },
        {
            "_id": 4,
            "username": "seller_cellphones",
            "password_hash": "$2a$10$hashed_seller_pwd3",
            "fname": "Thành",
            "lname": "Điện Máy",
            "phone": "0904000004",
            "email": "cellphones@bkpee.vn",
            "gender": "Nam",
            "avatar": "https://bkpee.vn/img/cellphones.png",
            "address": "Bình Thạnh, TP.HCM",
            "cccd": "079090000004",
            "date_of_birth": datetime(1988, 8, 8),
            "account_status": "ACTIVE",
            "roles": ["SELLER"],
            "user_profile": { "trust_score": 95 },
            "seller_profile": {
                "shop_name": "CellphoneS Flagship",
                "bank_account_number": "190345678903"
            }
        },
        {
            "_id": 5,
            "username": "buyer_hienle",
            "password_hash": "$2a$10$hashed_buyer_pwd1",
            "fname": "Thúy",
            "lname": "Lê Hiền",
            "phone": "0905000005",
            "email": "thuyhien@bkpee.vn",
            "gender": "Nữ",
            "avatar": "https://bkpee.vn/img/buyer1.png",
            "address": "Thủ Đức, TP.HCM",
            "cccd": "079090000005",
            "date_of_birth": datetime(2003, 7, 25),
            "account_status": "ACTIVE",
            "roles": ["BUYER"],
            "user_profile": { "trust_score": 100 },
            "buyer_profile": {
                "addresses": [
                    {
                        "receiver_name": "Lê Hiền Thúy",
                        "phone": "0905000005",
                        "address": "KTX Khu A ĐHQG TP.HCM, Dĩ An, Bình Dương",
                        "is_default": True
                    },
                    {
                        "receiver_name": "Lê Hiền Thúy",
                        "phone": "0905000005",
                        "address": "Nhà riêng: 123 Võ Văn Ngân, Thủ Đức, TP.HCM",
                        "is_default": False
                    }
                ]
            }
        },
        {
            "_id": 6,
            "username": "buyer_khoinguyen",
            "password_hash": "$2a$10$hashed_buyer_pwd2",
            "fname": "Khôi",
            "lname": "Nguyễn",
            "phone": "0906000006",
            "email": "khoinguyen@bkpee.vn",
            "gender": "Nam",
            "avatar": "https://bkpee.vn/img/buyer2.png",
            "address": "Quận 7, TP.HCM",
            "cccd": "079090000006",
            "date_of_birth": datetime(2002, 11, 14),
            "account_status": "ACTIVE",
            "roles": ["BUYER"],
            "user_profile": { "trust_score": 100 },
            "buyer_profile": {
                "addresses": [
                    {
                        "receiver_name": "Nguyễn Khôi",
                        "phone": "0906000006",
                        "address": "456 Nguyễn Lương Bằng, Quận 7, TP.HCM",
                        "is_default": True
                    }
                ]
            }
        }
    ])
    
    # 2. Categories
    db.categories.insert_many([
        { "_id": 1, "category_name": "Sách & Văn Phòng Phẩm", "parent_category_id": None, "admin_id": 1 },
        { "_id": 2, "category_name": "Thời Trang & May Mặc", "parent_category_id": None, "admin_id": 1 },
        { "_id": 3, "category_name": "Thiết Bị Điện Tử", "parent_category_id": None, "admin_id": 1 },
        { "_id": 4, "category_name": "Sách Công Nghệ & Kỹ Thuật", "parent_category_id": 1, "admin_id": 1 },
        { "_id": 5, "category_name": "Áo Thun Nam Nữ", "parent_category_id": 2, "admin_id": 1 },
        { "_id": 6, "category_name": "Tai Nghe & Phụ Kiện", "parent_category_id": 3, "admin_id": 1 }
    ])
    
    # 3. Shipping Providers
    db.shipping_providers.insert_many([
        { "_id": 1, "provider_name": "Giao Hàng Tiết Kiệm (GHTK)", "phone": "19006092", "address": "Tòa nhà VTV, Cầu Giấy, Hà Nội", "admin_id": 1, "base_shipping_fee": 22000 },
        { "_id": 2, "provider_name": "Giao Hàng Nhanh (GHN)", "phone": "1900636677", "address": "Tân Bình, TP.HCM", "admin_id": 1, "base_shipping_fee": 25000 },
        { "_id": 3, "provider_name": "Viettel Post", "phone": "19008095", "address": "Ba Đình, Hà Nội", "admin_id": 1, "base_shipping_fee": 20000 }
    ])
    
    # 4. Products (Product 1: Sách, Product 2: Quần áo, Product 3: Điện tử)
    db.products.insert_many([
        {
            "_id": 1,
            "seller_id": 2,
            "category_id": 4,
            "product_name": "Giáo trình Cơ Sở Dữ Liệu (Database Systems)",
            "description": "Sách tham khảo chuẩn quốc tế biên soạn bởi ĐHQG-HCM.",
            "manufacturer": "NXB Đại học Quốc gia",
            "product_type": "BOOK",
            "attributes": {
                "publisher": "Nhà Xuất Bản ĐHQG TP.HCM",
                "authors": ["PGS.TS. Trần Minh", "ThS. Nguyễn Thị Lan"]
            },
            "variants": [
                { "variant_id": 1, "variant_name": "Bìa Mềm", "price": 120000, "quantity_stock": 150, "is_active": True, "image": "https://bkpee.vn/img/books/csdl-tap1.png" },
                { "variant_id": 2, "variant_name": "Bìa Cứng", "price": 180000, "quantity_stock": 50, "is_active": True, "image": "https://bkpee.vn/img/books/csdl-biacung.png" }
            ],
            "min_price": 120000,
            "max_price": 180000,
            "total_stock": 200
        },
        {
            "_id": 2,
            "seller_id": 3,
            "category_id": 5,
            "product_name": "Áo Thun Thể Thao Nam QuickDry Chạy Bộ",
            "description": "Chất liệu Polyester tái chế siêu nhẹ, thoáng khí và khử mùi tối ưu.",
            "manufacturer": "Coolmate Vietnam",
            "product_type": "CLOTHES",
            "attributes": {
                "material": "92% Polyester, 8% Spandex"
            },
            "variants": [
                { "variant_id": 3, "variant_name": "Màu Đen, Size L", "price": 199000, "quantity_stock": 80, "is_active": True, "image": "https://bkpee.vn/img/clothes/aothun-den-l.png" },
                { "variant_id": 4, "variant_name": "Màu Trắng, Size M", "price": 199000, "quantity_stock": 40, "is_active": True, "image": "https://bkpee.vn/img/clothes/aothun-trang-m.png" }
            ],
            "min_price": 199000,
            "max_price": 199000,
            "total_stock": 120
        },
        {
            "_id": 3,
            "seller_id": 4,
            "category_id": 6,
            "product_name": "Tai Nghe Chống Ồn Sony WH-1000XM5",
            "description": "Tai nghe Bluetooth cao cấp với công nghệ chống ồn chủ động hàng đầu thế giới.",
            "manufacturer": "Sony Corporation",
            "product_type": "ELECTRONICS",
            "attributes": {
                "warranty_id": "BH-SONY-VN-2026",
                "warranty_time": "12 tháng chính hãng"
            },
            "variants": [
                { "variant_id": 5, "variant_name": "Màu Bạc", "price": 7990000, "quantity_stock": 25, "is_active": True, "image": "https://bkpee.vn/img/electronics/sony-bac.png" }
            ],
            "min_price": 7990000,
            "max_price": 7990000,
            "total_stock": 25
        }
    ])
    
    # 5. Carts (Buyer 5 & Buyer 6)
    db.carts.insert_many([
        {
            "_id": 1,
            "buyer_id": 5,
            "total_product": 3,
            "items": [
                { "variant_id": 1, "product_id": 1, "quantity": 1, "added_at": datetime.now() },
                { "variant_id": 3, "product_id": 2, "quantity": 2, "added_at": datetime.now() }
            ]
        },
        {
            "_id": 2,
            "buyer_id": 6,
            "total_product": 0,
            "items": []
        }
    ])
    
    # 6. Promotions
    db.promotions.insert_many([
        {
            "_id": 1,
            "seller_id": 2,
            "type": "COUPON",
            "quantity": 100,
            "start_date": datetime(2026, 10, 1),
            "expiration_date": datetime(2026, 12, 31),
            "min_bill": 200000,
            "discount_config": { "percent_discount": 15.0, "max_discount": 50000 },
            "applicable_variant_ids": [1, 2]
        },
        {
            "_id": 2,
            "seller_id": 3,
            "type": "VOUCHER",
            "quantity": 50,
            "start_date": datetime(2026, 10, 15),
            "expiration_date": datetime(2026, 11, 30),
            "min_bill": 300000,
            "discount_config": { "voucher_value": 30000 },
            "applicable_variant_ids": [3]
        }
    ])
    
    # 7. Orders
    db.orders.insert_one({
        "_id": 1,
        "buyer_id": 5,
        "buyer_name": "Lê Hiền Thúy",
        "delivery_address": "KTX Khu A ĐHQG TP.HCM, Dĩ An, Bình Dương",
        "order_time": datetime(2026, 10, 29, 14, 30),
        "total_price": 540000,
        "shop_orders": [
            {
                "shop_order_id": 1,
                "seller_id": 2,
                "shop_name": "Fahasa Official Store",
                "shipping_provider": { "provider_id": 1, "provider_name": "Giao Hàng Tiết Kiệm (GHTK)" },
                "tracking_number": "GHTK-FAHASA-001",
                "delivery_status": "DELIVERED",
                "shipping_fee": 22000,
                "shipped_at": datetime(2026, 10, 29, 16, 0),
                "delivered_at": datetime(2026, 10, 30, 9, 30),
                "items": [
                    { "variant_id": 1, "product_id": 1, "product_name": "Giáo trình Cơ Sở Dữ Liệu (Bìa Mềm)", "quantity": 1, "purchase_price": 120000, "line_total": 120000 }
                ]
            },
            {
                "shop_order_id": 2,
                "seller_id": 3,
                "shop_name": "Coolmate Activewear",
                "shipping_provider": { "provider_id": 2, "provider_name": "Giao Hàng Nhanh (GHN)" },
                "tracking_number": "GHN-COOLMATE-002",
                "delivery_status": "SHIPPING",
                "shipping_fee": 25000,
                "shipped_at": datetime(2026, 10, 29, 17, 0),
                "delivered_at": None,
                "items": [
                    { "variant_id": 3, "product_id": 2, "product_name": "Áo Thun Thể Thao Nam (Đen, L)", "quantity": 2, "purchase_price": 199000, "line_total": 398000 }
                ]
            }
        ],
        "payment": {
            "transaction_code": "TXN-BKPEE-20261029-001",
            "payment_method": "VNPAY",
            "payment_status": "COMPLETED",
            "payment_time": datetime(2026, 10, 29, 14, 35)
        }
    })
    
    # 8. Evaluations
    db.evaluations.insert_one({
        "_id": 1,
        "buyer_id": 5,
        "variant_id": 1,
        "product_id": 1,
        "rating": 5,
        "content": "Sách in rất đẹp, bìa dày dặn, kiến thức chuẩn giáo trình DBMS của trường!",
        "images": [
            "https://bkpee.vn/img/review/sach-thuc-te-1.jpg",
            "https://bkpee.vn/img/review/sach-thuc-te-2.jpg"
        ],
        "created_at": datetime(2026, 10, 30, 10, 0)
    })
    
    # 9. Reports
    db.reports.insert_one({
        "_id": 1,
        "reporter_id": 5,
        "reported_account_id": 4,
        "admin_id": 1,
        "reason": "Tư vấn sai thông tin sản phẩm",
        "description": "Shop hẹn bảo hành 24 tháng nhưng tem chỉ ghi 12 tháng.",
        "status": "RESOLVED",
        "evidence_images": [
            "https://bkpee.vn/img/report/anh-chup-tem-bao-hanh.jpg"
        ],
        "created_at": datetime(2026, 10, 28, 8, 0),
        "resolved_at": datetime(2026, 10, 28, 17, 0)
    })
    
    print("[+] Hoàn tất nạp dữ liệu nhỏ vào MongoDB!")

def seed_large(db):
    print("[*] Đang sinh DỮ LIỆU LỚN vào MongoDB - Đồng bộ 100% logic với 03_seed_large.sql...")
    clean_database(db)
    setup_indexes(db)
    
    now = datetime(2026, 10, 30, 0, 0)
    
    # 1. Accounts (1 Admin + 200 Sellers + 1.800 Buyers = 2.001)
    print("  -> [1/9] Sinh 2.001 tài khoản...")
    accounts = [
        {
            "_id": 1,
            "username": "admin_root",
            "password_hash": "$2a$10$hashed_admin_pwd",
            "fname": "Văn",
            "lname": "Quản Trị",
            "phone": "0901000000",
            "email": "admin@bkpee.vn",
            "gender": "Nam",
            "avatar": "https://bkpee.vn/img/admin.png",
            "address": "Quận 10, TP.HCM",
            "cccd": "079090000000",
            "date_of_birth": datetime(1995, 5, 15),
            "account_status": "ACTIVE",
            "roles": ["ADMIN"],
            "admin_profile": { "admin_role": "SUPER_ADMIN" }
        }
    ]
    
    for n in range(1, 2001):
        is_seller = (n <= 200)
        user_id = n + 1
        acc = {
            "_id": user_id,
            "username": f"seller_{n:04d}" if is_seller else f"buyer_{n:04d}",
            "password_hash": "$2a$10$encrypted_password_hash",
            "fname": ["Nguyễn", "Trần", "Lê", "Phạm", "Hoàng"][n % 5],
            "lname": ["Anh Tuấn", "Thị Mai", "Minh Khôi", "Thúy Hiền"][n % 4],
            "phone": f"091{n:07d}",
            "email": f"user_{n}@bkpee.vn",
            "gender": "Nam" if n % 2 == 0 else "Nữ",
            "avatar": f"https://bkpee.vn/avatar/user_{n}.png",
            "address": f"Số {(n * 7 % 300 + 1)} Đường {(n % 50 + 1)}, TP. Hồ Chí Minh",
            "cccd": f"0791{n:08d}",
            "date_of_birth": now - timedelta(days=6000 + (n * 13 % 10000)),
            "account_status": "ACTIVE",
            "roles": ["SELLER"] if is_seller else ["BUYER"],
            "user_profile": { "trust_score": 80 + (n % 21) }
        }
        if is_seller:
            acc["seller_profile"] = {
                "shop_name": f"Gian Hàng Official Shop {n}",
                "bank_account_number": f"9704{n:012d}"
            }
        else:
            acc["buyer_profile"] = {
                "addresses": [
                    {
                        "receiver_name": f"{acc['fname']} {acc['lname']}",
                        "phone": acc["phone"],
                        "address": acc["address"],
                        "is_default": True
                    }
                ]
            }
            if n % 2 == 0:
                acc["buyer_profile"]["addresses"].append({
                    "receiver_name": f"{acc['fname']} {acc['lname']}",
                    "phone": acc["phone"],
                    "address": f"Văn phòng: Tòa nhà Landmark {(n % 5 + 1)}, TP.HCM",
                    "is_default": False
                })
        accounts.append(acc)
        
    db.accounts.insert_many(accounts, ordered=False)
    
    # 2. Categories (30 danh mục)
    print("  -> [2/9] Sinh 30 danh mục (Cây phân cấp 2 tầng)...")
    categories = []
    parent_names = [
        "Sách & Văn Phòng Phẩm", "Thời Trang & May Mặc", "Thiết Bị Điện Tử", "Nhà Cửa & Đời Sống",
        "Mẹ & Bé", "Sức Khỏe & Sắc Đẹp", "Thể Thao & Du Lịch", "Ô Tô - Xe Máy", "Bách Hóa Online", "Đồ Chơi & Quà Tặng"
    ]
    for i, name in enumerate(parent_names, 1):
        categories.append({ "_id": i, "category_name": name, "parent_category_id": None, "admin_id": 1 })
    
    child_names = [
        "Sách Công Nghệ & Kỹ Thuật", "Sách Kinh Tế & Khởi Nghiệp", "Truyện Tranh & Manga", "Áo Thun Nam Nữ",
        "Quần Jeans & Kaki", "Giày Dép Thời Trang", "Tai Nghe & Loa Bluetooth", "Điện Thoại Thông Minh",
        "Laptop & Máy Tính Bảng", "Nội Thất Phòng Khách", "Đồ Gia Dụng Nhà Bếp", "Sữa & Thực Phẩm Cho Bé",
        "Tã Bỉm Trẻ Em", "Chăm Sóc Da Mặt", "Thực Phẩm Chức Năng", "Dụng Cụ Tập Gym", "Lều Trại & Phụ Kiện Phượt",
        "Mũ Bảo Hiểm Chính Hãng", "Đồ Ăn Vặt & Bánh Kẹo", "Mô Hình Lắp Ráp Anime"
    ]
    for i, name in enumerate(child_names, 11):
        parent_id = ((i - 11) % 10) + 1
        categories.append({ "_id": i, "category_name": name, "parent_category_id": parent_id, "admin_id": 1 })
    db.categories.insert_many(categories, ordered=False)
    
    # 3. Shipping Providers (10 đơn vị)
    print("  -> [3/9] Sinh 10 đơn vị vận chuyển...")
    providers = [
        { "_id": 1, "provider_name": "Giao Hàng Tiết Kiệm (GHTK)", "phone": "19006092", "address": "Cầu Giấy, Hà Nội", "admin_id": 1, "base_shipping_fee": 22000 },
        { "_id": 2, "provider_name": "Giao Hàng Nhanh (GHN)", "phone": "1900636677", "address": "Tân Bình, TP.HCM", "admin_id": 1, "base_shipping_fee": 25000 },
        { "_id": 3, "provider_name": "Viettel Post", "phone": "19008095", "address": "Ba Đình, Hà Nội", "admin_id": 1, "base_shipping_fee": 20000 },
        { "_id": 4, "provider_name": "VNPost", "phone": "1900545481", "address": "Hoàn Kiếm, Hà Nội", "admin_id": 1, "base_shipping_fee": 18000 },
        { "_id": 5, "provider_name": "J&T Express", "phone": "19001088", "address": "Bình Thạnh, TP.HCM", "admin_id": 1, "base_shipping_fee": 23000 },
        { "_id": 6, "provider_name": "Ninja Van", "phone": "1900886877", "address": "Quận 7, TP.HCM", "admin_id": 1, "base_shipping_fee": 24000 },
        { "_id": 7, "provider_name": "BEST Express", "phone": "19001031", "address": "Bình Tân, TP.HCM", "admin_id": 1, "base_shipping_fee": 21000 },
        { "_id": 8, "provider_name": "Shopee Xpress", "phone": "19001221", "address": "Thủ Đức, TP.HCM", "admin_id": 1, "base_shipping_fee": 19000 },
        { "_id": 9, "provider_name": "GrabExpress", "phone": "19001555", "address": "Quận 1, TP.HCM", "admin_id": 1, "base_shipping_fee": 35000 },
        { "_id": 10, "provider_name": "Ahamove", "phone": "1900545411", "address": "Quận 3, TP.HCM", "admin_id": 1, "base_shipping_fee": 30000 }
    ]
    db.shipping_providers.insert_many(providers, ordered=False)
    
    # 4. Products (3.000 sản phẩm nhúng 9.000 variants)
    print("  -> [4/9] Sinh 3.000 sản phẩm (kèm 9.000 biến thể nhúng)...")
    products = []
    for n in range(1, 3001):
        p_type = ["BOOK", "CLOTHES", "ELECTRONICS"][n % 3]
        seller_id = 2 + (n % 200)
        cat_id = 11 + (n % 20)
        
        attrs = {}
        if p_type == "BOOK":
            attrs = {
                "publisher": f"NXB Đại Học Quốc Gia - Cơ sở {(n % 5 + 1)}",
                "authors": [f"GS. Tác Giả {(n % 50 + 1)}", f"ThS. Đồng Tác Giả {(n % 30 + 1)}"]
            }
        elif p_type == "CLOTHES":
            attrs = { "material": ["100% Cotton Hữu Cơ", "Vải Đũi Thoáng Mát", "Polyester Siêu Nhẹ"][n % 3] }
        else:
            attrs = { "warranty_id": f"WARRANTY-{n:06d}", "warranty_time": f"{(n % 3 + 1) * 12} tháng" }
            
        base_price = 50000 + (n * 17 % 200) * 10000
        variants = [
            { "variant_id": (n - 1) * 3 + 1, "variant_name": "Phiên bản Standard", "price": base_price, "quantity_stock": 100, "is_active": True, "image": f"https://bkpee.vn/img/p_{n}_1.png" },
            { "variant_id": (n - 1) * 3 + 2, "variant_name": "Phiên bản Plus", "price": base_price * 1.5, "quantity_stock": 50, "is_active": True, "image": f"https://bkpee.vn/img/p_{n}_2.png" },
            { "variant_id": (n - 1) * 3 + 3, "variant_name": "Phiên bản Premium", "price": base_price * 2.0, "quantity_stock": 30, "is_active": True, "image": f"https://bkpee.vn/img/p_{n}_3.png" }
        ]
        
        products.append({
            "_id": n,
            "seller_id": seller_id,
            "category_id": cat_id,
            "product_name": f"Sản phẩm {p_type} chính hãng #{n}",
            "description": f"Mô tả chi tiết sản phẩm {n}. Chất lượng vượt trội, phân phối chính hãng.",
            "manufacturer": ["Vingroup", "Samsung", "Sony", "NXB ĐHQG", "Coolmate"][n % 5],
            "product_type": p_type,
            "attributes": attrs,
            "variants": variants,
            "min_price": base_price,
            "max_price": base_price * 2.0,
            "total_stock": 180,
            "rating_avg": 4.5,
            "created_at": now - timedelta(days=n % 300)
        })
        
    db.products.insert_many(products, ordered=False)
    
    # 5. Promotions (500 mã khuyến mãi của 200 Sellers)
    print("  -> [5/9] Sinh 500 chương trình khuyến mãi (Coupons & Vouchers)...")
    promotions = []
    for n in range(1, 501):
        is_coupon = (n % 2 == 0)
        p_type = "COUPON" if is_coupon else "VOUCHER"
        discount_cfg = {}
        if is_coupon:
            discount_cfg = {
                "percent_discount": 10.0 + (n % 8) * 5.0,
                "max_discount": 50000 + (n % 5) * 20000
            }
        else:
            discount_cfg = {
                "voucher_value": 20000 + (n % 10) * 10000
            }
            
        promotions.append({
            "_id": n,
            "seller_id": 2 + (n % 200),
            "type": p_type,
            "quantity": 100 + (n * 5 % 500),
            "start_date": datetime(2026, 1, 1),
            "expiration_date": datetime(2026, 12, 31, 23, 59, 59),
            "min_bill": 100000 + (n % 10) * 50000,
            "discount_config": discount_cfg,
            "applicable_variant_ids": [(n * 17 % 8500 + 1), ((n * 17 + 5) % 8500 + 1)]
        })
    db.promotions.insert_many(promotions, ordered=False)
    
    # 6. Carts (1.800 giỏ hàng của Buyer)
    print("  -> [6/9] Sinh 1.800 giỏ hàng (kèm 3.000 mục hàng nhúng)...")
    carts = []
    for n in range(1, 1801):
        buyer_id = 201 + n
        items = []
        if n <= 1500:
            items.append({
                "variant_id": 1 + ((n * 11 + 137) % 8500),
                "product_id": 1 + (n % 3000),
                "quantity": 1 + (n % 4),
                "added_at": now - timedelta(hours=n % 72)
            })
            items.append({
                "variant_id": 1 + ((n * 11 + 274) % 8500),
                "product_id": 1 + ((n + 3) % 3000),
                "quantity": 1,
                "added_at": now - timedelta(hours=n % 48)
            })
            
        carts.append({
            "_id": n,
            "buyer_id": buyer_id,
            "total_product": sum(it["quantity"] for it in items),
            "items": items
        })
    db.carts.insert_many(carts, ordered=False)
    
    # 7. Orders (10.000 đơn hàng nhúng Shop_Orders, Items, Payment)
    print("  -> [7/9] Sinh 10.000 đơn hàng đầy đủ nhúng Shop Orders, Items & Payment...")
    orders = []
    for n in range(1, 10001):
        order_time = now - timedelta(minutes=(n * 23 % 400000))
        buyer_id = 202 + (n % 1800)
        seller_id_1 = 2 + (n % 200)
        seller_id_2 = 2 + ((n + 1) % 200)
        
        shop_orders = [
            {
                "shop_order_id": (n - 1) * 2 + 1,
                "seller_id": seller_id_1,
                "shop_name": f"Gian Hàng Official Shop {seller_id_1 - 1}",
                "shipping_provider": { "provider_id": 1 + (n % 10), "provider_name": "Giao Hàng Tiết Kiệm (GHTK)" },
                "tracking_number": f"SPX-BKPEE-{n:07d}-1",
                "delivery_status": ["PENDING", "CONFIRMED", "SHIPPING", "DELIVERED", "DELIVERED"][n % 5],
                "shipping_fee": 22000,
                "shipped_at": order_time + timedelta(hours=4),
                "delivered_at": order_time + timedelta(days=2) if (n % 5 >= 3) else None,
                "items": [
                    {
                        "variant_id": 1 + (n * 13 % 8500),
                        "product_id": 1 + (n % 3000),
                        "product_name": f"Món hàng chi tiết #{n}-1",
                        "quantity": 1 + (n % 3),
                        "purchase_price": 120000 + (n % 50) * 10000,
                        "line_total": (1 + (n % 3)) * (120000 + (n % 50) * 10000)
                    }
                ]
            }
        ]
        
        if n % 2 == 0:
            shop_orders.append({
                "shop_order_id": (n - 1) * 2 + 2,
                "seller_id": seller_id_2,
                "shop_name": f"Gian Hàng Official Shop {seller_id_2 - 1}",
                "shipping_provider": { "provider_id": 2, "provider_name": "Giao Hàng Nhanh (GHN)" },
                "tracking_number": f"SPX-BKPEE-{n:07d}-2",
                "delivery_status": "DELIVERED",
                "shipping_fee": 25000,
                "shipped_at": order_time + timedelta(hours=5),
                "delivered_at": order_time + timedelta(days=2),
                "items": [
                    {
                        "variant_id": 2 + (n * 17 % 8500),
                        "product_id": 1 + ((n + 5) % 3000),
                        "product_name": f"Món hàng chi tiết #{n}-2",
                        "quantity": 1,
                        "purchase_price": 199000,
                        "line_total": 199000
                    }
                ]
            })
            
        total_p = sum(item["line_total"] for s in shop_orders for item in s["items"])
        
        orders.append({
            "_id": n,
            "buyer_id": buyer_id,
            "delivery_address": f"Địa chỉ nhận hàng #{n}, Phường {(n % 20 + 1)}, TP. Hồ Chí Minh",
            "order_time": order_time,
            "total_price": total_p,
            "shop_orders": shop_orders,
            "payment": {
                "transaction_code": f"PAY-BKPEE-TXN-{n:08d}",
                "payment_method": ["COD", "VNPAY", "MOMO", "BANKING"][n % 4],
                "payment_status": "FAILED" if (n % 6 == 3) else "COMPLETED",
                "payment_time": order_time + timedelta(minutes=5)
            }
        })
        
    db.orders.insert_many(orders, ordered=False)
    
    # 8. Evaluations (6.000 bài đánh giá)
    print("  -> [8/9] Sinh 6.000 bài đánh giá...")
    evals = []
    for n in range(1, 6001):
        evals.append({
            "_id": n,
            "buyer_id": 202 + (n % 1800),
            "variant_id": 1 + (n * 7 % 8500),
            "product_id": 1 + (n % 3000),
            "rating": 3 + (n % 3),
            "content": [
                "Sản phẩm đóng gói rất cẩn thận, đúng mô tả, giao hàng siêu nhanh!",
                "Chất lượng tốt so với giá tiền, shop phục vụ nhiệt tình và chu đáo.",
                "Dùng rất ưng ý, sẽ ủng hộ shop tiếp vào lần sau ạ!"
            ][n % 3],
            "images": [f"https://bkpee.vn/img/review/{n}_1.jpg"] if (n % 2 == 0) else [],
            "created_at": now - timedelta(days=n % 180)
        })
    db.evaluations.insert_many(evals, ordered=False)
    
    # 9. Reports (1.000 tố cáo)
    print("  -> [9/9] Sinh 1.000 phiếu khiếu nại vi phạm...")
    reports = []
    for n in range(1, 1001):
        reports.append({
            "_id": n,
            "reporter_id": 202 + (n % 1800),
            "reported_account_id": 2 + (n % 200),
            "admin_id": 1,
            "reason": [
                "Hàng nhận được không đúng như hình ảnh quảng cáo",
                "Shop chậm trễ xác nhận đơn hàng quá 48 giờ",
                "Nghi vấn hàng nhái, không có tem bảo hành chính hãng",
                "Thái độ tư vấn chăm sóc khách hàng chưa phù hợp"
            ][n % 4],
            "description": f"Nội dung khiếu nại chi tiết từ người dùng số {n}",
            "status": ["PENDING", "IN_PROGRESS", "RESOLVED"][n % 3],
            "evidence_images": [f"https://bkpee.vn/img/report/evidence_{n}.jpg"],
            "created_at": now - timedelta(days=n % 90),
            "resolved_at": now - timedelta(days=1) if (n % 3 == 2) else None
        })
    db.reports.insert_many(reports, ordered=False)
    
    print("[+] Hoàn tất nạp dữ liệu lớn vào MongoDB thành công!")

def main():
    parser = argparse.ArgumentParser(description="Khởi tạo cơ sở dữ liệu MongoDB BKPEE")
    parser.add_argument("--mode", choices=["small", "large"], default="small", help="Chế độ nạp dữ liệu (small: vài bản ghi; large: 10.000+ bản ghi)")
    args = parser.parse_args()
    
    try:
        client, db = get_db()
        print(f"[+] Kết nối MongoDB thành công: {MONGO_URI} (DB: {DB_NAME})")
        
        start_t = datetime.now()
        if args.mode == "large":
            seed_large(db)
        else:
            seed_small(db)
        elapsed = (datetime.now() - start_t).total_seconds()
        print(f"[+] Thời gian thực thi: {elapsed:.2f} giây.")
        
        print("\nThống kê số lượng documents trong các Collections:")
        for name in sorted(db.list_collection_names()):
            count = db[name].count_documents({})
            print(f"  - {name:<22}: {count:>6} documents")
            
    except Exception as e:
        print(f"[-] Lỗi khi thao tác với MongoDB: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
