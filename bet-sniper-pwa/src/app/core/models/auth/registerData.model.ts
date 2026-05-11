export interface RegisterData {
  fullname: string;
  username: string;
  email: string;
  password: string;
  referredBy?: string;
  acceptTerms?: boolean;
}
