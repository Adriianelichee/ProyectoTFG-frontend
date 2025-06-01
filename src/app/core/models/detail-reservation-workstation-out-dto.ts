export interface DetailReservationWorkstationOutDto {
  detailId: number;
  reservationId: number;
  workstationId: number;
  startTime: string;         // string ISO
  endTime: string;           // string ISO
}
