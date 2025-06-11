import {ChangeDetectionStrategy, Component, OnInit, ViewEncapsulation, ChangeDetectorRef} from '@angular/core';
import {CommonModule} from '@angular/common';
import {RouterModule} from '@angular/router';
import {ReactiveFormsModule, FormBuilder, FormGroup} from '@angular/forms';
import {ReportService} from '../../core/api/report.service';
import {ReportProviderService} from '../../core/api/report-provider.service';
import {ReportOutDto, ReportStatus} from '../../core/models/report-out-dto';
import {ReportProviderOutDto, ReportProviderSpecialty} from '../../core/models/report-provider-out-dto';
import {AuthService} from '../../core/auth/auth.service';
import {finalize} from 'rxjs';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule],
  templateUrl: './reports.component.html',
  styleUrls: ['./reports.component.css'],
  encapsulation: ViewEncapsulation.Emulated,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ReportsComponent implements OnInit {
  reports: ReportOutDto[] = [];
  filteredReports: ReportOutDto[] = [];
  providers: ReportProviderOutDto[] = [];

  isLoading = false;
  errorMessage = '';

  filterForm!: FormGroup;

  // Mapeo de categorías a especialidades de proveedores
  specialtyMapping: { [key: string]: ReportProviderSpecialty } = {
    'maintenance': 'maintenance',
    'cleaning': 'cleaning',
    'security': 'security',
    'technology': 'technology',
    'general': 'maintenance' // Por defecto asignamos general a mantenimiento
  };

  // Para mostrar estados en español
  statusLabels: { [key in ReportStatus]: string } = {
    'pending': 'Pendiente',
    'in_progress': 'En progreso',
    'resolved': 'Resuelto'
  };

  // Para colorear los estados
  statusClasses: { [key in ReportStatus]: string } = {
    'pending': 'status-pending',
    'in_progress': 'status-in-progress',
    'resolved': 'status-resolved'
  };

  // Para traducir categorías
  categoryLabels: { [key: string]: string } = {
    'maintenance': 'Mantenimiento',
    'cleaning': 'Limpieza',
    'security': 'Seguridad',
    'technology': 'Tecnología',
    'general': 'General'
  };

  constructor(
    private reportService: ReportService,
    private providerService: ReportProviderService,
    private authService: AuthService,
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef
  ) {
  }

  ngOnInit(): void {
    this.createFilterForm();
    this.loadReports();
    this.loadProviders();

    // Suscribirse a cambios en los filtros
    this.filterForm.valueChanges.subscribe(() => {
      this.applyFilters();
    });
  }

  createFilterForm(): void {
    this.filterForm = this.fb.group({
      specialty: [''],
      status: ['']
    });
  }

  loadReports(): void {
    this.isLoading = true;
    this.errorMessage = '';

    const userInfo = this.authService.getCurrentUser();
    const userRole = this.authService.getUserRole();

    this.reportService.getAll().pipe(
      finalize(() => {
        this.isLoading = false;
        this.cdr.markForCheck();
      })
    ).subscribe({
      next: (reports) => {
        // Si es cliente, filtrar solo sus reportes
        if (userRole === 'CLIENT' && userInfo) {
          this.reports = reports.filter(report => report.userId === userInfo.userId);
        } else {
          this.reports = reports;
        }
        this.filteredReports = [...this.reports];
        this.applyFilters();
      },
      error: (error) => {
        this.errorMessage = 'Error al cargar los reportes: ' + (error.message || 'Error desconocido');
        console.error('Error cargando reportes:', error);
      }
    });
  }

  loadProviders(): void {
    this.providerService.getAll().subscribe({
      next: (providers) => {
        this.providers = providers;
      },
      error: (error) => {
        console.error('Error cargando proveedores:', error);
      }
    });
  }

  applyFilters(): void {
    const {specialty, status} = this.filterForm.value;

    this.filteredReports = this.reports.filter(report => {
      // Solo filtrar por estado si está seleccionado
      if (status && report.status !== status) {
        return false;
      }

      return true;
    });

    this.cdr.markForCheck();
  }

  resetFilters(): void {
    this.filterForm.reset({
      specialty: '',
      status: ''
    });
    this.filteredReports = [...this.reports];
  }

  // Para mostrar los proveedores relacionados con un reporte específico
  getMatchingProviders(report: ReportOutDto): ReportProviderOutDto[] {
    // Devolver todos los proveedores sin filtrar por categoría
    return this.providers;
  }

  // Formatear fecha en español
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
