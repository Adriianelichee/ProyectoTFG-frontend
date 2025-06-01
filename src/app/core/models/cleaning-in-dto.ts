export interface CleaningInDto {
  userId: number;
  cleaningDate: string;
  notes: string | null;
  roomId: number | null;
  workstationId: number | null;
  floorId: number;
}
