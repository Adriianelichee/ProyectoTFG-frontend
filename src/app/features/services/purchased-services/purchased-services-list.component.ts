import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { PurchasedServiceService } from '../../../core/api/purchased-service.service';
import { ServiceService } from '../../../core/api/service.service';
import { AuthService } from '../../../core/auth/auth.service';
import { PurchasedServiceOutDto } from '../../../core/models/purchased-service-out-dto';
import { ServiceOutDto } from '../../../core/models/service-out-dto';

@Component({
  selector: 'app-purchased-services-list',
  templateUrl: './purchased-services-list.component.html',
  styleUrls: ['./purchased-services-list.component.css'],
  standalone: true,
  imports: [CommonModule, FormsModule]
})
export class PurchasedServicesListComponent implements OnInit {
  purchasedServices: PurchasedServiceOutDto[] = [];
  filteredServices: PurchasedServiceOutDto[] = [];
  servicesMap: Map<number, ServiceOutDto> = new Map();
  searchTerm: string = '';
  loading = false;
  errorMessage: string | null = null;
  companyId: number = 0;
  activeFilter: 'all' | 'active' | 'expired' = 'all';

  constructor(
    private purchasedServiceService: PurchasedServiceService,
    private serviceService: ServiceService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    const user = this.authService.getCurrentUser();
    if (user && user.companyId) {
      this.companyId = user.companyId;
      this.loadPurchasedServices();
      this.loadServiceDetails();
    } else {
      this.errorMessage = 'No se pudo obtener la información de su compañía';
    }
  }

  loadPurchasedServices(): void {
    this.loading = true;
    this.errorMessage = null;

    this.purchasedServiceService.getByCompanyId(this.companyId).subscribe({
      next: (data) => {
        this.purchasedServices = data;
        this.applyFilters();
        this.loading = false;
      },
      error: (err) => {
        console.error('Error al cargar servicios contratados:', err);
        this.errorMessage = 'No se pudo cargar el listado de servicios contratados';
        this.loading = false;
      }
    });
  }

  loadServiceDetails(): void {
    this.serviceService.getAll().subscribe({
      next: (services) => {
        services.forEach(service => {
          this.servicesMap.set(service.serviceId, service);
        });
        this.applyFilters();
      },
      error: (err) => {
        console.error('Error al cargar detalles de servicios:', err);
      }
    });
  }

  applyFilters(): void {
    let filtered = [...this.purchasedServices];

    if (this.activeFilter === 'active') {
      filtered = filtered.filter(service => !this.isServiceExpired(service));
    } else if (this.activeFilter === 'expired') {
      filtered = filtered.filter(service => this.isServiceExpired(service));
    }

    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(service => {
        const serviceDetails = this.servicesMap.get(service.serviceId);
        return serviceDetails && (
          serviceDetails.serviceName.toLowerCase().includes(term) ||
          serviceDetails.description.toLowerCase().includes(term) ||
          service.purchasedServiceId.toString().includes(term)
        );
      });
    }

    this.filteredServices = filtered;
  }

  setFilter(filter: 'all' | 'active' | 'expired'): void {
    this.activeFilter = filter;
    this.applyFilters();
  }

  filterServices(): void {
    this.applyFilters();
  }

  isServiceExpired(service: PurchasedServiceOutDto): boolean {
    if (!service.expirationDate) return false;

    const today = new Date();
    const expirationDate = new Date(service.expirationDate);
    return today > expirationDate;
  }

  isServiceExpiringSoon(service: PurchasedServiceOutDto): boolean {
    if (!service.expirationDate) return false;

    const today = new Date();
    const expirationDate = new Date(service.expirationDate);

    const thirtyDaysInMs = 30 * 24 * 60 * 60 * 1000;
    return !this.isServiceExpired(service) &&
           (expirationDate.getTime() - today.getTime()) < thirtyDaysInMs;
  }

  getServiceStatusClass(service: PurchasedServiceOutDto): string {
    if (this.isServiceExpired(service)) return 'expired';
    if (this.isServiceExpiringSoon(service)) return 'expiring-soon';
    return 'active';
  }

  getServiceStatusText(service: PurchasedServiceOutDto): string {
    if (this.isServiceExpired(service)) return 'Expirado';
    if (this.isServiceExpiringSoon(service)) return 'Expira pronto';
    return 'Activo';
  }

  getServiceStatusIcon(service: PurchasedServiceOutDto): string {
    if (this.isServiceExpired(service)) return 'fas fa-exclamation-circle';
    if (this.isServiceExpiringSoon(service)) return 'fas fa-clock';
    return 'fas fa-check-circle';
  }

  getServiceName(serviceId: number): string {
    const service = this.servicesMap.get(serviceId);
    return service ? service.serviceName : `Servicio #${serviceId}`;
  }

  getServiceDescription(serviceId: number): string {
    const service = this.servicesMap.get(serviceId);
    return service ? service.description : 'Descripción no disponible';
  }

  getServicePrice(serviceId: number): number | null {
    const service = this.servicesMap.get(serviceId);
    return service ? service.price : null;
  }

  onContractService(): void {
    void this.router.navigate(['/services/purchased/new']);
  }

  onView(purchasedServiceId: number): void {
    void this.router.navigate([`/services/purchased/${purchasedServiceId}/view`]);
  }

  onEdit(purchasedServiceId: number): void {
    void this.router.navigate([`/services/purchased/${purchasedServiceId}`]);
  }
}
