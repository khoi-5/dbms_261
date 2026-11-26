# BKPEE - MongoDB Indexing T1-T4

Hai bo file chay tren **bkpee_index_db**, khong truy cap bkpee_db chinh.

- `mongodb/`: 1 warmup va 3 lan do (lay median cho T2/T3; T1/T4 in tung lan).
- `mongodb_demo/`: 1 lan do moi truong hop, de demo tren lop.
- Dataset da seed: 3000 Product / 10000 Variant hoac 16500 Product / 50000 Variant.
- **MongoDB luu variant nhung trong products**: cac truy van T1-T3 dung `products.min_price` (3000/16500 document), KHONG phai 10000/50000 ban ghi rieng nhu SQL Server Product_Variant. Neu can thuc nghiem 10K/50K tren tung variant trong Mongo, phai thiet ke truy van/dataset khac; khong duoc ghi bao cao la 50K document.

## Chay bang PowerShell (vi du T2 demo)

```powershell
mongosh "mongodb://127.0.0.1:27017/bkpee_index_db" --file "E:\dbms\database\index\mongodb_demo\T2.js"
```

Thay `mongodb_demo` bang `mongodb` de do 1 warmup + 3 lan, thay `T2.js` bang `T1.js`, `T3.js`, `T4.js` tuy bai.

## Noi dung

- T1: do thoi gian tao index `products.min_price` va dung luong index.
- T2: SORT_ALL / TOP100_ASC / TOP100_DESC truoc va sau index.
- T3: `seller_id, product_name` vs `product_name, seller_id` (EQ_SELLER / MULTI_SELLER).
- T4: insert 100 document tam va update 100 document tam, so sanh khong index vs 3 index. Tu xoa document tam sau tung lan; MongoDB khong dung ROLLBACK giong SQL.

Moi file:
1. Kiem tra dung database va so Product.
2. In index hien tai; chi xoa index do bai nay tao tu lan chay truoc.
3. Tu choi neu con index phu bai khac, de baseline cong bang.
4. Do truoc / tao index / do sau; in `explain` o T2/T3.
5. Don index thuc nghiem cuoi file.

**Luu y**: Neu kill mongosh hoac mat ket noi giua chung, index tam / document tam T4 co the con. Kiem tra `db.products.getIndexes()` truoc khi chay lai. T4 dung ID am -1..-100 lam du lieu tam va KHONG tu xoa neu chung da ton tai truoc khi chay.

`explain()` phuc vu xem plan (IXSCAN/COLLSCAN, docsExamined, keysExamined). `Date.now()` la thoi gian o mongosh, duoi 1 ms co the hien thi 0; khong dung so 0 de khang dinh khong ton thoi gian. SQL va Mongo khac mo hinh luu tru va truy van nen khong so thoi gian 2 he de ket luan he nao nhanh hon.
