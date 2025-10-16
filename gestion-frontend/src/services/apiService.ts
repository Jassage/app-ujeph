import { Transcript, DocumentGenerationOptions } from "../types/academic";

const API_BASE_URL =
  process.env.REACT_APP_API_URL || "http://localhost:3001/api";

class ApiService {
  private async request(endpoint: string, options: RequestInit = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const config = {
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error || `HTTP error! status: ${response.status}`
        );
      }

      return await response.json();
    } catch (error) {
      console.error("API request failed:", error);
      throw error;
    }
  }

  // Transcript endpoints
  async getTranscripts(params?: any) {
    const queryString = params ? new URLSearchParams(params).toString() : "";
    return this.request(`/transcripts?${queryString}`);
  }

  async getTranscriptById(id: string) {
    return this.request(`/transcripts/${id}`);
  }

  async createTranscript(data: any) {
    return this.request("/transcripts", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async updateTranscript(id: string, data: any) {
    return this.request(`/transcripts/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  async deleteTranscript(id: string) {
    return this.request(`/transcripts/${id}`, {
      method: "DELETE",
    });
  }

  async downloadTranscript(id: string) {
    const url = `${API_BASE_URL}/transcripts/${id}/download`;

    try {
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const blob = await response.blob();
      const contentDisposition = response.headers.get("content-disposition");
      let fileName = "document.pdf";

      if (contentDisposition) {
        const fileNameMatch = contentDisposition.match(/filename="(.+)"/);
        if (fileNameMatch) fileName = fileNameMatch[1];
      }

      return { blob, fileName };
    } catch (error) {
      console.error("Download failed:", error);
      throw error;
    }
  }

  // Document generation
  async generateDocument(options: DocumentGenerationOptions) {
    return this.request("/transcripts", {
      method: "POST",
      body: JSON.stringify(options),
    });
  }
}

export const apiService = new ApiService();
