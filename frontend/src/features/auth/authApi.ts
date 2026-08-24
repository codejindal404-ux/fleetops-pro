import { apiClient } from '../../services/apiClient.ts';

export const authApi = {
  login: apiClient.login,
  verifyOtp: apiClient.verifyOtp,
  resendOtp: apiClient.resendOtp,
  register: apiClient.register,
  getMe: apiClient.getMe,
  updateProfile: apiClient.updateProfile
};
