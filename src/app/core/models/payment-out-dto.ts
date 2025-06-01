export type PaymentType = 'deposit' | 'subscription' | 'extra_service';
export type PaymentMethod = 'credit_card' | 'bank_transfer' | 'paypal';
export type PaymentStatus = 'pending' | 'completed' | 'refunded';

export interface PaymentOutDto {
  paymentId: number;
  companyId: number;
  amount: number;
  paymentType: PaymentType;
  paymentMethod: PaymentMethod;
  paymentDate: string;       // string ISO
  paymentStatus: PaymentStatus;
}
