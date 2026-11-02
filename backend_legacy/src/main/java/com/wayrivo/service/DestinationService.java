package com.wayrivo.service;

import com.wayrivo.dto.request.DestinationDTO;
import com.wayrivo.entity.Destination;
import com.wayrivo.exception.ResourceNotFoundException;
import com.wayrivo.repository.DestinationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

@Service
@RequiredArgsConstructor
public class DestinationService {

    private final DestinationRepository destinationRepository;

    public Page<Destination> getDestinations(String search, Pageable pageable) {
        if (search != null && !search.isBlank()) {
            return destinationRepository.searchDestinations(search, pageable);
        }
        return destinationRepository.findAll(pageable);
    }

    public Destination getDestinationById(Long id) {
        return destinationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Destination not found"));
    }

    public List<Destination> getPopularDestinations() {
        return destinationRepository.findTop8ByOrderByIdAsc();
    }

    @Transactional
    public Destination createDestination(DestinationDTO dto) {
        Destination destination = Destination.builder()
                .name(dto.getName())
                .country(dto.getCountry())
                .state(dto.getState())
                .description(dto.getDescription())
                .imageUrl(dto.getImageUrl())
                .bestTimeToVisit(dto.getBestTimeToVisit())
                .averageBudget(dto.getAverageBudget())
                .currency(dto.getCurrency() != null ? dto.getCurrency() : "INR")
                .build();
        return destinationRepository.save(destination);
    }

    @Transactional
    public Destination updateDestination(Long id, DestinationDTO dto) {
        Destination dest = getDestinationById(id);
        if (dto.getName() != null) dest.setName(dto.getName());
        if (dto.getCountry() != null) dest.setCountry(dto.getCountry());
        if (dto.getState() != null) dest.setState(dto.getState());
        if (dto.getDescription() != null) dest.setDescription(dto.getDescription());
        if (dto.getImageUrl() != null) dest.setImageUrl(dto.getImageUrl());
        if (dto.getBestTimeToVisit() != null) dest.setBestTimeToVisit(dto.getBestTimeToVisit());
        if (dto.getAverageBudget() != null) dest.setAverageBudget(dto.getAverageBudget());
        if (dto.getCurrency() != null) dest.setCurrency(dto.getCurrency());
        return destinationRepository.save(dest);
    }

    @Transactional
    public void deleteDestination(Long id) {
        if (!destinationRepository.existsById(id)) {
            throw new ResourceNotFoundException("Destination not found");
        }
        destinationRepository.deleteById(id);
    }
}
