import {Component, OnInit, AfterViewInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {ActivatedRoute, Router} from '@angular/router';
import {ReactiveFormsModule, FormBuilder, FormGroup, Validators} from '@angular/forms';
import {RoomService} from '../../core/api/room.service';
import {FloorService} from '../../core/api/floor.service';
import {AuthService} from '../../core/auth/auth.service';
import {RoomOutDto} from '../../core/models/room-out-dto';
import {ReservationService} from '../../core/api/reservation.service';
import {DetailReservationRoomService} from '../../core/api/detail-reservation-room.service';
import {ReservationInDto} from '../../core/models/reservation-in-dto';
import {DetailReservationRoomInDto} from '../../core/models/detail-reservation-room-in-dto';
import {DetailReservationRoomOutDto} from '../../core/models/detail-reservation-room-out-dto';
import {forkJoin, Observable, of} from 'rxjs';
import {finalize, switchMap, map} from 'rxjs/operators';

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
  selector: 'app-rooms-view',
  templateUrl: './rooms-view.component.html',
  styleUrls: ['./rooms-view.component.css'],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule]
})
export class RoomsViewComponent implements OnInit, AfterViewInit {
  room?: RoomOutDto;
  roomId?: number;
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
  minDate: string;


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

  bookedHours?: number = 45;
  totalBookings?: number = 12;
  averageRating?: number = 4.7;
  createdReservationId?: number;

  calendarView = 'week';
  duracionMaximaPermitida: number = 8;

  constructor(
    private roomService: RoomService,
    private floorService: FloorService,
    private authService: AuthService,
    private reservationService: ReservationService,
    private detailReservationRoomService: DetailReservationRoomService,
    private route: ActivatedRoute,
    private router: Router,
    private fb: FormBuilder
  ) {
    this.minDate = this.formatDate(new Date());

    this.bookingForm = this.fb.group({
      bookingDate: [this.minDate, Validators.required],
      startTime: ['', Validators.required],
      duration: ['1', [Validators.required, Validators.min(1), Validators.max(8)]]
    });

    this.bookingForm.get('duration')?.valueChanges.subscribe(() => {
      this.onDurationChange();
    });

    this.bookingForm.get('startTime')?.valueChanges.subscribe(() => {
      this.onStartTimeChange();
    });
  }

  ngOnInit(): void {
    this.isAdmin = this.authService.hasRole('ADMIN');

    const currentUser = this.authService.getCurrentUser();
    this.userId = currentUser?.userId;

    if (!this.userId) {
      this.userId = this.authService.getUserId();
    }

    if (!this.userId) {
      this.errorMessage = 'No se pudo identificar al usuario. Por favor, inicia sesión nuevamente.';
      console.error('No se pudo obtener el ID del usuario');
    } else {
      console.log('ID de usuario obtenido:', this.userId);
    }

    this.route.paramMap.subscribe(params => {
      const idParam = params.get('id');
      if (idParam) {
        this.roomId = +idParam;
        this.loadRoom();
      } else {
        this.errorMessage = 'ID de sala no proporcionado';
      }
    });
  }

  ngAfterViewInit(): void {
    if (this.roomId) {
      setTimeout(() => {
        this.loadCalendarData();
      }, 100);
    }
  }

  onStartTimeChange(): void {
    const startTime = this.bookingForm.get('startTime')?.value;
    if (!startTime) return;

    const [hours, minutes] = startTime.split(':').map(Number);

    const horasDisponibles = 19 - hours;

    if (horasDisponibles < 8) {
      const currentDuration = parseInt(this.bookingForm.get('duration')?.value || '1');

      if (currentDuration > horasDisponibles) {
        this.bookingForm.get('duration')?.setValue(horasDisponibles.toString());
      }

      this.actualizarOpcionesDeHoras(horasDisponibles);
    } else {
      this.actualizarOpcionesDeHoras(8);
    }
  }

  actualizarOpcionesDeHoras(maximoHoras: number): void {
    this.duracionMaximaPermitida = maximoHoras;

    const duracionControl = this.bookingForm.get('duration');
    if (duracionControl && duracionControl.value > maximoHoras) {
      duracionControl.setValue(maximoHoras.toString());
    }

    if (maximoHoras > 1) {
      duracionControl?.enable();
    } else {
      if (duracionControl) {
        duracionControl.setValue('1');
        duracionControl.disable();
      }
    }
  }

  loadRoom(): void {
    if (!this.roomId) return;

    this.loading = true;
    this.errorMessage = null;

    this.roomService.getById(this.roomId).subscribe({
      next: (data) => {
        this.room = data;
        this.loading = false;
        this.loadFloorInfo();
        this.loadExistingReservations();
      },
      error: (err) => {
        console.error('Error al cargar sala:', err);
        this.errorMessage = 'No se pudo cargar la información de la sala';
        this.loading = false;
      }
    });
  }

  loadFloorInfo(): void {
    if (!this.room) return;

    this.floorService.getById(this.room.floorId).subscribe({
      next: (floor) => {
        this.floorName = floor.floorName;
      },
      error: (err) => {
        console.error('Error al cargar planta:', err);
      }
    });
  }

  loadExistingReservations(): void {
    if (!this.roomId) return;

    this.checkingAvailability = true;

    this.detailReservationRoomService.getByRoom(this.roomId).subscribe({
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
    if (!this.roomId) return;

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

    this.detailReservationRoomService.getOccupiedBetweenDates(startIso, endIso).subscribe({
      next: (allReservations) => {
        const roomReservations = allReservations.filter(r => r.roomId === this.roomId);

        if (this.calendarView === 'week') {
          this.generateWeekSchedule(roomReservations);
        } else {
          this.generateMonthCalendar(roomReservations);
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
    if (!dateStr || !this.roomId) return;

    const [year, month, day] = dateStr.split('-').map(Number);
    const startDate = new Date(year, month - 1, day, 0, 0, 0);
    const endDate = new Date(year, month - 1, day, 23, 59, 59);

    this.detailReservationRoomService.getOccupiedBetweenDates(
      startDate.toISOString(),
      endDate.toISOString()
    ).subscribe(allReservations => {
      const roomReservations = allReservations.filter(r => r.roomId === this.roomId);
      this.updateAvailableTimesForDate(dateStr, roomReservations);
      this.generateWeekSchedule(roomReservations);
    });
  }

  updateAvailabilityCalendar(reservations: DetailReservationRoomOutDto[]): void {
    this.generateWeekSchedule(reservations);
    this.generateMonthCalendar(reservations);

    if (this.bookingForm.get('bookingDate')?.value) {
      this.updateAvailableTimesForDate(this.bookingForm.get('bookingDate')?.value, reservations);
    }
  }

  generateWeekSchedule(reservations: DetailReservationRoomOutDto[] = []): void {
    this.weekSchedule = [];
    const startOfWeek = this.getStartOfWeek(this.selectedDate);
    const duration = parseInt(this.bookingForm.get('duration')?.value || '1');

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const currentTime = new Date();

    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(date.getDate() + i);
      const dateString = this.formatDate(date);
      const dayName = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'][date.getDay()];

      const isPastDate = date < today;

      const slots = this.baseAvailableTimes.map(time => {
        if (isPastDate) {
          return {time, available: false};
        }

        const isCurrentDay = this.isSameDay(date, new Date());
        if (isCurrentDay) {
          const [hours, minutes] = time.split(':').map(Number);
          const horasDisponibles = 19 - hours;

          if (duration > horasDisponibles) {
            return {time, available: false};
          }
        }

        const isAvailable = this.isTimeSlotAvailable(dateString, time, reservations, duration);
        return {time, available: isAvailable};
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

  generateMonthCalendar(reservations: DetailReservationRoomOutDto[] = []): void {
    this.currentMonthDays = [];
    const year = this.selectedDate.getFullYear();
    const month = this.selectedDate.getMonth();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const firstDayOfMonth = new Date(year, month, 1);
    const firstDayOfWeek = firstDayOfMonth.getDay();

    const startDay = new Date(firstDayOfMonth);
    startDay.setDate(1 - (firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1));

    for (let i = 0; i < 42; i++) {
      const date = new Date(startDay);
      date.setDate(date.getDate() + i);

      const isCurrentMonth = date.getMonth() === month;
      const isToday = this.isSameDay(date, today);
      const isPastDate = date < today;

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

  isTimeSlotAvailable(dateStr: string, timeStr: string, reservations: DetailReservationRoomOutDto[] = [], durationHours: number = 1): boolean {
    if (!reservations || reservations.length === 0) return true;

    const [year, month, day] = dateStr.split('-').map(Number);
    const [hours, minutes] = timeStr.split(':').map(Number);

    const slotStart = new Date(year, month - 1, day, hours, minutes);
    const slotEnd = new Date(slotStart);

    if (hours === 18 && durationHours > 1) {
      durationHours = 1;
    }

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

  dayHasReservations(dateStr: string, reservations: DetailReservationRoomOutDto[]): boolean {
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
      return;
    }

    this.selectedDate = selectedDate;


    const dateStr = this.formatDate(selectedDate);
    this.bookingForm.get('bookingDate')?.setValue(dateStr);


    const startDate = new Date(selectedDate);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(selectedDate);
    endDate.setHours(23, 59, 59, 999);


    this.detailReservationRoomService.getOccupiedBetweenDates(
      startDate.toISOString(),
      endDate.toISOString()
    ).subscribe(allReservations => {
      const roomReservations = allReservations.filter(r => r.roomId === this.roomId);
      this.updateAvailableTimesForDate(dateStr, roomReservations);
      this.calendarView = 'week';
      this.generateWeekSchedule(roomReservations);
    });
  }

  onDateChange(event: Event): void {
    const dateStr = (event.target as HTMLInputElement).value;
    if (!dateStr || !this.roomId) return;

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

    this.detailReservationRoomService.getOccupiedBetweenDates(
      startDate.toISOString(),
      endDate.toISOString()
    ).subscribe(allReservations => {
      const roomReservations = allReservations.filter(r => r.roomId === this.roomId);
      this.updateAvailableTimesForDate(dateStr, roomReservations);
    });
  }

  updateAvailableTimesForDate(dateStr: string, reservations: DetailReservationRoomOutDto[]): void {
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
        const horasDisponibles = 19 - hours;
        if (duration > horasDisponibles) {
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

    this.detailReservationRoomService.getOccupiedBetweenDates(
      startDate.toISOString(),
      endDate.toISOString()
    ).subscribe(allReservations => {
      const roomReservations = allReservations.filter(r => r.roomId === this.roomId);
      this.updateAvailableTimesForDate(daySchedule.date, roomReservations);
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
    if (!this.room || !this.bookingForm.valid) return 0;

    const duration = parseInt(this.bookingForm.get('duration')?.value || '0');
    return this.room.hourlyRate * duration;
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
    if (!this.bookingForm.valid || !this.room) {
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
    if (!this.roomId) return of(false);

    const startDateTime = this.createValidDateTime(date, startTime);
    const endDateTime = this.createValidDateTime(date, endTime);

    // Usar el nuevo método para verificar disponibilidad en ese rango
    return this.detailReservationRoomService.getOccupiedBetweenDates(
      this.convertLocalDateToUTC(startDateTime),
      this.convertLocalDateToUTC(endDateTime)
    ).pipe(
      switchMap(reservations => {
        const roomReservations = reservations.filter(r => r.roomId === this.roomId);

        return of(roomReservations.length === 0);
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
      reservationType: 'room',
      startDate,
      endDate,
      status: 'pending',
      depositPaymentId: null
    };

    console.log('Enviando datos de reserva:', reservationData);

    this.reservationService.create(reservationData)
      .pipe(
        switchMap(reservation => {
          const detailData: DetailReservationRoomInDto = {
            reservationId: reservation.reservationId,
            roomId: this.room!.roomId,
            startTime: startDate,
            endTime: endDate
          };

          this.createdReservationId = reservation.reservationId;

          return this.detailReservationRoomService.create(detailData).pipe(
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
          type: 'room'
        }
      });
    }
  }

  onBack(): void {
    void this.router.navigate(['/rooms']);
  }

  onEdit(): void {
    if (this.roomId && this.isAdmin) {
      void this.router.navigate([`/rooms/${this.roomId}/edit`]);
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
