# Backend mới — bản thiết kế trách nhiệm

Đây là bộ khung để nhóm triển khai Spring Boot theo cách chia lớp của Birdbook. **Chưa có code thực thi**: các file Java chỉ có comment, chưa có class/interface, chưa có dependency hay cấu hình chạy. Không dùng thư mục này để thay backend Node.js đang chạy ngay lập tức.

## Bắt đầu đọc

1. `docs/01-feature-map.md`: đối chiếu đủ 12 tiêu chí với file chịu trách nhiệm.
2. `docs/02-architecture.md`: cách các lớp phối hợp, ranh giới trách nhiệm.
3. `docs/03-business-decisions.md`: các đề xuất cần nhóm chốt trước khi code.
4. `docs/04-database-and-demo.md`: trách nhiệm SQL/MongoDB, transaction, indexing và kịch bản minh chứng.
5. `docs/05-team-workflow.md`: chia việc và checklist hoàn thành một tính năng.
6. Các file trong `src/main/java/com/bkpee`: ghi chú chi tiết cho từng file.

## Cấu trúc

```text
src/main/java/com/bkpee/
  controller/                 Nhận/trả HTTP, dùng service
  service/                    Hợp đồng nghiệp vụ (interface khi triển khai)
    implementation/           Nơi viết logic nghiệp vụ
  repository/                 Truy vấn, lưu dữ liệu, thao tác khóa
  entity/                     Mô hình ánh xạ lưu trữ SQL nếu dùng JPA
  dto/                        Dữ liệu đầu vào/đầu ra theo chức năng
  mapper/                     Chuyển entity/snapshot thành DTO
  security/                   Lấy danh tính, tích hợp xác thực
  config/                     Cấu hình Spring, CORS, security
  exception/                  Lỗi nghiệp vụ và cách trả lỗi
  enums/                      Tập giá trị trạng thái/loại
src/main/resources/           Ghi chú cấu hình và migration
src/test/java/com/bkpee/      Ghi chú các nhóm test cần triển khai
```

`service/FooService.java` mô tả các thao tác; `service/implementation/FooServiceImpl.java` mô tả cách thực hiện. Không phải hai tầng chạy tuần tự: Spring sẽ tiêm implementation khi controller phụ thuộc interface.

Tên class, DTO và thao tác trong comment là **đề xuất thiết kế**, không phải API đã chốt. Người phụ trách được quyết định endpoint, method, field, pagination và cách xác thực khi triển khai, rồi cập nhật hợp đồng dùng chung với FE. Không cần sao chép JSON cũ nếu nhóm thống nhất đổi và sửa FE tương ứng.

SQL Server hiện có là nguồn tham khảo, không đảm bảo mọi entity đề xuất đã có bảng/cột tương ứng. Không chạy lại script xóa bảng cũ. Chưa cấu hình JPA tự tạo/sửa schema. Chưa sao chép mật khẩu hay `.env` vào đây.

Đăng nhập, hồ sơ, danh mục, xác thực là phần hỗ trợ cho 12 tiêu chí, không tính thành tiêu chí mới. JWT, Flyway, cổng thanh toán thật, MongoDB và cách kế thừa entity đều là lựa chọn cần chốt, không được giả định đã triển khai.
