package com.bkpee.auth;

import java.util.Map;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.dao.DataAccessException;
import org.springframework.dao.ConcurrencyFailureException;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestControllerAdvice
public class ApiErrors {
    @ExceptionHandler(ResponseStatusException.class)
    ResponseEntity<?> business(ResponseStatusException e) { return ResponseEntity.status(e.getStatusCode()).body(Map.of("message",e.getReason()==null?"Yêu cầu thất bại":e.getReason())); }
    @ExceptionHandler(MethodArgumentNotValidException.class)
    ResponseEntity<?> validation(MethodArgumentNotValidException e) { return ResponseEntity.badRequest().body(Map.of("message","Dữ liệu không hợp lệ", "fields",e.getBindingResult().getFieldErrors().stream().map(f->f.getField()+": "+f.getDefaultMessage()).toList())); }
    @ExceptionHandler(DataIntegrityViolationException.class)
    ResponseEntity<?> conflict() { return ResponseEntity.status(409).body(Map.of("message","Dữ liệu trùng hoặc không thỏa ràng buộc")); }
    @ExceptionHandler({HttpMessageNotReadableException.class,MethodArgumentTypeMismatchException.class})
    ResponseEntity<?> malformed() { return ResponseEntity.badRequest().body(Map.of("message","Kiểu dữ liệu yêu cầu không hợp lệ")); }
    @ExceptionHandler(DataAccessException.class)
    ResponseEntity<?> database() { return ResponseEntity.status(503).body(Map.of("message","Dịch vụ dữ liệu tạm thời không khả dụng. Vui lòng thử lại.")); }
    @ExceptionHandler(ConcurrencyFailureException.class)
    ResponseEntity<?> concurrent() { return ResponseEntity.status(409).body(Map.of("message","Dữ liệu đang được cập nhật đồng thời. Hãy tải lại trước khi thử tiếp.")); }
}
