import { ApiResponse, UploadResponse } from 'shared-types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // Health check
  async health(): Promise<ApiResponse<{ status: string; timestamp: string }>> {
    return this.request('/api/health');
  }

  // Get upload URL for document
  async getUploadUrl(
    fileName: string,
    fileType: string
  ): Promise<ApiResponse<UploadResponse>> {
    return this.request('/api/get-upload-url', {
      method: 'POST',
      body: JSON.stringify({
        fileName,
        fileType,
      }),
    });
  }

  // Upload document
  async uploadDocument(
    formData: FormData
  ): Promise<ApiResponse<UploadResponse>> {
    return this.request('/api/upload-document', {
      method: 'POST',
      headers: {
        // Don't set Content-Type for FormData, let the browser set it
      },
      body: formData,
    });
  }

  // Get documents (example endpoint)
  async getDocuments(): Promise<ApiResponse<Record<string, unknown>[]>> {
    return this.request('/api/documents');
  }

  // Delete document (example endpoint)
  async deleteDocument(documentId: string): Promise<ApiResponse<{ success: boolean }>> {
    return this.request(`/api/documents/${documentId}`, {
      method: 'DELETE',
    });
  }
}

// Export singleton instance
export const apiClient = new ApiClient();

// Export class for custom instances
export { ApiClient };
