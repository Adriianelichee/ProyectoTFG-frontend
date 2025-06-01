export type ReservationType = 'service' | 'workstation' | 'room';
export type ReservationStatus = 'pending' | 'confirmed' | 'canceled';

export interface ReservationOutDto {
  reservationId: number;
  userId: number;
  reservationType: ReservationType;
  startDate: string;         // string ISO
  endDate: string;           // string ISO
  status: ReservationStatus;
  depositPaymentId: number | null;
}
