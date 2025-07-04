export type ReportStatus = 'pending' | 'in_progress' | 'resolved';

export interface ReportOutDto {
  reportId: number;
  userId: number;
  description: string;
  status: ReportStatus;
  reportDate: string;        // string ISO
  assignedManagerId: number;
  workstationId: number | null;
  roomId: number | null;
  floorId: number;
}
