package com.salesmanager.repository;

import com.salesmanager.entity.OrganisationMember;
import com.salesmanager.entity.OrganisationMemberId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface OrganisationMemberRepository extends JpaRepository<OrganisationMember, OrganisationMemberId> {
    List<OrganisationMember> findByUser_Id(Long userId);

    @Query("""
            select m from OrganisationMember m
            join fetch m.organisation o
            where m.user.id = :userId
              and upper(m.status) = 'ACTIVE'
              and o.isActive = true
            order by o.name asc
            """)
    List<OrganisationMember> findActiveMembershipsWithOrganisationByUserId(Long userId);
    List<OrganisationMember> findByOrganisation_Id(UUID organisationId);

    @Query("""
            select m from OrganisationMember m
            join fetch m.user u
            where m.organisation.id = :organisationId
            order by u.username asc
            """)
    List<OrganisationMember> findByOrganisation_IdOrderByUsername(UUID organisationId);

    @Query("""
            select m from OrganisationMember m
            join fetch m.user u
            where m.organisation.id = :organisationId
              and m.status = 'ACTIVE'
            order by u.username asc
            """)
    List<OrganisationMember> findActiveByOrganisation_IdOrderByUsername(UUID organisationId);

    @Modifying
    @Query("update OrganisationMember m set m.status = 'INACTIVE' where m.organisation.id = :organisationId")
    int deactivateAllByOrganisationId(UUID organisationId);

    @Query("""
            select m from OrganisationMember m
            join fetch m.organisation o
            where m.user.id = :userId
              and upper(m.role) in ('ADMIN', 'ORG_ADMIN')
              and upper(m.status) = 'ACTIVE'
            order by o.name asc
            """)
    List<OrganisationMember> findActiveAdminMembershipsByUserId(Long userId);

    @Query("""
            select m from OrganisationMember m
            join fetch m.organisation o
            where m.user.id = :userId
              and upper(m.role) in ('ADMIN', 'ORG_ADMIN')
            order by o.name asc
            """)
    List<OrganisationMember> findAdminMembershipsByUserId(Long userId);
}

