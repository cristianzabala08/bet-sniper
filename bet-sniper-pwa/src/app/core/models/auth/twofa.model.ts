// Respuesta del endpoint GET /users/2fa/generate
export interface Generate2FAResponse {
  qrCodeUrl: string; // URL del QR en base64 o URL (cambiado de qrCode a qrCodeUrl)
  secret: string; // Secret para backup manual
  message?: string;
}

// Request para activar 2FA
export interface Activate2FARequest {
  code: string; // Código de 6 dígitos del authenticator
}

// Respuesta del endpoint POST /users/2fa/activate
export interface Activate2FAResponse {
  success: boolean;
  message: string;
}
