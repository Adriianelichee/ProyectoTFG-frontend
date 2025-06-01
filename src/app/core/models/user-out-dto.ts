export type UserRole = 'client' | 'admin' | 'report_provider_manager' | 'secretary';

export interface UserOutDto {
  userId: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: UserRole;
  companyId: number;
  providerId: number | null;
}
