export interface CleaningInDto {
  userId: number;
  cleaningDate: string;
  notes: string;
  roomId: number | null;
  workstationId: number | null;
  floorId: number;
}
