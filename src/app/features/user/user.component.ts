import {ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, ViewEncapsulation} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormBuilder, FormGroup, Validators, ReactiveFormsModule} from '@angular/forms';
import {UserService} from '../../core/api/user.service';
import {AuthService} from '../../core/auth/auth.service';
import {ReservationService} from '../../core/api/reservation.service';
import {UserOutDto} from '../../core/models/user-out-dto';
import {ReservationOutDto} from '../../core/models/reservation-out-dto';
import {Router} from '@angular/router';
import {FormsModule} from '@angular/forms';

@Component({
  selector: 'app-user',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './user.component.html',
  styleUrl: './user.component.css',
  encapsulation: ViewEncapsulation.Emulated,
  changeDetection: ChangeDetectionStrategy.Default
})
export class UserComponent implements OnInit {
  activeTab: string = 'profile';
  userForm: FormGroup | null = null;
  userData: UserOutDto | null = null;
  loading = false;
  errorMessage: string | null = null;
  successMessage: string | null = null;
  showSuccessMessage = false;

  // Para la pestaña de reservas
  userReservations: ReservationOutDto[] = [];
  filteredReservations: ReservationOutDto[] = [];
  loadingReservations = false;
  reservationsError: string | null = null;
  reservationFilter: string = 'all';

  constructor(
    private fb: FormBuilder,
    private userService: UserService,
    private authService: AuthService,
    private reservationService: ReservationService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {
  }

  ngOnInit(): void {
    this.loadUserData();
    this.initForm();
  }

  changeTab(tab: string): void {
    this.activeTab = tab;

    if (tab === 'reservations' && this.userReservations.length === 0) {
      this.loadUserReservations();
    }
  }

  initForm(): void {
    this.userForm = this.fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', Validators.required],
      currentPassword: [''],
      newPassword: ['', [Validators.minLength(8)]],
      confirmPassword: ['']
    }, {validators: this.passwordMatchValidator});
  }

  passwordMatchValidator(form: FormGroup) {
    const newPassword = form.get('newPassword')?.value;
    const confirmPassword = form.get('confirmPassword')?.value;

    if (newPassword && newPassword !== confirmPassword) {
      return {passwordMismatch: true};
    }

    return null;
  }

  loadUserData(): void {
    const userId = this.authService.getUserId();
    if (!userId) {
      this.errorMessage = 'No se pudo identificar al usuario';
      return;
    }

    this.loading = true;
    this.userService.getById(userId).subscribe({
      next: (user) => {
        this.userData = user;
        if (this.userForm) {
          this.userForm.patchValue({
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            phone: user.phone
          });
        }
        this.loading = false;
      },
      error: (err) => {
        console.error('Error al cargar datos del usuario:', err);
        this.errorMessage = 'No se pudieron cargar los datos del usuario';
        this.loading = false;
      }
    });
  }

  loadUserReservations(): void {
    const userId = this.authService.getUserId();
    if (!userId) {
      this.reservationsError = 'No se pudo identificar al usuario';
      return;
    }

    this.loadingReservations = true;
    this.reservationService.getByUser(userId).subscribe({
      next: (reservations) => {
        this.userReservations = reservations;
        this.filterReservations();
        this.loadingReservations = false;
      },
      error: (err) => {
        console.error('Error al cargar reservas:', err);
        this.reservationsError = 'No se pudieron cargar las reservas';
        this.loadingReservations = false;
      }
    });
  }

  filterReservations(): void {
    const now = new Date();

    switch (this.reservationFilter) {
      case 'active':
        this.filteredReservations = this.userReservations.filter(r =>
          new Date(r.startDate) <= now && new Date(r.endDate) >= now
        );
        break;
      case 'past':
        this.filteredReservations = this.userReservations.filter(r =>
          new Date(r.endDate) < now
        );
        break;
      case 'upcoming':
        this.filteredReservations = this.userReservations.filter(r =>
          new Date(r.startDate) > now
        );
        break;
      default:
        this.filteredReservations = [...this.userReservations];
    }
  }

  onSubmit(): void {
    if (!this.userForm || this.userForm.invalid) return;

    const formValues = this.userForm.value;
    const userId = this.authService.getUserId();

    if (!userId || !this.userData) {
      this.errorMessage = 'No se pudo identificar al usuario';
      return;
    }

    // Guardar el email original para comparar después
    const originalEmail = this.userData.email;

    this.loading = true;
    this.errorMessage = null;

    // Quitar cualquier error previo de email duplicado
    this.userForm.get('email')?.setErrors(null);

    const updatedUser: any = {
      firstName: formValues.firstName,
      lastName: formValues.lastName,
      email: formValues.email,
      phone: formValues.phone,
      role: this.userData.role,
      companyId: this.userData.companyId
    };

    if (formValues.newPassword) {
      updatedUser.password = formValues.newPassword;
    } else {
      updatedUser.password = "NO_CHANGE";
    }

    if (this.userData.providerId !== null) {
      updatedUser.providerId = this.userData.providerId;
    }

    this.userService.update(userId, updatedUser).subscribe({
      next: (user) => {
        this.userData = user;
        this.loading = false;
        this.showSuccess('Datos actualizados correctamente');
        this.resetForm();

        if (formValues.email !== originalEmail) {
          setTimeout(() => {
            this.authService.logout();
            this.router.navigate(['/login']);
          }, 2000);
        }
      },
      error: (err) => {
        console.error('Error al actualizar datos:', err);

        if (err.error && (
            err.error.message?.includes('email already exists') ||
            err.error.message?.includes('correo ya existe') ||
            err.error.message?.includes('duplicate') ||
            err.error.message?.includes('ya está en uso') ||
            err.status === 409)) {

            // Verificar que userForm no sea nulo antes de usarlo
            if (this.userForm) {
                this.userForm.get('email')?.setErrors({'emailExists': true});
            }
            this.errorMessage = 'Este correo electrónico ya está registrado. Por favor utiliza otro.';
        } else {
            this.errorMessage = 'No se pudieron actualizar los datos: ' +
                (err.error?.message || 'Error de conexión');
        }

        this.loading = false;
      }
    });
  }

  resetForm(): void {
    if (this.userData && this.userForm) {
      this.userForm.patchValue({
        firstName: this.userData.firstName,
        lastName: this.userData.lastName,
        email: this.userData.email,
        phone: this.userData.phone,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      this.userForm.markAsPristine();
      this.userForm.markAsUntouched();
    }
  }

  viewReservationDetails(reservation: ReservationOutDto): void {
    if (reservation.reservationType === 'workstation') {
      this.router.navigate(['/reservations/workstation', reservation.reservationId]);
    } else if (reservation.reservationType === 'room') {
      this.router.navigate(['/reservations/room', reservation.reservationId]);
    }
  }

  canCancelReservation(reservation: ReservationOutDto): boolean {
    // Solo permite cancelar reservas futuras (que empiezan al menos una hora después)
    const reservationStart = new Date(reservation.startDate);
    const now = new Date();
    const oneHour = 60 * 60 * 1000;

    return reservationStart.getTime() - now.getTime() > oneHour;
  }

  cancelReservation(reservation: ReservationOutDto): void {
    if (confirm('¿Estás seguro de que deseas cancelar esta reserva?')) {
      this.reservationService.delete(reservation.reservationId).subscribe({
        next: () => {
          this.showSuccess('Reserva cancelada correctamente');
          this.loadUserReservations();
        },
        error: (err) => {
          console.error('Error al cancelar reserva:', err);
          this.errorMessage = 'No se pudo cancelar la reserva';
        }
      });
    }
  }

  getStatusText(reservation: ReservationOutDto): string {
    const now = new Date();
    const start = new Date(reservation.startDate);
    const end = new Date(reservation.endDate);

    if (now < start) {
      return 'Próxima';
    } else if (now > end) {
      return 'Finalizada';
    } else {
      return 'En curso';
    }
  }

  getStatusClass(reservation: ReservationOutDto): string {
    const status = this.getStatusText(reservation);

    switch (status) {
      case 'Próxima':
        return 'upcoming';
      case 'En curso':
        return 'active';
      case 'Finalizada':
        return 'finished';
      default:
        return '';
    }
  }

  showSuccess(message: string): void {
    this.successMessage = message;
    this.showSuccessMessage = true;

    // Ocultar mensaje después de 3 segundos
    setTimeout(() => {
      this.showSuccessMessage = false;
      this.cdr.detectChanges();
    }, 3000);
  }
}
