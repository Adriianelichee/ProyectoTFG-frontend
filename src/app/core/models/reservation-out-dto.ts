export type ReservationType = 'service' | 'workstation' | 'room';
export type ReservationStatus = 'pending' | 'confirmed' | 'canceled';

export interface ReservationOutDto {
  reservationId: number;
  userId: number;
  reservationType: ReservationType;
  startDate: string;
  endDate: string;
  status: ReservationStatus;
  depositPaymentId: number | null;
}
