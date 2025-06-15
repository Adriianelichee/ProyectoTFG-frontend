import { ChangeDetectionStrategy, Component, ViewEncapsulation, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { ReportService } from '../../../core/api/report.service';
import { AuthService } from '../../../core/auth/auth.service';
import { ReportOutDto, ReportStatus } from '../../../core/models/report-out-dto';
import { UserService } from '../../../core/api/user.service';
import { FloorService } from '../../../core/api/floor.service';
import { RoomService } from '../../../core/api/room.service';
import { WorkstationService } from '../../../core/api/workstation.service';
import { ReportProviderService } from '../../../core/api/report-provider.service';
import { finalize } from 'rxjs';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-report-view',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule],
  templateUrl: './report-view.component.html',
  styleUrl: './report-view.component.css',
  encapsulation: ViewEncapsulation.Emulated,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ReportViewComponent implements OnInit {
  report: ReportOutDto | null = null;
  isLoading = true;
  errorMessage = '';
  reporterName = '';
  floorName = '';
  roomName = '';
  workstationName = '';
  managerName = '';

  statusForm: FormGroup;
  assignManagerForm: FormGroup;
  showStatusDropdown = false;

  statusLabels: { [key in ReportStatus]: string } = {
    'pending': 'Pendiente',
    'in_progress': 'En progreso',
    'resolved': 'Resuelto'
  };

  statusClasses: { [key in ReportStatus]: string } = {
    'pending': 'status-pending',
    'in_progress': 'status-in-progress',
    'resolved': 'status-resolved'
  };

  isAdmin = false;
  isSecretary = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private reportService: ReportService,
    private authService: AuthService,
    private userService: UserService,
    private floorService: FloorService,
    private roomService: RoomService,
    private workstationService: WorkstationService,
    private reportProviderService: ReportProviderService,
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef
  ) {
    this.statusForm = this.fb.group({
      status: ['pending']
    });

    this.assignManagerForm = this.fb.group({
      managerId: [null]
    });
  }

  ngOnInit(): void {
    const userRole = this.authService.getUserRole();
    this.isAdmin = userRole === 'admin';
    this.isSecretary = userRole === 'secretary';

    if (!this.isAdmin && !this.isSecretary) {
      this.router.navigate(['/reports']);
      return;
    }

    this.route.paramMap.subscribe(params => {
      const reportId = Number(params.get('id'));
      if (reportId) {
        this.loadReport(reportId);
      } else {
        this.errorMessage = 'ID de reporte no válido';
        this.isLoading = false;
        this.cdr.markForCheck();
      }
    });
  }

  loadReport(reportId: number): void {
    this.isLoading = true;

    this.reportService.getById(reportId).pipe(
      finalize(() => {
        this.isLoading = false;
        this.cdr.markForCheck();
      })
    ).subscribe({
      next: (report) => {
        this.report = report;

        this.loadReporterInfo(report.userId);
        this.loadLocationInfo(report.floorId, report.roomId, report.workstationId);
        this.loadManagerInfo(report.assignedManagerId);

        this.statusForm.get('status')?.setValue(report.status);
      },
      error: (error) => {
        this.errorMessage = `Error al cargar el reporte: ${error.message || 'Error desconocido'}`;
      }
    });
  }

  loadReporterInfo(userId: number): void {
    this.userService.getById(userId).subscribe({
      next: (user) => {
        this.reporterName = `${user.firstName} ${user.lastName}`;
        this.cdr.markForCheck();
      },
      error: () => {
        this.reporterName = `Usuario ID: ${userId}`;
        this.cdr.markForCheck();
      }
    });
  }

  loadLocationInfo(floorId: number, roomId: number | null, workstationId: number | null): void {
    this.floorService.getById(floorId).subscribe({
      next: (floor) => {
        this.floorName = floor.floorName;
        this.cdr.markForCheck();
      }
    });

    if (roomId) {
      this.roomService.getById(roomId).subscribe({
        next: (room) => {
          this.roomName = room.roomName;
          this.cdr.markForCheck();
        }
      });
    }

    if (workstationId) {
      this.workstationService.getById(workstationId).subscribe({
        next: (workstation) => {
          this.workstationName = `Estación ${workstation.workstationId}`;
          this.cdr.markForCheck();
        }
      });
    }
  }

  loadManagerInfo(managerId: number): void {
    if (managerId) {
      this.userService.getById(managerId).subscribe({
        next: (user) => {
          this.managerName = `${user.firstName} ${user.lastName}`;
          this.cdr.markForCheck();
        },
        error: () => {
          this.managerName = `Gerente ID: ${managerId}`;
          this.cdr.markForCheck();
        }
      });
    } else {
      this.managerName = 'Sin asignar';
      this.cdr.markForCheck();
    }
  }

  updateStatus(status: ReportStatus): void {
    if (!this.report || this.report.status === status) {
      return;
    }

    this.isLoading = true;
    this.reportService.updateStatus(this.report.reportId, status).pipe(
      finalize(() => {
        this.isLoading = false;
        this.showStatusDropdown = false;
        this.cdr.markForCheck();
      })
    ).subscribe({
      next: (updatedReport) => {
        this.report = updatedReport;
        this.statusForm.get('status')?.setValue(updatedReport.status);
      },
      error: (error) => {
        this.errorMessage = `Error al actualizar el estado: ${error.message || 'Error desconocido'}`;
      }
    });
  }

  toggleStatusDropdown(): void {
    this.showStatusDropdown = !this.showStatusDropdown;
    this.cdr.markForCheck();
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  }
}
