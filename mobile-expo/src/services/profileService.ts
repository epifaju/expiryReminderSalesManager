import apiClient from './apiClient';
import { normalizeCurrency, SupportedCurrency } from '../types/currency';

export interface UserProfile {
  id: number;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  roles: string[];
  preferredLanguage: string;
  preferredCurrency: SupportedCurrency;
}

export interface UpdateProfilePayload {
  email?: string;
  preferredCurrency?: SupportedCurrency;
  preferredLanguage?: string;
}

class ProfileService {
  async getProfile(): Promise<UserProfile> {
    const response = await apiClient.get<UserProfile>('/api/profile');
    return {
      ...response.data,
      preferredCurrency: normalizeCurrency(response.data.preferredCurrency),
    };
  }

  async updateProfile(payload: UpdateProfilePayload): Promise<UserProfile> {
    const response = await apiClient.patch<UserProfile>('/api/profile', payload);
    return {
      ...response.data,
      preferredCurrency: normalizeCurrency(response.data.preferredCurrency),
    };
  }

  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    await apiClient.post('/api/profile/change-password', {
      currentPassword,
      newPassword,
    });
  }
}

export const profileService = new ProfileService();
export default profileService;
