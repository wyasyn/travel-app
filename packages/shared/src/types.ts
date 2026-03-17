export type UserRole = "admin" | "user";

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}
