import {Component, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
  AbstractControl,
  ValidationErrors
} from '@angular/forms';
import {Router, ActivatedRoute} from '@angular/router';
import {ServiceService} from '../../../core/api/service.service';
import {PurchasedServiceService} from '../../../core/api/purchased-service.service';
import {CompanyService} from '../../../core/api/company.service';
import {AuthService} from '../../../core/auth/auth.service';
import {ServiceOutDto} from '../../../core/models/service-out-dto';
import {PurchasedServiceInDto} from '../../../core/models/purchased-service-in-dto';
import {PurchasedServiceOutDto} from '../../../core/models/purchased-service-out-dto';
import {format} from 'date-fns';

@Component({
  selector: 'app-purchased-services-detail',
  templateUrl: './purchased-services-detail.component.html',
  styleUrls: ['./purchased-services-detail.component.css'],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule]
})
export class PurchasedServicesDetailComponent implements OnInit {
  purchaseForm!: FormGroup;
  purchasedServiceId?: number;
  isEdit = false;
  loading = false;
  errorMessage: string | null = null;
  availableServices: ServiceOutDto[] = [];
  selectedService: ServiceOutDto | null = null;
  companyId: number = 0;
  companyName: string = '';
  minDate: string = '';
  minExpirationDate: string = '';

  constructor(
    private fb: FormBuilder,
    private serviceService: ServiceService,
    private purchasedServiceService: PurchasedServiceService,
    private companyService: CompanyService,
    private authService: AuthService,
    private route: ActivatedRoute,
    private router: Router
  ) {
    // Establecer la fecha mínima como hoy en formato YYYY-MM-DD
    this.minDate = format(new Date(), 'yyyy-MM-dd');
    this.minExpirationDate = this.minDate;
  }

  ngOnInit(): void {
    this.initForm();
    this.loadUserCompanyInfo();
    this.loadAvailableServices();

    this.route.paramMap.subscribe((params) => {
      const idParam = params.get('id');
      if (idParam) {
        this.purchasedServiceId = Number(idParam);
        this.isEdit = true;
        this.loadPurchasedService(this.purchasedServiceId);
      }
    });

    // Escuchar cambios en la fecha de compra para actualizar validaciones
    this.purchaseDateControl.valueChanges.subscribe(value => {
      if (value) {
        this.minExpirationDate = value;
        this.expirationDateControl.updateValueAndValidity();
      }
    });

    // Escuchar cambios en la selección de servicio
    this.serviceIdControl.valueChanges.subscribe(serviceId => {
      if (serviceId) {
        this.selectedService = this.availableServices.find(s => s.serviceId === +serviceId) || null;
      } else {
        this.selectedService = null;
      }
    });
  }

  // Validador personalizado para la fecha de expiración
  private expirationDateValidator(control: AbstractControl): ValidationErrors | null {
    const form = control.parent;
    if (!form) return null;

    const purchaseDate = form.get('purchaseDate')?.value;
    const expirationDate = control.value;

    if (!expirationDate) return null; // No es obligatorio

    if (!purchaseDate) return null; // No podemos validar sin fecha de compra

    return expirationDate < purchaseDate ?
      {'expirationBeforePurchase': 'La fecha de expiración no puede ser anterior a la fecha de compra'} :
      null;
  }

  private initForm(): void {
    this.purchaseForm = this.fb.group({
      serviceId: ['', [Validators.required]],
      purchaseDate: [format(new Date(), 'yyyy-MM-dd'), [
        Validators.required,
        this.dateNotInPastValidator
      ]],
      expirationDate: ['', [
        this.expirationDateValidator
      ]],
      termsAccepted: [false, Validators.requiredTrue]
    });
  }

  // Validador para evitar fechas en el pasado
  private dateNotInPastValidator(control: AbstractControl): ValidationErrors | null {
    if (!control.value) return null;

    const inputDate = new Date(control.value);
    inputDate.setHours(0, 0, 0, 0);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return inputDate < today ?
      {'dateInPast': 'La fecha no puede estar en el pasado'} :
      null;
  }

  private loadUserCompanyInfo(): void {
    const user = this.authService.getCurrentUser();
    if (user && user.companyId) {
      this.companyId = user.companyId;
      this.companyService.getById(this.companyId).subscribe({
        next: (company) => {
          this.companyName = company.companyName;
        },
        error: (err) => {
          console.error('Error cargando información de la compañía:', err);
          this.companyName = `Compañía #${this.companyId}`;
        }
      });
    } else {
      this.errorMessage = 'No se pudo obtener la información de su compañía';
    }
  }

  private loadAvailableServices(): void {
    this.loading = true;
    this.serviceService.getAll().subscribe({
      next: (services) => {
        this.availableServices = services;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error cargando servicios disponibles:', err);
        this.errorMessage = 'No se pudieron cargar los servicios disponibles';
        this.loading = false;
      }
    });
  }

  private loadPurchasedService(id: number): void {
    this.loading = true;
    this.errorMessage = null;

    this.purchasedServiceService.getById(id).subscribe({
      next: (data: PurchasedServiceOutDto) => {
        // Verificar que el servicio adquirido pertenece a la compañía del usuario
        if (data.companyId !== this.companyId) {
          this.errorMessage = 'No tiene permisos para editar este servicio adquirido';
          this.router.navigate(['/home']);
          return;
        }

        // Formatear las fechas para el formato YYYY-MM-DD que espera el input type="date"
        const purchaseDate = data.purchaseDate ? format(new Date(data.purchaseDate), 'yyyy-MM-dd') : '';
        const expirationDate = data.expirationDate ? format(new Date(data.expirationDate), 'yyyy-MM-dd') : '';

        this.purchaseForm.patchValue({
          serviceId: data.serviceId,
          purchaseDate: purchaseDate,
          expirationDate: expirationDate,
          termsAccepted: true
        });

        if (purchaseDate) {
          this.minExpirationDate = purchaseDate;
        }

        this.serviceIdControl.disable();

        this.loading = false;
      },
      error: (err) => {
        console.error('Error cargando servicio adquirido:', err);
        this.errorMessage = 'No se pudo cargar los datos del servicio adquirido';
        this.loading = false;
      }
    });
  }

  onSubmit(): void {
    this.markFormGroupTouched(this.purchaseForm);

    if (this.purchaseForm.invalid) {
      this.errorMessage = 'Por favor, corrija los errores del formulario antes de continuar.';
      return;
    }

    this.errorMessage = null;

    // Ajustar las fechas para compensar la diferencia de zona horaria
    const purchaseDate = this.purchaseDateControl.value ?
      this.adjustDateForTimezone(this.purchaseDateControl.value, '00:00:00') : "";

    const expirationDate = this.expirationDateControl.value ?
      this.adjustDateForTimezone(this.expirationDateControl.value, '23:59:59') : "";

    const dto: PurchasedServiceInDto = {
      purchaseDate: purchaseDate,
      expirationDate: expirationDate,
      companyId: this.companyId,
      serviceId: +this.serviceIdControl.value
    };

    if (this.isEdit && this.purchasedServiceId != null) {
      this.purchasedServiceService.update(this.purchasedServiceId, dto).subscribe({
        next: () => {
          this.router.navigate(['/services/purchased']);
        },
        error: (err) => {
          console.error('Error al actualizar servicio adquirido:', err);
          this.errorMessage = 'Error al actualizar el servicio adquirido';
        }
      });
    } else {
      this.purchasedServiceService.create(dto).subscribe({
        next: () => {
          this.router.navigate(['/services/purchased']);
        },
        error: (err) => {
          console.error('Error al contratar servicio:', err);
          this.errorMessage = 'Error al contratar el servicio';
        }
      });
    }
  }

  // Marcar todos los campos como touched para mostrar errores
  private markFormGroupTouched(formGroup: FormGroup) {
    Object.values(formGroup.controls).forEach(control => {
      control.markAsTouched();
      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }

  private adjustDateForTimezone(dateStr: string, timeStr: string): string {
    // Crear fecha con la hora especificada
    const date = new Date(`${dateStr}T${timeStr}`);

    // Obtener el offset de la zona horaria local en minutos
    const timezoneOffset = date.getTimezoneOffset();

    // Ajustar la fecha sumando el offset (en milisegundos)
    date.setMinutes(date.getMinutes() - timezoneOffset);

    return date.toISOString();
  }

  onCancel(): void {
    void this.router.navigate(['/services/purchased']);
  }

  // Getters para el template
  get serviceIdControl() {
    return this.purchaseForm.get('serviceId')!;
  }

  get purchaseDateControl() {
    return this.purchaseForm.get('purchaseDate')!;
  }

  get expirationDateControl() {
    return this.purchaseForm.get('expirationDate')!;
  }

  get termsAcceptedControl() {
    return this.purchaseForm.get('termsAccepted')!;
  }

  // Métodos para verificar errores específicos
  hasExpirationDateError(): boolean {
    return this.expirationDateControl.touched &&
      this.expirationDateControl.errors?.['expirationBeforePurchase'] !== undefined;
  }

  hasDateInPastError(): boolean {
    return this.purchaseDateControl.touched &&
      this.purchaseDateControl.errors?.['dateInPast'] !== undefined;
  }
}
