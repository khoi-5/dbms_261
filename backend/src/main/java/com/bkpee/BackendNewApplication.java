/**
 * BackendNewApplication — điểm khởi động ứng dụng.
 *
 * Chức năng
 * Khởi động Spring Boot với Java 21 và Maven. Package com.bkpee là gốc quét thành phần,
 * bao phủ các package con.
 *
 * Phân chia trách nhiệm
 * File khởi tạo ứng dụng, không chứa nghiệp vụ mua bán, mật khẩu hoặc thao tác tự đặt lại database. Dữ
 * liệu mẫu được quản lý riêng theo môi trường thử nghiệm. Cấu hình build nằm trong backend/pom.xml.
 *
 * Trạng thái hiện tại
 * Đã có main khởi động; các chức năng nghiệp vụ vẫn theo tài liệu thiết kế hiện có.
 */
package com.bkpee;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class BackendNewApplication {

    public static void main(String[] args) {
        SpringApplication.run(BackendNewApplication.class, args);
    }
}
