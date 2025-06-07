export type ReportProviderSpecialty = 'cleaning' | 'maintenance' | 'security' | 'technology';

export interface ReportProviderInDto {
  providerName: string;
  specialty: ReportProviderSpecialty;
  phone: string;
  contactEmail: string;
}
