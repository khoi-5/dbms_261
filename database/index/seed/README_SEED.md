# Cum 2 - Seed Indexing (SQL Server / MongoDB)

Chi dung hai database thuc nghiem: `BKPEE_INDEX_DB` va `bkpee_index_db`.
Khong ghi vao `BKPEE_DB` / `bkpee_db` cua ung dung.

| File | Product | Variant | Phan bo |
|---|---:|---:|---|
| `sql_10k.sql`, `mongo_10k.js` | 3.000 | 10.000 | 1.000 product x 4 variant + 2.000 product x 3 variant |
| `sql_50k.sql`, `mongo_50k.js` | 16.500 | 50.000 | 500 product x 4 variant + 16.000 product x 3 variant |

Cac dataset co 200 seller, 30 category; cac bang/collection khac trong schema V2 de trong. Du lieu san pham bám theo ten, gia, seller, category cua seed V2. Cac file seed khong tao index phu.

## Thu tu chay (moi lan chi chon 10K HOAC 50K)

**SQL Server - SSMS**
1. Chay `index/schema/01_schema.sql` de reset **chi** `BKPEE_INDEX_DB`.
2. Mo `index/seed/sql_10k.sql` (hoac `sql_50k.sql`), nhan F5.
3. Kiem tra COUNT(Product), COUNT(Product_Variant).

**MongoDB - PowerShell**
1. Dam bao `bkpee_index_db` co 9 collection rong va chua co index phu tren `products`. `index/schema/02_mongodb_schema.js` chi tao collection neu thieu, **khong** reset du lieu.
2. Chay `mongosh "mongodb://127.0.0.1:27017/bkpee_index_db" --file "E:\dbms\database\index\seed\mongo_10k.js"` (hoac `mongo_50k.js`).
3. Seed MongoDB se tu dung neu collection co du lieu; **khong chay lai** sau khi da nap thanh cong.

Khi doi quy mo 10K/50K, reset **database Indexing** tung he truoc. KHONG reset database ung dung.

Luu y: cho den khi chay trong SSMS va mongosh, cac file moi chi duoc kiem tra logic va cu phap offline.
