import {Component, OnInit, AfterViewInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {ActivatedRoute, Router} from '@angular/router';
import {ReactiveFormsModule, FormBuilder, FormGroup, Validators} from '@angular/forms';
import {WorkstationService} from '../../core/api/workstation.service';
import {FloorService} from '../../core/api/floor.service';
import {AuthService} from '../../core/auth/auth.service';
import {WorkstationOutDto} from '../../core/models/workstation-out-dto';
import {ReservationService} from '../../core/api/reservation.service';
import {DetailReservationWorkstationService} from '../../core/api/detail-reservation-workstation.service';
import {ReservationInDto} from '../../core/models/reservation-in-dto';
import {DetailReservationWorkstationInDto} from '../../core/models/detail-reservation-workstation-in-dto';
import {DetailReservationWorkstationOutDto} from '../../core/models/detail-reservation-workstation-out-dto';
import {finalize, map, switchMap} from 'rxjs/operators';
import {forkJoin, Observable, of} from 'rxjs';

interface TimeSlot {
  time: string;
  available: boolean;
}

interface DaySchedule {
  date: string;
  dateObj: Date;
  dayName: string;
  slots: TimeSlot[];
}

@Component({
  selector: 'app-workstation-view',
  templateUrl: './workstation-view.component.html',
  styleUrls: ['./workstation-view.component.css'],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule]
})
export class WorkstationViewComponent implements OnInit, AfterViewInit {
  workstation?: WorkstationOutDto;
  workstationId?: number;
  loading = false;
  reservationLoading = false;
  checkingAvailability = false;
  errorMessage: string | null = null;
  successMessage: string | null = null;
  floorName?: string;
  isAdmin = false;
  showBookingForm = false;
  bookingForm: FormGroup;
  userId?: number | null;
  createdReservationId?: number;

  minDate = new Date().toISOString().split('T')[0];

  baseAvailableTimes: string[] = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00'];
  availableTimes: string[] = [];

  selectedDate: Date = new Date();
  weekSchedule: DaySchedule[] = [];
  currentMonthDays: {
    date: number,
    month: number,
    isCurrentMonth: boolean,
    hasEvents: boolean,
    isToday: boolean
  }[] = [];

  bookedHours?: number = 32;
  totalBookings?: number = 8;
  averageRating?: number = 4.5;

  calendarView = 'week';

  constructor(
    private workstationService: WorkstationService,
    private floorService: FloorService,
    private authService: AuthService,
    private reservationService: ReservationService,
    private detailReservationWorkstationService: DetailReservationWorkstationService,
    private route: ActivatedRoute,
    private router: Router,
    private fb: FormBuilder
  ) {
    this.bookingForm = this.fb.group({
      bookingDate: ['', Validators.required],
      startTime: ['', Validators.required],
      duration: ['1', [Validators.required, Validators.min(1), Validators.max(8)]]
    });

    this.bookingForm.get('duration')?.valueChanges.subscribe(() => {
      this.onDurationChange();
    });
  }

  ngOnInit(): void {
    this.isAdmin = this.authService.hasRole('ADMIN');

    const currentUser = this.authService.getCurrentUser();
    this.userId = currentUser?.userId;

    if (!this.userId) {
      this.userId = this.authService.getUserId();
    }

    this.bookingForm.get('startTime')?.valueChanges.subscribe(() => {
      this.validateTimeAndDuration();
    });

    this.bookingForm.get('duration')?.valueChanges.subscribe(() => {
      this.validateTimeAndDuration();
    });

    if (!this.userId) {
      this.errorMessage = 'No se pudo identificar al usuario. Por favor, inicia sesión nuevamente.';
      console.error('No se pudo obtener el ID del usuario');
    } else {
      console.log('ID de usuario obtenido:', this.userId);
    }

    this.route.paramMap.subscribe(params => {
      const idParam = params.get('id');
      if (idParam) {
        this.workstationId = +idParam;
        this.loadWorkstation();
      } else {
        this.errorMessage = 'ID de estación de trabajo no proporcionado';
      }
    });
  }

  ngAfterViewInit(): void {
    if (this.workstationId) {
      setTimeout(() => {
        this.loadCalendarData();
      }, 100);
    }
  }

  validateTimeAndDuration(): void {
    const startTime = this.bookingForm.get('startTime')?.value;
    const duration = parseInt(this.bookingForm.get('duration')?.value || '1');

    if (startTime) {
      const [hours] = startTime.split(':').map(Number);

      if (hours + duration > 19) {
        this.bookingForm.get('duration')?.setErrors({exceededHours: true});
        this.errorMessage = 'El horario de reserva no puede extenderse más allá de las 19:00';
      } else {
        this.errorMessage = null;
      }
    }
  }

  loadWorkstation(): void {
    if (!this.workstationId) return;

    this.loading = true;
    this.errorMessage = null;

    this.workstationService.getById(this.workstationId).subscribe({
      next: (data) => {
        this.workstation = data;
        this.loading = false;
        this.loadFloorInfo();
        this.loadExistingReservations();
      },
      error: (err) => {
        console.error('Error al cargar estación de trabajo:', err);
        this.errorMessage = 'No se pudo cargar la información de la estación de trabajo';
        this.loading = false;
      }
    });
  }

  loadFloorInfo(): void {
    if (!this.workstation) return;

    this.floorService.getById(this.workstation.floorId).subscribe({
      next: (floor) => {
        this.floorName = floor.floorName;
      },
      error: (err) => {
        console.error('Error al cargar planta:', err);
      }
    });
  }

  loadExistingReservations(): void {
    if (!this.workstationId) return;

    this.checkingAvailability = true;

    this.detailReservationWorkstationService.getByWorkstation(this.workstationId).subscribe({
      next: (reservations) => {
        this.updateAvailabilityCalendar(reservations);
        this.checkingAvailability = false;
      },
      error: (err) => {
        console.error('Error al cargar reservas existentes:', err);
        this.checkingAvailability = false;
        this.errorMessage = 'No se pudieron cargar las reservas existentes';
      }
    });
  }

  loadCalendarData(): void {
    if (!this.workstationId) return;

    this.checkingAvailability = true;

    let startDate: Date, endDate: Date;

    if (this.calendarView === 'week') {
      startDate = this.getStartOfWeek(this.selectedDate);
      endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + 6);
      endDate.setHours(23, 59, 59);
    } else {
      startDate = new Date(this.selectedDate.getFullYear(), this.selectedDate.getMonth(), 1);
      endDate = new Date(this.selectedDate.getFullYear(), this.selectedDate.getMonth() + 1, 0, 23, 59, 59);
    }

    const startIso = startDate.toISOString();
    const endIso = endDate.toISOString();

    this.detailReservationWorkstationService.getOccupiedBetweenDates(startIso, endIso).subscribe({
      next: (allReservations) => {
        const workstationReservations = allReservations.filter(r => r.workstationId === this.workstationId);

        if (this.calendarView === 'week') {
          this.generateWeekSchedule(workstationReservations);
        } else {
          this.generateMonthCalendar(workstationReservations);
        }

        this.checkingAvailability = false;
      },
      error: (err) => {
        console.error('Error al cargar datos del calendario:', err);
        this.checkingAvailability = false;
      }
    });
  }

  onDurationChange(): void {
    const dateStr = this.bookingForm.get('bookingDate')?.value;
    if (!dateStr || !this.workstationId) return;

    const [year, month, day] = dateStr.split('-').map(Number);
    const startDate = new Date(year, month - 1, day, 0, 0, 0);
    const endDate = new Date(year, month - 1, day, 23, 59, 59);

    this.detailReservationWorkstationService.getOccupiedBetweenDates(
      startDate.toISOString(),
      endDate.toISOString()
    ).subscribe(allReservations => {
      const workstationReservations = allReservations.filter(r => r.workstationId === this.workstationId);
      this.updateAvailableTimesForDate(dateStr, workstationReservations);
      this.generateWeekSchedule(workstationReservations);
    });
  }

  updateAvailabilityCalendar(reservations: DetailReservationWorkstationOutDto[]): void {
    this.generateWeekSchedule(reservations);
    this.generateMonthCalendar(reservations);

    if (this.bookingForm.get('bookingDate')?.value) {
      this.updateAvailableTimesForDate(this.bookingForm.get('bookingDate')?.value, reservations);
    }
  }

  generateWeekSchedule(reservations: DetailReservationWorkstationOutDto[] = []): void {
    this.weekSchedule = [];
    const startOfWeek = this.getStartOfWeek(this.selectedDate);
    const duration = parseInt(this.bookingForm.get('duration')?.value || '1');

    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(date.getDate() + i);

      const dateString = this.formatDate(date);
      const dayName = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'][date.getDay()];

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const isPastDate = date < today;

      const slots = this.baseAvailableTimes.map(time => {
        if (isPastDate) {
          return {
            time,
            available: false
          };
        }

        const isToday = this.isSameDay(date, new Date());
        if (isToday) {
          const [hours, minutes] = time.split(':').map(Number);
          const currentHour = new Date().getHours();
          const currentMinute = new Date().getMinutes();

          if (hours < currentHour || (hours === currentHour && minutes < currentMinute)) {
            return {
              time,
              available: false
            };
          }

          const horasDisponibles = 19 - hours;
          if (duration > horasDisponibles) {
            return {
              time,
              available: false
            };
          }

          if (hours === 18 && duration > 1) {
            return {
              time,
              available: false
            };
          }
        }

        const isAvailable = this.isTimeSlotAvailable(dateString, time, reservations, duration);

        return {
          time,
          available: isAvailable
        };
      });

      this.weekSchedule.push({
        date: dateString,
        dateObj: new Date(date),
        dayName,
        slots
      });
    }
  }

  getStartOfWeek(date: Date): Date {
    const startOfWeek = new Date(date);
    const day = startOfWeek.getDay();
    const diff = day === 0 ? 6 : day - 1;
    startOfWeek.setDate(startOfWeek.getDate() - diff);
    startOfWeek.setHours(0, 0, 0, 0);
    return startOfWeek;
  }

  generateMonthCalendar(reservations: DetailReservationWorkstationOutDto[] = []): void {
    this.currentMonthDays = [];
    const year = this.selectedDate.getFullYear();
    const month = this.selectedDate.getMonth();
    const today = new Date();

    const firstDayOfMonth = new Date(year, month, 1);
    const firstDayOfWeek = firstDayOfMonth.getDay();

    const startDay = new Date(firstDayOfMonth);
    startDay.setDate(1 - (firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1));

    for (let i = 0; i < 42; i++) {
      const date = new Date(startDay);
      date.setDate(date.getDate() + i);

      const isCurrentMonth = date.getMonth() === month;
      const isToday = this.isSameDay(date, today);

      const dateString = this.formatDate(date);
      const hasEvents = this.dayHasReservations(dateString, reservations);

      this.currentMonthDays.push({
        date: date.getDate(),
        month: date.getMonth(),
        isCurrentMonth,
        hasEvents,
        isToday
      });
    }
  }

  isTimeSlotAvailable(dateStr: string, timeStr: string, reservations: DetailReservationWorkstationOutDto[] = [], durationHours: number = 1): boolean {
    if (!reservations || reservations.length === 0) return true;

    const [year, month, day] = dateStr.split('-').map(Number);
    const [hours, minutes] = timeStr.split(':').map(Number);

    if (hours === 18 && durationHours > 1) {
      return false;
    }

    if (hours + durationHours > 19) {
      return false;
    }

    const slotStart = new Date(year, month - 1, day, hours, minutes);
    const slotEnd = new Date(slotStart);
    slotEnd.setHours(slotStart.getHours() + durationHours);

    for (const reservation of reservations) {
      const reservationStart = new Date(reservation.startTime);
      const reservationEnd = new Date(reservation.endTime);

      if (
        (slotStart >= reservationStart && slotStart < reservationEnd) ||
        (slotEnd > reservationStart && slotEnd <= reservationEnd) ||
        (slotStart <= reservationStart && slotEnd >= reservationEnd)
      ) {
        return false;
      }
    }

    return true;
  }

  dayHasReservations(dateStr: string, reservations: DetailReservationWorkstationOutDto[]): boolean {
    if (!reservations || reservations.length === 0) return false;

    const [year, month, day] = dateStr.split('-').map(Number);
    const dayStart = new Date(year, month - 1, day, 0, 0, 0);
    const dayEnd = new Date(year, month - 1, day, 23, 59, 59);

    return reservations.some(reservation => {
      const reservationStart = new Date(reservation.startTime);
      const reservationEnd = new Date(reservation.endTime);

      return (
        (reservationStart >= dayStart && reservationStart <= dayEnd) ||
        (reservationEnd >= dayStart && reservationEnd <= dayEnd) ||
        (reservationStart <= dayStart && reservationEnd >= dayEnd)
      );
    });
  }

  isSelectedDay(day: { date: number, month: number, isCurrentMonth: boolean }): boolean {
    if (!day.isCurrentMonth) return false;

    return this.isSameDay(
      new Date(this.selectedDate.getFullYear(), day.month, day.date),
      this.selectedDate
    );
  }

  selectMonthDay(day: { date: number, month: number, isCurrentMonth: boolean }): void {
    if (!day.isCurrentMonth) return;

    const selectedDate = new Date(this.selectedDate.getFullYear(), day.month, day.date);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (selectedDate < today) {
      this.errorMessage = 'No puedes seleccionar fechas pasadas';
      return;
    }

    this.errorMessage = null;
    this.selectedDate = selectedDate;

    const dateStr = this.formatDate(selectedDate);
    this.bookingForm.get('bookingDate')?.setValue(dateStr);

    const startDate = new Date(selectedDate);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(selectedDate);
    endDate.setHours(23, 59, 59, 999);

    this.detailReservationWorkstationService.getOccupiedBetweenDates(
      startDate.toISOString(),
      endDate.toISOString()
    ).subscribe(allReservations => {
      const workstationReservations = allReservations.filter(r => r.workstationId === this.workstationId);
      this.updateAvailableTimesForDate(dateStr, workstationReservations);

      this.calendarView = 'week';
      this.generateWeekSchedule(workstationReservations);
    });
  }

  onDateChange(event: Event): void {
    const dateStr = (event.target as HTMLInputElement).value;
    if (!dateStr || !this.workstationId) return;

    const selectedDate = new Date(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (selectedDate < today) {
      this.errorMessage = 'No puedes seleccionar fechas pasadas';
      return;
    }

    this.errorMessage = null;

    const [year, month, day] = dateStr.split('-').map(Number);
    const startDate = new Date(year, month - 1, day, 0, 0, 0);
    const endDate = new Date(year, month - 1, day, 23, 59, 59);

    this.detailReservationWorkstationService.getOccupiedBetweenDates(
      startDate.toISOString(),
      endDate.toISOString()
    ).subscribe(allReservations => {
      const workstationReservations = allReservations.filter(r => r.workstationId === this.workstationId);
      this.updateAvailableTimesForDate(dateStr, workstationReservations);
    });
  }

  updateAvailableTimesForDate(dateStr: string, reservations: DetailReservationWorkstationOutDto[]): void {
    const [year, month, day] = dateStr.split('-').map(Number);
    const selectedDate = new Date(year, month - 1, day);
    const today = new Date();

    today.setHours(0, 0, 0, 0);
    const selectedDay = new Date(selectedDate);
    selectedDay.setHours(0, 0, 0, 0);

    const isToday = this.isSameDay(selectedDate, new Date());

    const duration = parseInt(this.bookingForm.get('duration')?.value || '1');

    const availableSlots: string[] = [];

    this.baseAvailableTimes.forEach(time => {
      if (isToday) {
        const [hours, minutes] = time.split(':').map(Number);
        const currentHour = new Date().getHours();
        const currentMinute = new Date().getMinutes();

        if (hours < currentHour || (hours === currentHour && minutes < currentMinute)) {
          return;
        }

        const horasDisponibles = 19 - hours;
        if (duration > horasDisponibles) {
          return;
        }

        if (hours === 18 && duration > 1) {
          return;
        }
      } else {
        const [hours] = time.split(':').map(Number);
        if (hours + duration > 19) {
          return;
        }

        if (hours === 18 && duration > 1) {
          return;
        }
      }

      if (this.isTimeSlotAvailable(dateStr, time, reservations, duration)) {
        availableSlots.push(time);
      }
    });

    this.availableTimes = availableSlots;

    const currentTime = this.bookingForm.get('startTime')?.value;
    if (currentTime && !this.availableTimes.includes(currentTime)) {
      this.bookingForm.get('startTime')?.setValue('');
    }
  }

  selectDate(daySchedule: DaySchedule): void {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (daySchedule.dateObj < today) {
      return;
    }

    this.selectedDate = daySchedule.dateObj;
    this.bookingForm.get('bookingDate')?.setValue(daySchedule.date);

    const startDate = new Date(daySchedule.dateObj);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(daySchedule.dateObj);
    endDate.setHours(23, 59, 59, 999);

    this.detailReservationWorkstationService.getOccupiedBetweenDates(
      startDate.toISOString(),
      endDate.toISOString()
    ).subscribe(allReservations => {
      const workstationReservations = allReservations.filter(r => r.workstationId === this.workstationId);
      this.updateAvailableTimesForDate(daySchedule.date, workstationReservations);
    });
  }

  selectTimeSlot(daySchedule: DaySchedule, slot: TimeSlot): void {
    if (!slot.available) return;

    this.bookingForm.patchValue({
      bookingDate: daySchedule.date,
      startTime: slot.time
    });

    if (!this.showBookingForm) {
      this.toggleBookingForm();
    }
  }

  toggleBookingForm(): void {
    this.showBookingForm = !this.showBookingForm;
    this.successMessage = null;
    this.errorMessage = null;

    if (this.showBookingForm) {
      this.bookingForm.reset();
      this.bookingForm.patchValue({
        duration: '1',
        bookingDate: this.minDate
      });

      this.onDateChange({target: {value: this.minDate}} as unknown as Event);
    }
  }

  calculatePrice(): number {
    if (!this.workstation || !this.bookingForm.valid) return 0;

    const duration = parseInt(this.bookingForm.get('duration')?.value || '0');
    return this.workstation.hourlyRate * duration;
  }

  calculateEndTime(startTime: string, durationHours: number): string {
    const [hours, minutes] = startTime.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, minutes, 0, 0);

    if (hours === 18 && durationHours > 1) {
      durationHours = 1;
    }

    date.setTime(date.getTime() + (durationHours * 60 * 60 * 1000));

    return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  }

  onBookSubmit(): void {
    if (!this.bookingForm.valid || !this.workstation) {
      this.errorMessage = 'Por favor completa todos los campos requeridos';
      return;
    }

    if (!this.userId) {
      this.errorMessage = 'No se pudo identificar al usuario. Por favor, inicia sesión nuevamente.';
      return;
    }

    const dateStr = this.bookingForm.get('bookingDate')?.value;
    const selectedDate = new Date(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (selectedDate < today) {
      this.errorMessage = 'No puedes hacer reservas en fechas pasadas';
      return;
    }

    const startTime = this.bookingForm.get('startTime')?.value;
    const duration = parseInt(this.bookingForm.get('duration')?.value || '1');
    const [hours] = startTime.split(':').map(Number);

    if (hours + duration > 19) {
      this.errorMessage = 'El horario de reserva no puede extenderse más allá de las 19:00';
      return;
    }

    this.reservationLoading = true;
    this.errorMessage = null;
    this.successMessage = null;

    try {
      const bookingDate = this.bookingForm.get('bookingDate')?.value;
      const startTime = this.bookingForm.get('startTime')?.value;
      let duration = parseInt(this.bookingForm.get('duration')?.value || '1');

      if (startTime === '18:00' && duration > 1) {
        duration = 1;
      }

      const endTime = this.calculateEndTime(startTime, duration);

      this.checkAvailabilityBeforeBooking(bookingDate, startTime, endTime).subscribe({
        next: (isAvailable) => {
          if (!isAvailable) {
            this.errorMessage = 'El horario seleccionado ya no está disponible. Por favor elige otro.';
            this.reservationLoading = false;
            this.loadExistingReservations();
            return;
          }

          this.createReservation(bookingDate, startTime, endTime);
        },
        error: (err) => {
          console.error('Error al verificar disponibilidad:', err);
          this.errorMessage = 'No se pudo verificar la disponibilidad. Por favor intenta de nuevo.';
          this.reservationLoading = false;
        }
      });
    } catch (error) {
      console.error('Error al procesar la fecha:', error);
      this.errorMessage = 'Error al procesar la fecha. Por favor verifica los datos ingresados.';
      this.reservationLoading = false;
    }
  }

  checkAvailabilityBeforeBooking(date: string, startTime: string, endTime: string): Observable<boolean> {
    if (!this.workstationId) return of(false);

    const startDateTime = this.createValidDateTime(date, startTime);
    const endDateTime = this.createValidDateTime(date, endTime);

    return this.detailReservationWorkstationService.getOccupiedBetweenDates(
      this.convertLocalDateToUTC(startDateTime),
      this.convertLocalDateToUTC(endDateTime)
    ).pipe(
      switchMap(reservations => {
        const workstationReservations = reservations.filter(r => r.workstationId === this.workstationId);

        return of(workstationReservations.length === 0);
      })
    );
  }

  createReservation(bookingDate: string, startTime: string, endTime: string): void {
    const startDateTime = this.createValidDateTime(bookingDate, startTime);
    const endDateTime = this.createValidDateTime(bookingDate, endTime);

    const startDate = this.convertLocalDateToUTC(startDateTime);
    const endDate = this.convertLocalDateToUTC(endDateTime);

    const reservationData: ReservationInDto = {
      userId: this.userId!,
      reservationType: 'workstation',
      startDate,
      endDate,
      status: 'pending',
      depositPaymentId: null
    };

    console.log('Enviando datos de reserva:', reservationData);

    this.reservationService.create(reservationData)
      .pipe(
        switchMap(reservation => {
          const detailData: DetailReservationWorkstationInDto = {
            reservationId: reservation.reservationId,
            workstationId: this.workstation!.workstationId,
            startTime: startDate,
            endTime: endDate
          };

          this.createdReservationId = reservation.reservationId;

          return this.detailReservationWorkstationService.create(detailData).pipe(
            map(detail => ({detail, reservationId: this.createdReservationId}))
          );
        }),
        finalize(() => {
          this.reservationLoading = false;
        })
      )
      .subscribe({
        next: (result) => {
          this.successMessage = 'Reserva realizada correctamente.';

          this.goToPayment();
        },
        error: (err) => {
          console.error('Error al crear reserva:', err);
          this.errorMessage = 'No se pudo completar la reserva. Por favor intenta de nuevo.';
        }
      });
  }

  goToPayment(): void {
    if (this.createdReservationId) {
      this.router.navigate(['/payments/process'], {
        queryParams: {
          reservationId: this.createdReservationId,
          type: 'workstation'
        }
      });
    }
  }

  onBack(): void {
    void this.router.navigate(['/workstations']);
  }

  onEdit(): void {
    if (this.workstationId && this.isAdmin) {
      void this.router.navigate([`/workstations/${this.workstationId}/edit`]);
    }
  }

  createValidDateTime(dateStr: string, timeStr: string): Date {
    if (!dateStr || !timeStr) {
      throw new Error('Fecha u hora no válidas');
    }

    const [hours, minutes] = timeStr.split(':').map(Number);

    const date = new Date(dateStr);
    date.setHours(hours, minutes, 0, 0);

    return date;
  }

  convertLocalDateToUTC(date: Date): string {
    const timezoneOffset = date.getTimezoneOffset() * 60000;

    const utcDate = new Date(date.getTime() - timezoneOffset);

    return utcDate.toISOString();
  }

  formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  isSameDay(date1: Date, date2: Date): boolean {
    return (
      date1.getFullYear() === date2.getFullYear() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getDate() === date2.getDate()
    );
  }

  toggleCalendarView(): void {
    this.calendarView = this.calendarView === 'week' ? 'month' : 'week';
    this.loadCalendarData();
  }

  navigateWeek(direction: number): void {
    const newDate = new Date(this.selectedDate);
    newDate.setDate(newDate.getDate() + (direction * 7));

    this.selectedDate = newDate;
    this.loadCalendarData();
  }

  navigateMonth(direction: number): void {
    const newDate = new Date(this.selectedDate);
    newDate.setMonth(newDate.getMonth() + direction);

    this.selectedDate = newDate;
    this.loadCalendarData();
  }
}
