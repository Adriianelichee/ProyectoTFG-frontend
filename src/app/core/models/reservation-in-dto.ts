export type ReservationType = 'service' | 'workstation' | 'room';
export type ReservationStatus = 'pending' | 'confirmed' | 'canceled';

export interface ReservationInDto {
  userId: number;
  reservationType: ReservationType;
  startDate: string;
  endDate: string;
  status: ReservationStatus;
  depositPaymentId: number | null;
}
