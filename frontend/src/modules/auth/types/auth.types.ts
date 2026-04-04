export interface AuthPayload {
  sub: string;
  email: string;
  role: 'admin' | 'manager';
}

export interface AuthUserResponse {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'manager';
}

export interface AuthResponse {
  accessToken: string;
  tokenType: 'Bearer';
  user: AuthUserResponse;
}
