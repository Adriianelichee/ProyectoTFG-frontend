export type UserRole = 'client' | 'admin' | 'report_provider_manager' | 'secretary';

export interface UserInDto {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone: string;
  role: UserRole;
  companyId: number;
  providerId: number | null;
}
