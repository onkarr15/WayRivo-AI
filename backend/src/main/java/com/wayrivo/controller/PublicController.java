package com.wayrivo.controller;

import com.wayrivo.dto.response.ApiResponse;
import com.wayrivo.service.AdminService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/public")
@RequiredArgsConstructor
public class PublicController {

    private final AdminService adminService;

    @GetMapping("/statistics")
    public ResponseEntity<ApiResponse> getPublicStats() {
        return ResponseEntity.ok(ApiResponse.ok(adminService.getPublicStats()));
    }
}
