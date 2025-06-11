import {ChangeDetectionStrategy, Component, OnInit, ViewEncapsulation} from '@angular/core';
import {CommonModule} from '@angular/common';
import {Router, RouterModule} from '@angular/router';
import {FormsModule} from '@angular/forms';
import {ReportProviderService} from '../../core/api/report-provider.service';
import {ReportProviderOutDto, ReportProviderSpecialty} from '../../core/models/report-provider-out-dto';
import {AuthService} from '../../core/auth/auth.service';

@Component({
  selector: 'app-report-provider-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './report-provider-list.component.html',
  styleUrl: './report-provider-list.component.css',
  encapsulation: ViewEncapsulation.Emulated,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ReportProviderListComponent implements OnInit {
  providers: ReportProviderOutDto[] = [];
  filteredProviders: ReportProviderOutDto[] = [];
  isLoading = true;
  errorMessage = '';
  searchTerm = '';
  selectedSpecialty: ReportProviderSpecialty | '' = '';
  isAdmin = false;
  confirmDeleteId: number | null = null;

  readonly specialtyLabels: Record<ReportProviderSpecialty, string> = {
    'cleaning': 'Limpieza',
    'maintenance': 'Mantenimiento',
    'security': 'Seguridad',
    'technology': 'Tecnología'
  };

  constructor(
    private providerService: ReportProviderService,
    private authService: AuthService,
    private router: Router
  ) {
  }

  ngOnInit(): void {
    // Verificar si el usuario es administrador
    this.isAdmin = this.authService.hasRole('ADMIN');
    if (!this.isAdmin) {
      this.router.navigate(['/']);
      return;
    }

    this.loadProviders();
  }

  loadProviders(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.providerService.getAll().subscribe({
      next: (data) => {
        this.providers = data;
        this.applyFilters();
        this.isLoading = false;
      },
      error: (error) => {
        this.errorMessage = 'Error al cargar los proveedores: ' + (error.message || 'Desconocido');
        this.isLoading = false;
        console.error('Error cargando proveedores', error);
      }
    });
  }

  applyFilters(): void {
    this.filteredProviders = this.providers.filter(provider => {
      // Filtro por término de búsqueda
      const matchesSearch = this.searchTerm === '' ||
        provider.providerName.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        provider.contactEmail.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        provider.phone.includes(this.searchTerm);

      // Filtro por especialidad
      const matchesSpecialty = this.selectedSpecialty === '' ||
        provider.specialty === this.selectedSpecialty;

      return matchesSearch && matchesSpecialty;
    });
  }

  onSearchChange(): void {
    this.applyFilters();
  }

  onSpecialtyChange(): void {
    this.applyFilters();
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.selectedSpecialty = '';
    this.applyFilters();
  }

  confirmDelete(id: number): void {
    this.confirmDeleteId = id;
  }

  cancelDelete(): void {
    this.confirmDeleteId = null;
  }

  deleteProvider(id: number): void {
    this.providerService.delete(id).subscribe({
      next: () => {
        this.confirmDeleteId = null;
        this.providers = this.providers.filter(provider => provider.providerId !== id);
        this.applyFilters();
      },
      error: (error) => {
        console.error('Error eliminando proveedor', error);
        this.errorMessage = 'Error al eliminar el proveedor: ' + (error.message || 'Desconocido');
      }
    });
  }

  getSpecialtyLabel(specialty: ReportProviderSpecialty): string {
    return this.specialtyLabels[specialty];
  }

  editProvider(id: number): void {
    this.router.navigate(['/report-providers', id, 'edit']);
  }

  viewProvider(id: number): void {
    this.router.navigate(['/report-providers', id]);
  }

  createProvider(): void {
    this.router.navigate(['/report-providers/new']);
  }

  refreshList(): void {
    this.loadProviders();
  }
}
