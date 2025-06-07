export type ReportStatus = 'pending' | 'in_progress' | 'resolved';

export interface ReportInDto {
  userId: number;
  description: string;
  status: ReportStatus;
  reportDate: string;
  assignedManagerId: number;
  workstationId: number | null;
  roomId: number | null;
  floorId: number;
}
