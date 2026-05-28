package com.salesmanager.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;

import java.io.Serializable;
import java.util.Objects;
import java.util.UUID;

@Embeddable
public class OrganisationMemberId implements Serializable {

    @Column(name = "organisation_id", nullable = false)
    private UUID organisationId;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    public OrganisationMemberId() {}

    public OrganisationMemberId(UUID organisationId, Long userId) {
        this.organisationId = organisationId;
        this.userId = userId;
    }

    public UUID getOrganisationId() {
        return organisationId;
    }

    public void setOrganisationId(UUID organisationId) {
        this.organisationId = organisationId;
    }

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        OrganisationMemberId that = (OrganisationMemberId) o;
        return Objects.equals(organisationId, that.organisationId) && Objects.equals(userId, that.userId);
    }

    @Override
    public int hashCode() {
        return Objects.hash(organisationId, userId);
    }
}

