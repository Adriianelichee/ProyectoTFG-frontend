export type ReportProviderSpecialty = 'cleaning' | 'maintenance' | 'security' | 'technology';

export interface ReportProviderOutDto {
  providerId: number;
  providerName: string;
  specialty: ReportProviderSpecialty;
  phone: string;
  contactEmail: string;
}
