import { ChangeDetectionStrategy, Component, OnInit, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ReportProviderOutDto, ReportProviderSpecialty } from '../../core/models/report-provider-out-dto';
import { ReportProviderService } from '../../core/api/report-provider.service';

@Component({
  selector: 'app-report-provider-details',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './report-provider-details.component.html',
  styleUrl: './report-provider-details.component.css',
  encapsulation: ViewEncapsulation.Emulated,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ReportProviderDetailsComponent implements OnInit {
  providerForm!: FormGroup;
  isEditMode = false;
  providerId?: number;
  isSubmitting = false;
  successMessage = '';
  errorMessage = '';

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private providerService: ReportProviderService
  ) {}

  ngOnInit(): void {
    this.initForm();

    // Verificar si es modo edición
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.isEditMode = true;
        this.providerId = +params['id'];
        this.loadProviderData(this.providerId);
      }
    });
  }

  get formControls() {
    return this.providerForm.controls;
  }

  initForm(): void {
    this.providerForm = this.fb.group({
      providerName: ['', [Validators.required, Validators.minLength(3)]],
      specialty: ['', [Validators.required]],
      phone: ['', [Validators.required, Validators.pattern(/^[0-9+\s-]{9,15}$/)]],
      contactEmail: ['', [Validators.required, Validators.email]],
      description: [''],
      serviceHours: ['']
    });
  }

  loadProviderData(id: number): void {
    this.providerService.getById(id).subscribe({
      next: (provider) => this.updateForm(provider),
      error: (err) => {
        this.errorMessage = 'No se pudo cargar la información del proveedor';
        console.error(err);
      }
    });
  }

  updateForm(provider: ReportProviderOutDto): void {
    this.providerForm.patchValue({
      providerName: provider.providerName,
      specialty: provider.specialty,
      phone: provider.phone,
      contactEmail: provider.contactEmail,

    });
  }

  onSubmit(): void {
    if (this.providerForm.invalid) {
      // Marcar todos los campos como tocados para mostrar errores
      Object.keys(this.formControls).forEach(key => {
        const control = this.providerForm.get(key);
        control?.markAsTouched();
      });
      return;
    }

    this.isSubmitting = true;
    this.successMessage = '';
    this.errorMessage = '';

    const providerData = {
      ...this.providerForm.value
    };

    if (this.isEditMode && this.providerId) {
      this.updateProvider(this.providerId, providerData);
    } else {
      this.createProvider(providerData);
    }
  }

  createProvider(data: any): void {
    this.providerService.create(data).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.successMessage = 'Proveedor registrado correctamente';
        this.providerForm.reset();

        // Redireccionar a la lista de proveedores después de un breve delay
        setTimeout(() => {
          this.router.navigate(['/report-providers']);
        }, 1500);
      },
      error: (err) => {
        this.isSubmitting = false;
        this.errorMessage = 'Error al registrar el proveedor: ' + (err.error?.message || 'Error desconocido');
        console.error(err);
      }
    });
  }

  updateProvider(id: number, data: any): void {
    this.providerService.update(id, data).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.successMessage = 'Proveedor actualizado correctamente';

        // Redireccionar a la lista de proveedores después de un breve delay
        setTimeout(() => {
          this.router.navigate(['/report-providers']);
        }, 1500);
      },
      error: (err) => {
        this.isSubmitting = false;
        this.errorMessage = 'Error al actualizar el proveedor: ' + (err.error?.message || 'Error desconocido');
        console.error(err);
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/report-providers']);
  }
}
