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
import {finalize, switchMap} from 'rxjs/operators';
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

  // Horarios disponibles base (8am - 6pm)
  availableTimes: string[] = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00'];

  // Calendario de disponibilidad
  selectedDate: Date = new Date();
  weekSchedule: DaySchedule[] = [];
  currentMonthDays: {
    date: number,
    month: number,
    isCurrentMonth: boolean,
    hasEvents: boolean,
    isToday: boolean
  }[] = [];

  // Datos simulados de estadísticas
  bookedHours?: number = 32;
  totalBookings?: number = 8;
  averageRating?: number = 4.5;

  // Control de visualización de calendario
  calendarView = 'week'; // 'week' o 'month'

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

    // Suscribirse a cambios en la duración
    this.bookingForm.get('duration')?.valueChanges.subscribe(() => {
      this.onDurationChange();
    });
  }

  ngOnInit(): void {
    this.isAdmin = this.authService.hasRole('ADMIN');

    // Obtener ID del usuario actual
    const currentUser = this.authService.getCurrentUser();
    this.userId = currentUser?.userId;

    // Si no hay userId, intentar obtenerlo directamente
    if (!this.userId) {
      this.userId = this.authService.getUserId();
    }

    // Verificar si tenemos userId
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
    // Inicializar el calendario una vez que el componente esté listo
    if (this.workstationId) {
      setTimeout(() => {
        this.loadCalendarData();
      }, 100);
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

  // Cargar reservas existentes para comprobar disponibilidad
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

  // Cargar datos del calendario para la vista actual
  loadCalendarData(): void {
    if (!this.workstationId) return;

    this.checkingAvailability = true;

    // Determinar el rango de fechas según la vista actual
    let startDate: Date, endDate: Date;

    if (this.calendarView === 'week') {
      // Para vista semanal: desde el lunes hasta el domingo
      startDate = this.getStartOfWeek(this.selectedDate);
      endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + 6);
      endDate.setHours(23, 59, 59);
    } else {
      // Para vista mensual: todo el mes
      startDate = new Date(this.selectedDate.getFullYear(), this.selectedDate.getMonth(), 1);
      endDate = new Date(this.selectedDate.getFullYear(), this.selectedDate.getMonth() + 1, 0, 23, 59, 59);
    }

    // Convertir a strings ISO
    const startIso = startDate.toISOString();
    const endIso = endDate.toISOString();

    // Obtener reservas solo para este rango de fechas
    this.detailReservationWorkstationService.getOccupiedBetweenDates(startIso, endIso).subscribe({
      next: (allReservations) => {
        // Filtrar solo las reservas para esta estación de trabajo
        const workstationReservations = allReservations.filter(r => r.workstationId === this.workstationId);

        // Actualizar el calendario
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

  // Añadimos un método para actualizar cuando cambie la duración
  onDurationChange(): void {
    const dateStr = this.bookingForm.get('bookingDate')?.value;
    if (!dateStr || !this.workstationId) return;

    // Crear rango de fechas para ese día
    const [year, month, day] = dateStr.split('-').map(Number);
    const startDate = new Date(year, month - 1, day, 0, 0, 0);
    const endDate = new Date(year, month - 1, day, 23, 59, 59);

    // Recargar las reservas y actualizar disponibilidad con nueva duración
    this.detailReservationWorkstationService.getOccupiedBetweenDates(
      startDate.toISOString(),
      endDate.toISOString()
    ).subscribe(allReservations => {
      const workstationReservations = allReservations.filter(r => r.workstationId === this.workstationId);
      this.updateAvailableTimesForDate(dateStr, workstationReservations);
      this.generateWeekSchedule(workstationReservations);
    });
  }

  // Actualizar el calendario de disponibilidad basado en reservas existentes
  updateAvailabilityCalendar(reservations: DetailReservationWorkstationOutDto[]): void {
    // Regenerar el calendario con las reservas actualizadas
    this.generateWeekSchedule(reservations);
    this.generateMonthCalendar(reservations);

    // Si hay una fecha seleccionada en el formulario, actualizar los horarios disponibles
    if (this.bookingForm.get('bookingDate')?.value) {
      this.updateAvailableTimesForDate(this.bookingForm.get('bookingDate')?.value, reservations);
    }
  }

  // Generar el calendario semanal
  generateWeekSchedule(reservations: DetailReservationWorkstationOutDto[] = []): void {
    this.weekSchedule = [];
    const startOfWeek = this.getStartOfWeek(this.selectedDate);
    // Obtener la duración actual del formulario
    const duration = parseInt(this.bookingForm.get('duration')?.value || '1');

    // Generar los 7 días de la semana
    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(date.getDate() + i);

      const dateString = this.formatDate(date);
      const dayName = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'][date.getDay()];

      // Crear slots de tiempo para este día con la duración correcta
      const slots = this.availableTimes.map(time => {
        // Verificar disponibilidad considerando la duración
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

  // Obtener el primer día de la semana (lunes) para una fecha dada
  getStartOfWeek(date: Date): Date {
    const startOfWeek = new Date(date);
    const day = startOfWeek.getDay();
    const diff = day === 0 ? 6 : day - 1; // Si es domingo (0), retrocede 6 días
    startOfWeek.setDate(startOfWeek.getDate() - diff);
    startOfWeek.setHours(0, 0, 0, 0);
    return startOfWeek;
  }

  // Generar vista mensual del calendario
  generateMonthCalendar(reservations: DetailReservationWorkstationOutDto[] = []): void {
    this.currentMonthDays = [];
    const year = this.selectedDate.getFullYear();
    const month = this.selectedDate.getMonth();
    const today = new Date();

    // Crear primer día del mes
    const firstDayOfMonth = new Date(year, month, 1);
    // Obtener día de la semana del primer día (0 = domingo, 1 = lunes, etc)
    const firstDayOfWeek = firstDayOfMonth.getDay();

    // Calcular día de inicio (puede ser del mes anterior)
    const startDay = new Date(firstDayOfMonth);
    startDay.setDate(1 - (firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1));

    // Generar 42 días (6 semanas) para cubrir el mes completo
    for (let i = 0; i < 42; i++) {
      const date = new Date(startDay);
      date.setDate(date.getDate() + i);

      const isCurrentMonth = date.getMonth() === month;
      const isToday = this.isSameDay(date, today);

      // Verificar si este día tiene eventos (reservas)
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

  // Verifica si una fecha/hora está disponible considerando la duración
  isTimeSlotAvailable(dateStr: string, timeStr: string, reservations: DetailReservationWorkstationOutDto[] = [], durationHours: number = 1): boolean {
    // Si no hay reservas, todos los horarios están disponibles
    if (!reservations || reservations.length === 0) return true;

    // Crear fecha/hora para comparar
    const [year, month, day] = dateStr.split('-').map(Number);
    const [hours, minutes] = timeStr.split(':').map(Number);

    const slotStart = new Date(year, month - 1, day, hours, minutes);
    const slotEnd = new Date(slotStart);
    slotEnd.setHours(slotStart.getHours() + durationHours); // Considerar la duración completa

    // Verificar si hay algún conflicto con las reservas existentes
    for (const reservation of reservations) {
      const reservationStart = new Date(reservation.startTime);
      const reservationEnd = new Date(reservation.endTime);

      // Hay conflicto si:
      // 1. El inicio del slot está dentro del período reservado
      // 2. El fin del slot está dentro del período reservado
      // 3. El slot contiene completamente a la reserva
      if (
        (slotStart >= reservationStart && slotStart < reservationEnd) ||
        (slotEnd > reservationStart && slotEnd <= reservationEnd) ||
        (slotStart <= reservationStart && slotEnd >= reservationEnd)
      ) {
        return false; // No está disponible
      }
    }

    return true; // Está disponible
  }

  // Verificar si un día tiene alguna reserva
  dayHasReservations(dateStr: string, reservations: DetailReservationWorkstationOutDto[]): boolean {
    if (!reservations || reservations.length === 0) return false;

    // Crear fecha para comparar (solo la fecha, sin hora)
    const [year, month, day] = dateStr.split('-').map(Number);
    const dayStart = new Date(year, month - 1, day, 0, 0, 0);
    const dayEnd = new Date(year, month - 1, day, 23, 59, 59);

    // Verificar si hay alguna reserva en este día
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

  isSelectedDay(day: {date: number, month: number, isCurrentMonth: boolean}): boolean {
    if (!day.isCurrentMonth) return false;

    return this.isSameDay(
      new Date(this.selectedDate.getFullYear(), day.month, day.date),
      this.selectedDate
    );
  }

  selectMonthDay(day: {date: number, month: number, isCurrentMonth: boolean}): void {
    if (!day.isCurrentMonth) return;

    // Crear objeto de fecha para el día seleccionado
    const selectedDate = new Date(this.selectedDate.getFullYear(), day.month, day.date);
    this.selectedDate = selectedDate;

    // Formatear fecha para el formulario
    const dateStr = this.formatDate(selectedDate);
    this.bookingForm.get('bookingDate')?.setValue(dateStr);

    // Crear rango de fechas para ese día
    const startDate = new Date(selectedDate);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(selectedDate);
    endDate.setHours(23, 59, 59, 999);

    // Obtener reservas para ese día específico
    this.detailReservationWorkstationService.getOccupiedBetweenDates(
      startDate.toISOString(),
      endDate.toISOString()
    ).subscribe(allReservations => {
      // Filtrar para esta estación específica
      const workstationReservations = allReservations.filter(r => r.workstationId === this.workstationId);
      this.updateAvailableTimesForDate(dateStr, workstationReservations);

      // Cambiar a vista semanal para ver los slots disponibles
      this.calendarView = 'week';
      this.generateWeekSchedule(workstationReservations);
    });
  }

  // Cuando el usuario selecciona una fecha en el formulario
  onDateChange(event: Event): void {
    const dateStr = (event.target as HTMLInputElement).value;
    if (!dateStr || !this.workstationId) return;

    // Crear rango de fechas para ese día
    const [year, month, day] = dateStr.split('-').map(Number);
    const startDate = new Date(year, month - 1, day, 0, 0, 0);
    const endDate = new Date(year, month - 1, day, 23, 59, 59);

    // Obtener reservas para ese día específico
    this.detailReservationWorkstationService.getOccupiedBetweenDates(
      startDate.toISOString(),
      endDate.toISOString()
    ).subscribe(allReservations => {
      // Filtrar para esta estación específica
      const workstationReservations = allReservations.filter(r => r.workstationId === this.workstationId);
      this.updateAvailableTimesForDate(dateStr, workstationReservations);
    });
  }

  // Actualizar los horarios disponibles para una fecha específica
  updateAvailableTimesForDate(dateStr: string, reservations: DetailReservationWorkstationOutDto[]): void {
    // Obtener la duración actual del formulario
    const duration = parseInt(this.bookingForm.get('duration')?.value || '1');

    // Filtrar horarios disponibles considerando la duración completa
    this.availableTimes = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00']
      .filter(time => {
        // Verificar si este horario está disponible por toda la duración
        return this.isTimeSlotAvailable(dateStr, time, reservations, duration);
      });

    // Si la hora seleccionada ya no está disponible, resetear
    const currentTime = this.bookingForm.get('startTime')?.value;
    if (currentTime && !this.availableTimes.includes(currentTime)) {
      this.bookingForm.get('startTime')?.setValue('');
    }
  }

  // Seleccionar una fecha del calendario
  selectDate(daySchedule: DaySchedule): void {
    this.selectedDate = daySchedule.dateObj;
    this.bookingForm.get('bookingDate')?.setValue(daySchedule.date);

    // Crear rango de fechas para ese día
    const startDate = new Date(daySchedule.dateObj);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(daySchedule.dateObj);
    endDate.setHours(23, 59, 59, 999);

    // Obtener reservas para ese día específico
    this.detailReservationWorkstationService.getOccupiedBetweenDates(
      startDate.toISOString(),
      endDate.toISOString()
    ).subscribe(allReservations => {
      // Filtrar para esta estación específica
      const workstationReservations = allReservations.filter(r => r.workstationId === this.workstationId);
      this.updateAvailableTimesForDate(daySchedule.date, workstationReservations);
    });
  }

  // Seleccionar un horario específico
  selectTimeSlot(daySchedule: DaySchedule, slot: TimeSlot): void {
    if (!slot.available) return;

    // Establecer la fecha y hora en el formulario
    this.bookingForm.patchValue({
      bookingDate: daySchedule.date,
      startTime: slot.time
    });

    // Abrir el formulario de reserva si no está abierto
    if (!this.showBookingForm) {
      this.toggleBookingForm();
    }
  }

  toggleBookingForm(): void {
    this.showBookingForm = !this.showBookingForm;
    this.successMessage = null;
    this.errorMessage = null;

    // Resetear el formulario cuando se muestra
    if (this.showBookingForm) {
      this.bookingForm.reset();
      this.bookingForm.patchValue({
        duration: '1'
      });

      // Establecer la fecha seleccionada o actual
      const today = this.formatDate(new Date());
      this.bookingForm.get('bookingDate')?.setValue(today);

      // Cargar horarios disponibles
      this.onDateChange({target: {value: today}} as unknown as Event);
    }
  }

  calculatePrice(): number {
    if (!this.workstation || !this.bookingForm.valid) return 0;

    const duration = parseInt(this.bookingForm.get('duration')?.value || '0');
    return this.workstation.hourlyRate * duration;
  }

  calculateEndTime(startTime: string, durationHours: number): string {
    // Convertir startTime (formato "HH:mm") a Date
    const [hours, minutes] = startTime.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, minutes, 0, 0);

    // Añadir la duración en horas
    date.setTime(date.getTime() + (durationHours * 60 * 60 * 1000));

    // Devolver en formato "HH:mm"
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

    this.reservationLoading = true;
    this.errorMessage = null;
    this.successMessage = null;

    try {
      const bookingDate = this.bookingForm.get('bookingDate')?.value;
      const startTime = this.bookingForm.get('startTime')?.value;
      const duration = parseInt(this.bookingForm.get('duration')?.value || '1');
      const endTime = this.calculateEndTime(startTime, duration);

      // Verificar disponibilidad antes de crear la reserva
      this.checkAvailabilityBeforeBooking(bookingDate, startTime, endTime).subscribe({
        next: (isAvailable) => {
          if (!isAvailable) {
            this.errorMessage = 'El horario seleccionado ya no está disponible. Por favor elige otro.';
            this.reservationLoading = false;
            this.loadExistingReservations(); // Actualizar calendario
            return;
          }

          // Si está disponible, crear la reserva
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

  // Verificar disponibilidad antes de reservar
  checkAvailabilityBeforeBooking(date: string, startTime: string, endTime: string): Observable<boolean> {
    if (!this.workstationId) return of(false);

    // Crear fechas para el rango a verificar
    const startDateTime = this.createValidDateTime(date, startTime);
    const endDateTime = this.createValidDateTime(date, endTime);

    // Verificar disponibilidad en ese rango
    return this.detailReservationWorkstationService.getOccupiedBetweenDates(
      this.convertLocalDateToUTC(startDateTime),
      this.convertLocalDateToUTC(endDateTime)
    ).pipe(
      switchMap(reservations => {
        // Filtrar solo las reservas para esta estación
        const workstationReservations = reservations.filter(r => r.workstationId === this.workstationId);

        // Si hay alguna reserva en este período para esta estación, no está disponible
        return of(workstationReservations.length === 0);
      })
    );
  }

  // Crear la reserva
  createReservation(bookingDate: string, startTime: string, endTime: string): void {
    // Crear fechas correctamente
    const startDateTime = this.createValidDateTime(bookingDate, startTime);
    const endDateTime = this.createValidDateTime(bookingDate, endTime);

    // Convertir a ISO string corrigiendo el offset de zona horaria
    const startDate = this.convertLocalDateToUTC(startDateTime);
    const endDate = this.convertLocalDateToUTC(endDateTime);

    // Datos para la reserva general
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
          return this.detailReservationWorkstationService.create(detailData);
        }),
        finalize(() => {
          this.reservationLoading = false;
        })
      )
      .subscribe({
        next: () => {
          this.successMessage = 'Reserva realizada correctamente';
          setTimeout(() => {
            this.showBookingForm = false;
            // Actualizar calendario y disponibilidad
            this.loadExistingReservations();
          }, 2000);
        },
        error: (err) => {
          console.error('Error al crear reserva:', err);
          this.errorMessage = 'No se pudo completar la reserva. Por favor intenta de nuevo.';
        }
      });
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
    // Asegurarse de que la fecha y hora son strings
    if (!dateStr || !timeStr) {
      throw new Error('Fecha u hora no válidas');
    }

    // Separar las horas y minutos
    const [hours, minutes] = timeStr.split(':').map(Number);

    // Crear una nueva fecha con la fecha y hora especificadas (en hora local)
    const date = new Date(dateStr);
    date.setHours(hours, minutes, 0, 0);

    return date;
  }

  convertLocalDateToUTC(date: Date): string {
    // Obtener el offset en minutos y convertirlo a milisegundos
    const timezoneOffset = date.getTimezoneOffset() * 60000;

    // Crear nueva fecha ajustada a UTC
    const utcDate = new Date(date.getTime() - timezoneOffset);

    // Devolver en formato ISO
    return utcDate.toISOString();
  }

  // Métodos auxiliares para fechas
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

  // Cambiar entre vista semanal y mensual
  toggleCalendarView(): void {
    this.calendarView = this.calendarView === 'week' ? 'month' : 'week';
    // Recargar datos para la vista seleccionada
    this.loadCalendarData();
  }

  // Navegar a la semana anterior/siguiente
  navigateWeek(direction: number): void {
    const newDate = new Date(this.selectedDate);
    newDate.setDate(newDate.getDate() + (direction * 7));

    // Actualizar fecha seleccionada y recargar datos
    this.selectedDate = newDate;
    this.loadCalendarData();
  }

  // Navegar al mes anterior/siguiente
  navigateMonth(direction: number): void {
    const newDate = new Date(this.selectedDate);
    newDate.setMonth(newDate.getMonth() + direction);

    // Actualizar fecha seleccionada y recargar datos
    this.selectedDate = newDate;
    this.loadCalendarData();
  }
}
