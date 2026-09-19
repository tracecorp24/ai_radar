/**
 * Vendor-Bağımsız API İstemcisi
 * FastAPI Backend ile haberleşir.
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export interface HealthResponse {
  status: string;
  app_name: string;
  version: string;
  environment: string;
}

export interface UserResponse {
  id: number;
  email: string;
  full_name?: string;
  is_active: boolean;
  is_superuser: boolean;
  created_at: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
}

export interface AIGenerateRequest {
  prompt: string;
  provider?: string; // openrouter, openai, mock
  model_name?: string;
}

export interface AIGenerateResponse {
  id: number;
  prompt: string;
  response: string;
  status: "pending" | "running" | "completed" | "failed";
  provider: string;
  model_name: string;
  error_message?: string;
  created_at: string;
}

export class ApiClient {
  private static token: string | null = null;

  public static setToken(token: string) {
    ApiClient.token = token;
  }

  public static getToken(): string | null {
    return ApiClient.token;
  }

  /**
   * Backend Sağlık Durumunu Kontrol Eder
   */
  public static async getHealth(): Promise<HealthResponse> {
    const res = await fetch(`${API_BASE_URL}/health`);
    if (!res.ok) {
      throw new Error(`Sağlık kontrolü başarısız: HTTP ${res.status}`);
    }
    return res.json();
  }

  /**
   * Yeni Kullanıcı Kaydı
   */
  public static async registerUser(email: string, password: string, fullName?: string): Promise<UserResponse> {
    const res = await fetch(`${API_BASE_URL}/api/v1/users/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, full_name: fullName })
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.detail || "Kullanıcı kaydı başarısız oldu.");
    }
    return res.json();
  }

  /**
   * Kullanıcı Girişi (OAuth2 Token alımı)
   */
  public static async login(email: string, password: string): Promise<TokenResponse> {
    const formData = new URLSearchParams();
    formData.append("username", email);
    formData.append("password", password);

    const res = await fetch(`${API_BASE_URL}/api/v1/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: formData.toString()
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.detail || "Hatalı e-posta veya parola.");
    }

    const tokenData: TokenResponse = await res.json();
    ApiClient.setToken(tokenData.access_token);
    return tokenData;
  }

  /**
   * Vendor-Bağımsız AI Metin Üretimi İsteği
   */
  public static async generateAI(req: AIGenerateRequest): Promise<AIGenerateResponse> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json"
    };

    if (ApiClient.token) {
      headers["Authorization"] = `Bearer ${ApiClient.token}`;
    }

    const res = await fetch(`${API_BASE_URL}/api/v1/ai/generate`, {
      method: "POST",
      headers,
      body: JSON.stringify(req)
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.detail || "AI metin üretimi sırasında bir hata oluştu.");
    }

    return res.json();
  }
}
