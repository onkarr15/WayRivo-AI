package com.wayrivo.repository;

import com.wayrivo.entity.Destination;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;

public interface DestinationRepository extends JpaRepository<Destination, Long> {

    @Query("SELECT d FROM Destination d WHERE " +
           "LOWER(d.name) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(d.country) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(d.state) LIKE LOWER(CONCAT('%', :search, '%'))")
    Page<Destination> searchDestinations(@Param("search") String search, Pageable pageable);

    List<Destination> findTop8ByOrderByIdAsc();
}
