import {Component, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {CompanyService} from '../../core/api/company.service';
import {CompanyOutDto} from '../../core/models/company-out-dto';
import {Router} from '@angular/router';
import {AuthService} from '../../core/auth/auth.service';

@Component({
  selector: 'app-companies-list',
  templateUrl: './companies-list.component.html',
  styleUrls: ['./companies-list.component.css'],
  standalone: true,
  imports: [CommonModule]
})
export class CompaniesListComponent implements OnInit {
  companies: CompanyOutDto[] = [];
  loading = false;
  errorMessage: string | null = null;
  canEdit = false;

  constructor(
    private companyService: CompanyService,
    private router: Router,
    private authService: AuthService
  ) {
  }

    ngOnInit(): void {
    const user = this.authService.getCurrentUser();
    this.canEdit = !!user && (user.role === 'admin' || user.role === 'secretary');
    if (!this.canEdit) {
      this.router.navigate(['/']);
      return;
    }
    this.loadCompanies();
  }

  loadCompanies(): void {
    this.loading = true;
    this.errorMessage = null;
    this.companyService.getAll().subscribe({
      next: (data) => {
        this.companies = data;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error al cargar empresas:', err);
        this.errorMessage = 'No se pudo cargar el listado de empresas';
        this.loading = false;
      }
    });
  }

  onCreate(): void {
    if (this.canEdit) {
      void this.router.navigate(['/companies/new']);
    }
  }

  onEdit(companyId: number): void {
    if (this.canEdit) {
      void this.router.navigate([`/companies/${companyId}`]);
    }
  }

  onDelete(companyId: number): void {
    if (!this.canEdit) return;
    if (!confirm('¿Estás seguro de eliminar esta empresa?')) return;
    this.companyService.delete(companyId).subscribe({
      next: () => this.loadCompanies(),
      error: (err) => {
        console.error('Error al eliminar empresa:', err);
        alert('No se pudo eliminar la empresa');
      }
    });
  }
}
