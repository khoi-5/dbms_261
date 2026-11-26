# Cụm 3 - SQL Indexing T1–T4 (chạy thủ công trong SSMS)

Đích duy nhất: `BKPEE_INDEX_DB` (KHÔNG dùng `BKPEE_DB`).

1. Seed trước: 10K Variant / 3.000 Product hoặc 50K Variant / 16.500 Product.
2. Mở riêng `T1.sql`, `T2.sql`, `T3.sql`, `T4.sql` trong SSMS, F5 **toàn bộ file**. Không chạy đồng thời nhiều bài.
3. `T1`: đo thời gian CREATE INDEX Price (1 warmup + 3 RUN); in ms và dung lượng KiB.
4. `T2`: SORT_ALL/TOP100_ASC/TOP100_DESC trước/sau index Price. Xem **Messages** (`SET STATISTICS TIME/IO`) và nhãn `RUN 1..3`. SORT_ALL trả 10K/50K dòng nên SSMS có thể khá nặng.
5. `T3`: EQ_SELLER và MULTI_SELLER; baseline, (Seller_ID,Product_Name), (Product_Name,Seller_ID).
6. `T4`: INSERT 100 + UPDATE 100, trước/sau 3 index; mỗi mẫu trong transaction ROLLBACK. Chỉ số IDENTITY có thể bị nhảy, nhưng dữ liệu gốc không đổi.
7. Đo sau warmup: lấy median của **3 RUN** của cùng phép thử. T1/T4 in ms; T2/T3 lấy SQL Server Execution time (elapsed) tại Messages. Không trộn thời gian server-side với end-to-end.
8. Muốn xem Actual Execution Plan: bật **Ctrl+M** trước khi F5 cho T2/T3. Có thể tắt Ctrl+M cho lúc đo để ít nhiễu, rồi bật và chạy riêng truy vấn mẫu khi cần chụp hình.
9. Script chỉ tự xóa các index có tiền tố `IX_EXP_Tn_` tương ứng. Các index PK/UNIQUE không bị xóa. T1–T4 không tự reset dataset.
10. Chuyển 10K sang 50K: chạy lại **schema INDEX** `index/schema/01_schema.sql`, rồi seed 50K; không reset DB ứng dụng.

Lưu ý: T2/T3 trả dữ liệu ra SSMS nhiều lần; hiệu năng đo có thể biến động do cache và hiển thị. Các script chưa được thực thi trực tiếp trên SQL Server tại môi trường tạo file, cần kiểm thử thủ công.
