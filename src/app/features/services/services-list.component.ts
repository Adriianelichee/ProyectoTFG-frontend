import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ServiceService } from '../../core/api/service.service';
import { ServiceOutDto } from '../../core/models/service-out-dto';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'app-services-list',
  templateUrl: './services-list.component.html',
  styleUrls: ['./services-list.component.css'],
  standalone: true,
  imports: [CommonModule, FormsModule]
})
export class ServicesListComponent implements OnInit {
  services: ServiceOutDto[] = [];
  filteredServices: ServiceOutDto[] = [];
  searchTerm: string = '';
  loading = false;
  errorMessage: string | null = null;

  constructor(
    private serviceService: ServiceService,
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.loadServices();
  }

  hasAdminAccess(): boolean {
    return this.authService.hasRole('admin') || this.authService.hasRole('secretary');
  }

  loadServices(): void {
    this.loading = true;
    this.errorMessage = null;
    this.serviceService.getAll().subscribe({
      next: (data) => {
        this.services = data;
        this.filteredServices = [...this.services];
        this.loading = false;
      },
      error: (err) => {
        console.error('Error al cargar servicios:', err);
        this.errorMessage = 'No se pudo cargar el listado de servicios';
        this.loading = false;
      }
    });
  }

  filterServices(): void {
    if (!this.searchTerm) {
      this.filteredServices = [...this.services];
      return;
    }

    const term = this.searchTerm.toLowerCase();
    this.filteredServices = this.services.filter(service =>
      service.serviceName.toLowerCase().includes(term) ||
      service.description.toLowerCase().includes(term) ||
      service.price.toString().includes(term)
    );
  }

  onCreate(): void {
    void this.router.navigate(['/services/new']);
  }

  onView(serviceId: number): void {
    void this.router.navigate([`/services/${serviceId}/view`]);
  }

  onEdit(serviceId: number): void {
    void this.router.navigate([`/services/${serviceId}`]);
  }

  onDelete(serviceId: number): void {
    if (!confirm('¿Estás seguro de eliminar este servicio?')) return;
    this.serviceService.delete(serviceId).subscribe({
      next: () => this.loadServices(),
      error: (err) => {
        console.error('Error al eliminar servicio:', err);
        alert('No se pudo eliminar el servicio');
      }
    });
  }
}
