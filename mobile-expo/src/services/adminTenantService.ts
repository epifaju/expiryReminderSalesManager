import apiClient from './apiClient';

export interface AdminOrganisationDto {
  id: string;
  name: string;
  isActive: boolean;
}

export interface AdminStoreDto {
  id: string;
  organisationId: string;
  name: string;
  address?: string | null;
  isActive: boolean;
}

export interface AdminOrganisationMemberDto {
  organisationId: string;
  userId: number;
  username: string;
  role: string;
  status: string;
}

export interface AdminUserListItemDto {
  id: number;
  username: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  enabled: boolean;
}

const adminTenantService = {
  // Users search
  async searchUsers(query: string): Promise<AdminUserListItemDto[]> {
    const q = (query ?? '').trim();
    if (!q) return [];
    const res = await apiClient.get('/admin/users', { params: { query: q } });
    return Array.isArray(res.data) ? res.data : [];
  },

  // Organisations
  async listOrganisations(activeOnly = true): Promise<AdminOrganisationDto[]> {
    const res = await apiClient.get('/admin/organisations', { params: { activeOnly } });
    return Array.isArray(res.data) ? res.data : [];
  },

  async createOrganisation(name: string): Promise<AdminOrganisationDto> {
    const res = await apiClient.post('/admin/organisations', { name });
    return res.data;
  },

  async updateOrganisation(organisationId: string, name: string): Promise<AdminOrganisationDto> {
    const res = await apiClient.patch(`/admin/organisations/${organisationId}`, { name });
    return res.data;
  },

  async activateOrganisation(organisationId: string, cascade = false): Promise<void> {
    await apiClient.patch(`/admin/organisations/${organisationId}/activate`, null, { params: { cascade } });
  },

  async deactivateOrganisation(organisationId: string): Promise<void> {
    await apiClient.patch(`/admin/organisations/${organisationId}/deactivate`);
  },

  // Stores
  async listStoresByOrganisation(organisationId: string, activeOnly = true): Promise<AdminStoreDto[]> {
    const res = await apiClient.get(`/admin/organisations/${organisationId}/stores`, { params: { activeOnly } });
    return Array.isArray(res.data) ? res.data : [];
  },

  async createStore(organisationId: string, name: string, address?: string): Promise<AdminStoreDto> {
    const res = await apiClient.post(`/admin/organisations/${organisationId}/stores`, { name, address });
    return res.data;
  },

  async updateStore(
    organisationId: string,
    storeId: string,
    name: string,
    address?: string
  ): Promise<AdminStoreDto> {
    const res = await apiClient.patch(`/admin/organisations/${organisationId}/stores/${storeId}`, { name, address });
    return res.data;
  },

  async activateStore(organisationId: string, storeId: string): Promise<void> {
    await apiClient.patch(`/admin/organisations/${organisationId}/stores/${storeId}/activate`);
  },

  async deactivateStore(organisationId: string, storeId: string): Promise<void> {
    await apiClient.patch(`/admin/organisations/${organisationId}/stores/${storeId}/deactivate`);
  },

  // Members
  async listMembers(organisationId: string, activeOnly = true): Promise<AdminOrganisationMemberDto[]> {
    const res = await apiClient.get(`/admin/organisations/${organisationId}/members`, { params: { activeOnly } });
    return Array.isArray(res.data) ? res.data : [];
  },

  async addMember(
    organisationId: string,
    userId: number,
    role: string,
    status: string = 'ACTIVE'
  ): Promise<AdminOrganisationMemberDto> {
    const res = await apiClient.post(`/admin/organisations/${organisationId}/members`, { userId, role, status });
    return res.data;
  },

  async updateMember(
    organisationId: string,
    userId: number,
    role: string,
    status: string
  ): Promise<AdminOrganisationMemberDto> {
    const res = await apiClient.patch(`/admin/organisations/${organisationId}/members/${userId}`, { role, status });
    return res.data;
  },

  async activateMember(organisationId: string, userId: number): Promise<void> {
    await apiClient.patch(`/admin/organisations/${organisationId}/members/${userId}/activate`);
  },

  async deactivateMember(organisationId: string, userId: number): Promise<void> {
    await apiClient.patch(`/admin/organisations/${organisationId}/members/${userId}/deactivate`);
  },
};

export default adminTenantService;

