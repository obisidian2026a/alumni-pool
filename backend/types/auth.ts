export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'manager';
}

export interface AuthResponse {
  accessToken: string;
  tokenType: 'Bearer';
  user: AuthUser;
}
