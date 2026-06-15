/** Response envelope จาก backend (TransformInterceptor) */
export interface ApiResponse<T> {
  success: true;
  data: T;
}

export interface ApiError {
  success: false;
  error: { code: string; message: string | string[] };
  path: string;
  timestamp: string;
}

export interface Paginated<T> {
  items: T[];
  page: number;
  perPage: number;
  total: number;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}
