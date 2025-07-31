// Enhanced API client with better error handling and types
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

export class ApiError extends Error {
  constructor(
    public message: string,
    public status?: number,
    public code?: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const url = `${this.baseUrl}/api${endpoint}`;
      
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new ApiError(
          `API request failed: ${errorText}`,
          response.status
        );
      }

      return await response.json();
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      
      throw new ApiError(
        `Network error: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  // User profile methods
  async getUserProfile(userId: string) {
    return this.request(`/user-profile?userId=${userId}`);
  }

  async updateUserProfile(userId: string, updates: Record<string, any>) {
    return this.request(`/user-profile?userId=${userId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  // Verification methods
  async checkVerification(userId: string) {
    return this.request<{
      isVerified: boolean;
      hasProfile: boolean;
      verificationStatus: {
        idVerified: boolean;
        dlVerified: boolean;
      };
    }>(`/check-verification?userId=${userId}`);
  }

  // Upload methods
  async getUploadUrl(params: {
    user_id: string;
    document_type: string;
    uuid: string;
    filetype: string;
    fileSize: number;
  }) {
    return this.request<{
      uploadUrl: string;
      url: string;
      key: string;
    }>('/get-upload-url', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  async uploadDocument(params: {
    user_id: string;
    document_type: string;
    publicUrl: string;
  }) {
    return this.request<{ message: string }>('/upload-document', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  // Admin methods
  async adminAuthenticate(adminKey: string) {
    return this.request<{ message: string }>('/admin-service', {
      method: 'POST',
      body: JSON.stringify({ action: 'authenticate', adminKey }),
    });
  }

  async getAdminStats(adminKey: string) {
    return this.request<{
      totalUsers: number;
      totalDrivers: number;
      verifiedUsers: number;
      driversWithDocs: number;
      verifiedDLs: number;
      verifiedIDs: number;
    }>('/admin-service', {
      method: 'POST',
      body: JSON.stringify({ action: 'getStats', adminKey }),
    });
  }

  async getAllUsers(adminKey: string) {
    return this.request<Array<{
      userProfile: any;
      driverProfile?: any;
    }>>('/admin-service', {
      method: 'POST',
      body: JSON.stringify({ action: 'getUsers', adminKey }),
    });
  }

  async updateUserVerification(adminKey: string, userId: string, documentType: 'id' | 'dl', verified: boolean) {
    return this.request<{ message: string }>('/admin-service', {
      method: 'POST',
      body: JSON.stringify({ action: 'updateVerification', adminKey, userId, documentType, verified }),
    });
  }

  // Health check
  async healthCheck() {
    return this.request('/health');
  }
}

// Export a default instance
export const apiClient = new ApiClient();
