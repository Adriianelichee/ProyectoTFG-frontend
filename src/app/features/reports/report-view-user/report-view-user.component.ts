import {Component, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {Router} from '@angular/router';
import {ReportOutDto} from '../../../core/models/report-out-dto';
import {AuthService} from '../../../core/auth/auth.service';
import {ReportService} from '../../../core/api/report.service';

@Component({
  selector: 'app-report-view-user',
  templateUrl: './report-view-user.component.html',
  styleUrls: ['./report-view-user.component.css'],
  standalone: true,
  imports: [CommonModule, FormsModule]
})
export class ReportViewUserComponent implements OnInit {
  reports: ReportOutDto[] = [];
  filteredReports: ReportOutDto[] = [];
  searchTerm: string = '';
  loading = false;
  errorMessage: string | null = null;

  // Status para filtrar
  statusFilter: 'all' | 'pending' | 'in_progress' | 'resolved' = 'all';

  constructor(
    private reportService: ReportService,
    private router: Router,
    private authService: AuthService
  ) {
  }

  ngOnInit(): void {
    this.loadUserReports();
  }

  loadUserReports(): void {
    this.loading = true;
    this.errorMessage = null;

    const user = this.authService.getCurrentUser();
    if (!user) {
      this.errorMessage = 'No se puede identificar al usuario actual';
      this.loading = false;
      return;
    }

    this.reportService.getByUserId(user.userId).subscribe({
      next: (data) => {
        this.reports = data;
        this.applyFilters();
        this.loading = false;
      },
      error: (err) => {
        console.error('Error al cargar reportes:', err);
        this.errorMessage = 'No se pudieron cargar tus reportes';
        this.loading = false;
      }
    });
  }

  applyFilters(): void {
    let results = [...this.reports];

    // Filtrar por estado si no es 'all'
    if (this.statusFilter !== 'all') {
      results = results.filter(report => report.status === this.statusFilter);
    }

    // Filtrar por término de búsqueda
    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      results = results.filter(report =>
        report.description.toLowerCase().includes(term) ||
        report.reportId.toString().includes(term) ||
        report.reportDate.includes(term)
      );
    }

    this.filteredReports = results;
  }

  setStatusFilter(status: 'all' | 'pending' | 'in_progress' | 'resolved'): void {
    this.statusFilter = status;
    this.applyFilters();
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'pending':
        return 'status-pending';
      case 'in_progress':
        return 'status-progress';
      case 'resolved':
        return 'status-resolved';
      default:
        return '';
    }
  }

  getStatusText(status: string): string {
    switch (status) {
      case 'pending':
        return 'Pendiente';
      case 'in_progress':
        return 'En progreso';
      case 'resolved':
        return 'Resuelto';
      default:
        return status;
    }
  }

  viewReportDetails(reportId: number): void {
    void this.router.navigate([`/reports/${reportId}`]);
  }

  createNewReport(): void {
    void this.router.navigate(['/reports/new']);
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }
}
