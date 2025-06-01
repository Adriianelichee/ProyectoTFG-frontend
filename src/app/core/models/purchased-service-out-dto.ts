export interface PurchasedServiceOutDto {
  purchasedServiceId: number;
  purchaseDate: string;      // string ISO
  expirationDate: string | null;
  companyId: number;
  serviceId: number;
}
