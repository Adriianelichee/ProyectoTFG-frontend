import {Component, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {ReactiveFormsModule, FormBuilder, FormGroup, Validators} from '@angular/forms';
import {ActivatedRoute, Router} from '@angular/router';
import {switchMap, finalize} from 'rxjs/operators';
import {of} from 'rxjs';
import {PaymentService} from '../../core/api/payment.service';
import {WorkstationService} from '../../core/api/workstation.service';
import {RoomService} from '../../core/api/room.service';
import {ServiceService} from '../../core/api/service.service';
import {ReservationService} from '../../core/api/reservation.service';
import {AuthService} from '../../core/auth/auth.service';
import {PaymentInDto, PaymentMethod, PaymentType} from '../../core/models/payment-in-dto';
import { map } from 'rxjs/operators';
import { DetailReservationWorkstationService } from '../../core/api/detail-reservation-workstation.service';
import { DetailReservationRoomService } from '../../core/api/detail-reservation-room.service';

@Component({
  selector: 'app-payments',
  templateUrl: './payments.component.html',
  styleUrls: ['./payments.component.css'],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule]
})
export class PaymentsComponent implements OnInit {
  paymentForm!: FormGroup;
  reservationId?: number;
  serviceId?: number;
  itemType?: string; // 'workstation', 'room', 'service'
  itemDetails: any = null;
  loading = false;
  errorMessage: string | null = null;
  successMessage: string | null = null;
  totalAmount = 0;
  companyId?: number;

  paymentMethods: { value: PaymentMethod, label: string, icon: string }[] = [
    {value: 'credit_card', label: 'Tarjeta de crédito', icon: 'fa-credit-card'},
    {value: 'bank_transfer', label: 'Transferencia bancaria', icon: 'fa-university'},
    {value: 'paypal', label: 'PayPal', icon: 'fa-paypal'}
  ];

  constructor(
    private fb: FormBuilder,
    private paymentService: PaymentService,
    private workstationService: WorkstationService,
    private roomService: RoomService,
    private serviceService: ServiceService,
    private reservationService: ReservationService,
    private detailReservationWorkstationService: DetailReservationWorkstationService,
    private detailReservationRoomService: DetailReservationRoomService,
    private authService: AuthService,
    private route: ActivatedRoute,
    private router: Router
  ) {
  }

  ngOnInit(): void {
    this.initForm();
    this.loadData();
  }

  private initForm(): void {
    this.paymentForm = this.fb.group({
      paymentMethod: ['credit_card', Validators.required],
      cardNumber: ['', [Validators.pattern(/^\d{16}$/)]],
      cardHolder: ['', []],
      expiryDate: ['', [Validators.pattern(/^(0[1-9]|1[0-2])\/\d{2}$/)]],
      cvv: ['', [Validators.pattern(/^\d{3}$/)]],
      acceptTerms: [false, Validators.requiredTrue]
    });

    // Manejar validaciones condicionales para tarjeta de crédito
    this.paymentForm.get('paymentMethod')?.valueChanges.subscribe(method => {
      if (method === 'credit_card') {
        this.paymentForm.get('cardNumber')?.setValidators([Validators.required, Validators.pattern(/^\d{16}$/)]);
        this.paymentForm.get('cardHolder')?.setValidators([Validators.required]);
        this.paymentForm.get('expiryDate')?.setValidators([Validators.required, Validators.pattern(/^(0[1-9]|1[0-2])\/\d{2}$/)]);
        this.paymentForm.get('cvv')?.setValidators([Validators.required, Validators.pattern(/^\d{3}$/)]);
      } else {
        this.paymentForm.get('cardNumber')?.clearValidators();
        this.paymentForm.get('cardHolder')?.clearValidators();
        this.paymentForm.get('expiryDate')?.clearValidators();
        this.paymentForm.get('cvv')?.clearValidators();
      }

      this.paymentForm.get('cardNumber')?.updateValueAndValidity();
      this.paymentForm.get('cardHolder')?.updateValueAndValidity();
      this.paymentForm.get('expiryDate')?.updateValueAndValidity();
      this.paymentForm.get('cvv')?.updateValueAndValidity();
    });
  }

  private loadData(): void {
    this.loading = true;

    this.route.queryParams.subscribe(params => {
      this.reservationId = params['reservationId'] ? +params['reservationId'] : undefined;
      this.serviceId = params['serviceId'] ? +params['serviceId'] : undefined;
      this.itemType = params['type'];

      // Cargar información de compañía del usuario
      const user = this.authService.getCurrentUser();
      this.companyId = user?.companyId;

      if (!this.companyId) {
        this.errorMessage = 'No se encontró la información de la empresa asociada a tu cuenta';
        this.loading = false;
        return;
      }

      if (this.reservationId && this.itemType) {
        // Cargar detalles de la reserva
        this.loadReservationDetails();
      } else if (this.serviceId) {
        // Cargar detalles del servicio
        this.loadServiceDetails();
      } else {
        this.errorMessage = 'No se encontró información válida para el pago';
        this.loading = false;
      }
    });
  }

  private loadReservationDetails(): void {
    if (!this.reservationId) {
      this.errorMessage = 'Falta información de la reserva';
      this.loading = false;
      return;
    }

    this.reservationService.getById(this.reservationId).pipe(
      switchMap(reservation => {
        // Guardamos los datos básicos de la reserva
        const startDate = new Date(reservation.startDate);
        const endDate = new Date(reservation.endDate);

        // Calculamos la duración en horas
        const durationMs = endDate.getTime() - startDate.getTime();
        const durationHours = Math.ceil(durationMs / (1000 * 60 * 60));

        // Determinamos el tipo de recurso basado en reservation.reservationType
        if (reservation.reservationType === 'workstation') {
          // Necesitamos obtener el ID de la estación de trabajo desde el detalle de reserva
          return this.detailReservationWorkstationService.getByReservationId(reservation.reservationId).pipe(
            switchMap(details => {
              if (!details || (Array.isArray(details) && details.length === 0)) {
                this.errorMessage = 'No se encontraron detalles para esta reserva';
                return of(null);
              }

              const detailsArray = Array.isArray(details) ? details : [details];

              // Obtenemos la información de la estación de trabajo
              return this.workstationService.getById(detailsArray[0].workstationId).pipe(
                map((workstation: any) => {
                  this.itemDetails = {
                    ...workstation,
                    duration: durationHours,
                    startDate: reservation.startDate,
                    endDate: reservation.endDate,
                    reservationType: 'Estación de Trabajo',
                    status: reservation.status
                  };
                  this.totalAmount = workstation.hourlyRate * durationHours;
                  return this.itemDetails;
                })
              );
            })
          );
        } else if (reservation.reservationType === 'room') {
          // Necesitamos obtener el ID de la sala desde el detalle de reserva
          return this.detailReservationRoomService.getByReservationId(reservation.reservationId).pipe(
            switchMap(details => {
              if (!details || (Array.isArray(details) && details.length === 0)) {
                this.errorMessage = 'No se encontraron detalles para esta reserva';
                return of(null);
              }

              const detailsArray = Array.isArray(details) ? details : [details];

              // Obtenemos la información de la sala
              return this.roomService.getById(detailsArray[0].roomId).pipe(
                map((room: any) => {
                  this.itemDetails = {
                    ...room,
                    duration: durationHours,
                    startDate: reservation.startDate,
                    endDate: reservation.endDate,
                    reservationType: 'Sala de Reuniones',
                    status: reservation.status
                  };
                  this.totalAmount = room.hourlyRate * durationHours;
                  return this.itemDetails;
                })
              );
            })
          );
        } else {
          this.errorMessage = 'Tipo de reserva no soportado';
          return of(null);
        }
      }),
      finalize(() => this.loading = false)
    ).subscribe({
      error: (err) => {
        console.error('Error al cargar detalles de la reserva:', err);
        this.errorMessage = 'No se pudieron cargar los detalles de la reserva';
      }
    });
  }

  private loadServiceDetails(): void {
    if (!this.serviceId) {
      this.errorMessage = 'Falta ID del servicio';
      this.loading = false;
      return;
    }

    this.serviceService.getById(this.serviceId).subscribe({
      next: (service) => {
        this.itemDetails = {
          ...service,
          reservationType: 'Servicio Contratado'
        };
        this.totalAmount = service.price;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error al cargar detalles del servicio:', err);
        this.errorMessage = 'No se pudieron cargar los detalles del servicio';
        this.loading = false;
      }
    });
  }

  processPayment(): void {
    if (this.paymentForm.invalid) {
      this.markFormGroupTouched(this.paymentForm);
      this.errorMessage = 'Por favor completa correctamente todos los campos obligatorios';
      return;
    }

    if (!this.companyId) {
      this.errorMessage = 'No se encontró la información de la empresa asociada a tu cuenta';
      return;
    }

    this.loading = true;
    this.errorMessage = null;

    // Crear objeto de pago
    const paymentData: PaymentInDto = {
      companyId: this.companyId,
      amount: this.totalAmount,
      paymentType: this.getPaymentType(),
      paymentMethod: this.paymentForm.get('paymentMethod')?.value,
      paymentDate: new Date().toISOString(),
      paymentStatus: 'pending'
    };

    console.log('Enviando datos de pago:', paymentData);

    this.paymentService.create(paymentData)
      .pipe(finalize(() => this.loading = false))
      .subscribe({
        next: (payment) => {
          this.successMessage = 'Pago procesado correctamente';

          // Simular procesamiento exitoso después de 2 segundos
          setTimeout(() => {
            if (this.itemType === 'workstation' || this.itemType === 'room') {
              this.router.navigate(['/reservations']);
            } else {
              this.router.navigate(['/services/purchased']);
            }
          }, 2000);
        },
        error: (err) => {
          console.error('Error al procesar el pago:', err);
          this.errorMessage = 'No se pudo procesar el pago. Inténtalo de nuevo.';
        }
      });
  }

  private getPaymentType(): PaymentType {
    if (this.serviceId) return 'extra_service';
    if (this.reservationId) {
      if (this.itemType === 'workstation' || this.itemType === 'room') {
        return 'deposit';
      }
    }
    return 'deposit'; // valor por defecto
  }

  markFormGroupTouched(formGroup: FormGroup) {
    Object.values(formGroup.controls).forEach(control => {
      control.markAsTouched();
      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }

  goBack(): void {
    // Volver a la página de donde vino
    window.history.back();
  }

  // Getters para el template
  get showCardDetails(): boolean {
    return this.paymentForm.get('paymentMethod')?.value === 'credit_card';
  }

  get cardNumberControl() {
    return this.paymentForm.get('cardNumber');
  }

  get cardHolderControl() {
    return this.paymentForm.get('cardHolder');
  }

  get expiryDateControl() {
    return this.paymentForm.get('expiryDate');
  }

  get cvvControl() {
    return this.paymentForm.get('cvv');
  }
}
