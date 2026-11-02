package com.wayrivo.controller;

import com.wayrivo.dto.request.DestinationDTO;
import com.wayrivo.dto.response.ApiResponse;
import com.wayrivo.entity.Destination;
import com.wayrivo.service.DestinationService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/destinations")
@RequiredArgsConstructor
public class DestinationController {

    private final DestinationService destinationService;

    @GetMapping
    public ResponseEntity<ApiResponse> getDestinations(
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size) {
        return ResponseEntity.ok(ApiResponse.ok(
            destinationService.getDestinations(search, PageRequest.of(page, size, Sort.by("name").ascending()))));
    }

    @GetMapping("/popular")
    public ResponseEntity<ApiResponse> getPopularDestinations() {
        return ResponseEntity.ok(ApiResponse.ok(destinationService.getPopularDestinations()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse> getDestination(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok(destinationService.getDestinationById(id)));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse> createDestination(@RequestBody DestinationDTO dto) {
        return ResponseEntity.ok(ApiResponse.ok("Destination created", destinationService.createDestination(dto)));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse> updateDestination(@PathVariable Long id, @RequestBody DestinationDTO dto) {
        return ResponseEntity.ok(ApiResponse.ok("Destination updated", destinationService.updateDestination(id, dto)));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse> deleteDestination(@PathVariable Long id) {
        destinationService.deleteDestination(id);
        return ResponseEntity.ok(ApiResponse.ok("Destination deleted"));
    }
}
