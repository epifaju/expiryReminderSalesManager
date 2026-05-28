import apiClient from './apiClient';

export interface OrganisationListItemDto {
  id: string;
  name: string;
  role: string;
  status: string;
}

export interface StoreListItemDto {
  id: string;
  organisationId: string;
  name: string;
  address?: string | null;
  isActive?: boolean | null;
}

class TenantService {
  async getMyOrganisations(): Promise<OrganisationListItemDto[]> {
    const response = await apiClient.get('/me/organisations');
    return response.data || [];
  }

  async getStoresByOrganisation(organisationId: string): Promise<StoreListItemDto[]> {
    const response = await apiClient.get(`/organisations/${organisationId}/stores`);
    return response.data || [];
  }
}

export default new TenantService();

