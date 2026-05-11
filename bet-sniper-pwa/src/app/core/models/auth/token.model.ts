export interface UserToken {
  require2fa: boolean;
  token: string;
}

export interface UserPayload {
  username: string;
  email: string;
  wallet: string;
  sub: string; // ID del usuario
  role: string; // 'customer', 'admin', etc.
  exp?: number; // Fecha de expiración
}
