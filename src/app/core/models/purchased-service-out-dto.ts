export interface PurchasedServiceOutDto {
  purchasedServiceId: number;
  purchaseDate: string;
  expirationDate: string | null;
  companyId: number;
  serviceId: number;
}
