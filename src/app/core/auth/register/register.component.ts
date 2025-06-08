import {Component, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {ReactiveFormsModule, FormBuilder, FormGroup, Validators} from '@angular/forms';
import {AuthService} from '../auth.service';
import {Router} from '@angular/router';
import {CompanyService} from '../../api/company.service';
import {CompanyOutDto} from '../../models/company-out-dto';
import {ReportProviderService} from '../../api/report-provider.service';
import {ReportProviderOutDto} from '../../models/report-provider-out-dto';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css'],
})
export class RegisterComponent implements OnInit {
  registerForm: FormGroup;
  loading = false;
  errorMessage: string | null = null;
  showPassword = false;
  companies: CompanyOutDto[] = [];
  providers: ReportProviderOutDto[] = [];
  registrationSuccess = false;

  roles = [
    {value: 'client', label: 'Cliente'},
    {value: 'admin', label: 'Admin'},
    {value: 'report_provider_manager', label: 'Gestor Proveedores'},
    {value: 'secretary', label: 'Secretario'},
  ];

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private companyService: CompanyService,
    private providerService: ReportProviderService
  ) {
    this.registerForm = this.fb.group({
      firstName: ['', [Validators.required, Validators.maxLength(45)]],
      lastName: ['', [Validators.required, Validators.maxLength(45)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      phone: ['', [Validators.required, Validators.maxLength(20)]],
      role: ['', Validators.required],
      companyId: [null, Validators.required],
      providerId: [null],
    });
  }

  ngOnInit(): void {
    this.checkAdminAccess();
    this.loadCompanies();
    this.loadProviders();

    this.roleControl.valueChanges.subscribe(role => {
      this.updateFormBasedOnRole(role);
    });
  }

  // Verificar que solo los administradores puedan acceder
  checkAdminAccess(): void {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser || currentUser.role !== 'admin') {
      this.router.navigate(['/home']);
      this.errorMessage = 'Solo los administradores pueden registrar nuevos usuarios';
    }
  }

  updateFormBasedOnRole(role: string): void {
    // Resetear validadores
    this.companyIdControl.clearValidators();
    this.providerIdControl.clearValidators();

    // Resetear valores
    this.companyIdControl.setValue(null);
    this.providerIdControl.setValue(null);

    switch (role) {
      case 'client':
        this.companyIdControl.setValidators([Validators.required]);
        break;
      case 'admin':
        this.companyIdControl.setValue(1);
        break;
      case 'report_provider_manager':
        this.providerIdControl.setValidators([Validators.required]);
        break;
      case 'secretary':
        this.companyIdControl.setValue(1);
        break;
    }

    this.companyIdControl.updateValueAndValidity();
    this.providerIdControl.updateValueAndValidity();
  }

  loadProviders(): void {
    this.providerService.getAll().subscribe({
      next: (providers) => {
        this.providers = providers;
      },
      error: (err) => {
        console.error('Error al cargar proveedores:', err);
        this.errorMessage = 'No se pudieron cargar los proveedores. Por favor, inténtalo de nuevo.';
      }
    });
  }

  loadCompanies(): void {
    this.companyService.getAll().subscribe({
      next: (companies) => {
        this.companies = companies;
      },
      error: (err) => {
        console.error('Error al cargar empresas:', err);
        this.errorMessage = 'No se pudieron cargar las empresas. Por favor, inténtalo de nuevo.';
      }
    });
  }

  onSubmit(): void {
    if (this.registerForm.invalid) {
      return;
    }

    this.loading = true;
    this.errorMessage = null;

    const userData = {...this.registerForm.value};

    if (userData.companyId) {
      userData.companyId = Number(userData.companyId);
    }

    if (userData.providerId) {
      userData.providerId = Number(userData.providerId);
    }

    if (userData.role === 'admin' || userData.role === 'secretary') {
      userData.companyId = 1;
    }

    if (userData.role !== 'report_provider_manager') {
      delete userData.providerId;
    }

    if (userData.role === 'report_provider_manager') {
      delete userData.companyId;
    }

    this.authService.register(userData).subscribe({
      next: () => {
        this.loading = false;
        this.registrationSuccess = true;
        this.resetForm();
        // No redirigimos al login para mantener la sesión actual
      },
      error: (err: any) => {
        console.error('Error al registrarse:', err);
        this.errorMessage = 'No se pudo completar el registro';
        this.loading = false;
      },
    });
  }

  resetForm(): void {
    this.registerForm.reset();
    // Establecer valores predeterminados después del registro exitoso
    setTimeout(() => {
      this.registrationSuccess = false;
    }, 3000);
  }

  get firstNameControl() {
    return this.registerForm.get('firstName')!;
  }

  get lastNameControl() {
    return this.registerForm.get('lastName')!;
  }

  get emailControl() {
    return this.registerForm.get('email')!;
  }

  get passwordControl() {
    return this.registerForm.get('password')!;
  }

  get phoneControl() {
    return this.registerForm.get('phone')!;
  }

  get roleControl() {
    return this.registerForm.get('role')!;
  }

  get companyIdControl() {
    return this.registerForm.get('companyId')!;
  }

  get providerIdControl() {
    return this.registerForm.get('providerId')!;
  }

  shouldShowCompanySelector(): boolean {
    return this.roleControl.value === 'client';
  }

  shouldShowProviderSelector(): boolean {
    return this.roleControl.value === 'report_provider_manager';
  }
}
