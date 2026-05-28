package com.salesmanager.repository;

import com.salesmanager.entity.Store;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface StoreRepository extends JpaRepository<Store, UUID> {
    List<Store> findByOrganisation_Id(UUID organisationId);
    List<Store> findByOrganisation_IdAndIsActiveTrueOrderByNameAsc(UUID organisationId);
    List<Store> findByOrganisation_IdOrderByNameAsc(UUID organisationId);

    @Modifying
    @Query("update Store s set s.isActive = false where s.organisation.id = :organisationId")
    int deactivateAllByOrganisationId(UUID organisationId);
}

