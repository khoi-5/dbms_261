# SQL Indexing - Demo tren lop (chay 1 lan)

Dat 4 file vao `database/v2/index/sql_demo/`. **Khong ghi de** thu muc `database/v2/index/sql/` (ban benchmark warmup + 3 lan do).

Mo tung file trong SSMS, chon / ket noi SQL Server co `BKPEE_INDEX_DB`, nhan **F5**. Can dataset 10K hoac 50K duoc nap thanh cong truoc.

- **T1**: do 1 lan `CREATE INDEX` tren `Product_Variant.Price`; xem dung luong index.
- **T2**: SORT_ALL, TOP100_ASC, TOP100_DESC; moi query 1 lan truoc va 1 lan sau khi tao index Price.
- **T3**: EQ_SELLER / MULTI_SELLER; moi query 1 lan voi 3 cau hinh: khong index, (Seller_ID, Product_Name), (Product_Name, Seller_ID).
- **T4**: INSERT 100 va UPDATE 100; 1 lan khi chua co index thu nghiem va 1 lan khi co 3 index. Du lieu duoc rollback sau moi phep do.

Xem **Messages** de doc `SQL Server Execution Times` va `logical reads`. Bat **Ctrl+M** truoc F5 de xem Actual Execution Plan (khi can). T1/T4 in bang thoi gian truc tiep trong Results.

Index demo duoc tao va xoa trong script, chi tren `BKPEE_INDEX_DB`. Index PK/UNIQUE duoc giu nguyen. Trong T4, ROLLBACK khong hoan lai bo dem IDENTITY, nhung khong thay doi so dong hay gia tri seed.

**Luu y**: 1 lan do phu hop trinh dien; de bao cao co so lieu on dinh hon, dung bo `index/sql/` cu voi warmup + 3 lan do va median. Khong so sanh thoi gian SQL voi MongoDB de ket luan he nao nhanh hon.
