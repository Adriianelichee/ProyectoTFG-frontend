export interface DetailReservationRoomOutDto {
  detailId: number;
  reservationId: number;
  roomId: number;
  startTime: string;         // string ISO
  endTime: string;           // string ISO
}
