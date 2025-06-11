import {Component, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {ReactiveFormsModule, FormBuilder, FormGroup, Validators} from '@angular/forms';
import {CompanyService} from '../../core/api/company.service';
import {ActivatedRoute, Router} from '@angular/router';
import {CompanyInDto} from '../../core/models/company-in-dto';
import {CompanyOutDto} from '../../core/models/company-out-dto';
import {AuthService} from '../../core/auth/auth.service';

@Component({
  selector: 'app-companies-detail',
  templateUrl: './companies-detail.component.html',
  styleUrls: ['./companies-detail.component.css'],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule]
})
export class CompaniesDetailComponent implements OnInit {
  companyForm!: FormGroup;
  companyId?: number;
  isEdit = false;
  loading = false;
  errorMessage: string | null = null;
  canEdit = false;

  constructor(
    private fb: FormBuilder,
    private companyService: CompanyService,
    private route: ActivatedRoute,
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

    this.companyForm = this.fb.group({
      companyName: ['', [Validators.required, Validators.maxLength(45)]],
      address: ['', [Validators.required, Validators.maxLength(100)]],
      phone: ['', [Validators.required, Validators.maxLength(20)]],
      contactEmail: ['', [Validators.required, Validators.email, Validators.maxLength(100)]]
    });

    this.route.paramMap.subscribe((params) => {
      const idParam = params.get('id');
      if (idParam) {
        this.companyId = Number(idParam);
        this.isEdit = true;
        this.loadCompany(this.companyId);
      }
    });
  }

  private loadCompany(id: number): void {
    this.loading = true;
    this.errorMessage = null;

    this.companyService.getById(id).subscribe({
      next: (data: CompanyOutDto) => {
        this.companyForm.patchValue({
          companyName: data.companyName,
          address: data.address,
          phone: data.phone,
          contactEmail: data.contactEmail
        });
        this.loading = false;
      },
      error: (err) => {
        console.error('Error cargando empresa:', err);
        this.errorMessage = 'No se pudo cargar los datos de la empresa';
        this.loading = false;
      }
    });
  }

  onSubmit(): void {
    if (this.companyForm.invalid) return;

    this.errorMessage = null;
    const dto: CompanyInDto = {
      companyName: this.companyForm.value.companyName,
      address: this.companyForm.value.address,
      phone: this.companyForm.value.phone,
      contactEmail: this.companyForm.value.contactEmail
    };

    if (this.isEdit && this.companyId != null) {
      this.companyService.update(this.companyId, dto).subscribe({
        next: () => this.router.navigate(['/companies']),
        error: (err) => {
          console.error('Error al actualizar empresa:', err);
          this.errorMessage = 'Error al actualizar la empresa';
        }
      });
    } else {
      this.companyService.create(dto).subscribe({
        next: () => this.router.navigate(['/companies']),
        error: (err) => {
          console.error('Error al crear empresa:', err);
          this.errorMessage = 'Error al crear la empresa';
        }
      });
    }
  }

  onCancel(): void {
    void this.router.navigate(['/companies']);
  }

  get companyNameControl() {
    return this.companyForm.get('companyName')!;
  }

  get addressControl() {
    return this.companyForm.get('address')!;
  }

  get phoneControl() {
    return this.companyForm.get('phone')!;
  }

  get contactEmailControl() {
    return this.companyForm.get('contactEmail')!;
  }
}
