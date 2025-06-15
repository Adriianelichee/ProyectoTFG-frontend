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
  minDate: string; // Para establecer la fecha mínima permitida

  // Horarios disponibles base (8am - 6pm)
  baseAvailableTimes: string[] = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00'];
  availableTimes: string[] = [];

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
  bookedHours?: number = 45;
  totalBookings?: number = 12;
  averageRating?: number = 4.7;
  createdReservationId?: number;

  // Control de visualización de calendario
  calendarView = 'week'; // 'week' o 'month'
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
    // Configurar fecha mínima como hoy
    this.minDate = this.formatDate(new Date());

    this.bookingForm = this.fb.group({
      bookingDate: [this.minDate, Validators.required],
      startTime: ['', Validators.required],
      duration: ['1', [Validators.required, Validators.min(1), Validators.max(8)]]
    });

    // Suscribirse a cambios en la duración y hora de inicio
    this.bookingForm.get('duration')?.valueChanges.subscribe(() => {
      this.onDurationChange();
    });

    this.bookingForm.get('startTime')?.valueChanges.subscribe(() => {
      this.onStartTimeChange();
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
        this.roomId = +idParam;
        this.loadRoom();
      } else {
        this.errorMessage = 'ID de sala no proporcionado';
      }
    });
  }

  ngAfterViewInit(): void {
    // Inicializar el calendario una vez que el componente esté listo
    if (this.roomId) {
      setTimeout(() => {
        this.loadCalendarData();
      }, 100);
    }
  }

  // Nuevo método para manejar cambios en hora de inicio
  onStartTimeChange(): void {
    const startTime = this.bookingForm.get('startTime')?.value;
    if (!startTime) return;

    // Obtener la hora actual seleccionada
    const [hours, minutes] = startTime.split(':').map(Number);

    // Calcular horas disponibles hasta las 19:00
    const horasDisponibles = 19 - hours;

    // Ajustar duración máxima según la hora seleccionada
    if (horasDisponibles < 8) {
      // Limitar la duración al máximo de horas disponibles
      const currentDuration = parseInt(this.bookingForm.get('duration')?.value || '1');

      if (currentDuration > horasDisponibles) {
        // Ajustar automáticamente la duración al máximo permitido
        this.bookingForm.get('duration')?.setValue(horasDisponibles.toString());
      }

      // Desactivar opciones de duración que excedan el límite
      this.actualizarOpcionesDeHoras(horasDisponibles);
    } else {
      // Habilitar todas las opciones de duración
      this.actualizarOpcionesDeHoras(8);
    }
  }

  actualizarOpcionesDeHoras(maximoHoras: number): void {
    // Actualizar variables para la interfaz
    this.duracionMaximaPermitida = maximoHoras;

    // Actualizar el formulario para reflejar las nuevas opciones
    const duracionControl = this.bookingForm.get('duration');
    if (duracionControl && duracionControl.value > maximoHoras) {
      duracionControl.setValue(maximoHoras.toString());
    }

    // Si la duración es 1, siempre permitir edición
    if (maximoHoras > 1) {
      duracionControl?.enable();
    } else {
      // Verificar que el control existe antes de modificarlo
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

  // Cargar reservas existentes para comprobar disponibilidad
  loadExistingReservations(): void {
    if (!this.roomId) return;

    this.checkingAvailability = true;

    // Usar el nuevo método específico para obtener reservas para esta sala
    this.detailReservationRoomService.getByRoom(this.roomId).subscribe({
      next: (reservations) => {
        // Actualizar horarios disponibles basados en reservas existentes
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
    if (!this.roomId) return;

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
    this.detailReservationRoomService.getOccupiedBetweenDates(startIso, endIso).subscribe({
      next: (allReservations) => {
        // Filtrar solo las reservas para esta sala
        const roomReservations = allReservations.filter(r => r.roomId === this.roomId);

        // Actualizar el calendario
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

  // Añadimos un método para actualizar cuando cambie la duración
  onDurationChange(): void {
    const dateStr = this.bookingForm.get('bookingDate')?.value;
    if (!dateStr || !this.roomId) return;

    // Crear rango de fechas para ese día
    const [year, month, day] = dateStr.split('-').map(Number);
    const startDate = new Date(year, month - 1, day, 0, 0, 0);
    const endDate = new Date(year, month - 1, day, 23, 59, 59);

    // Recargar las reservas y actualizar disponibilidad con nueva duración
    this.detailReservationRoomService.getOccupiedBetweenDates(
      startDate.toISOString(),
      endDate.toISOString()
    ).subscribe(allReservations => {
      const roomReservations = allReservations.filter(r => r.roomId === this.roomId);
      this.updateAvailableTimesForDate(dateStr, roomReservations);
      this.generateWeekSchedule(roomReservations);
    });
  }

  // Actualizar el calendario de disponibilidad basado en reservas existentes
  updateAvailabilityCalendar(reservations: DetailReservationRoomOutDto[]): void {
    // Regenerar el calendario con las reservas actualizadas
    this.generateWeekSchedule(reservations);
    this.generateMonthCalendar(reservations);

    // Si hay una fecha seleccionada en el formulario, actualizar los horarios disponibles
    if (this.bookingForm.get('bookingDate')?.value) {
      this.updateAvailableTimesForDate(this.bookingForm.get('bookingDate')?.value, reservations);
    }
  }

  // Generar el calendario semanal
  generateWeekSchedule(reservations: DetailReservationRoomOutDto[] = []): void {
    this.weekSchedule = [];
    const startOfWeek = this.getStartOfWeek(this.selectedDate);
    // Obtener la duración actual del formulario
    const duration = parseInt(this.bookingForm.get('duration')?.value || '1');

    // Obtener la fecha actual para comparar (solo la fecha, sin hora)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const currentTime = new Date();

    // Generar los 7 días de la semana
    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(date.getDate() + i);
      const dateString = this.formatDate(date);
      const dayName = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'][date.getDay()];

      // Verificar si la fecha es anterior a hoy
      const isPastDate = date < today;

      // Crear slots de tiempo específicos para este día
      const slots = this.baseAvailableTimes.map(time => {
        // Si es fecha pasada, marcar como no disponible
        if (isPastDate) {
          return {time, available: false};
        }

        // Solo para el día actual, verificar si la hora ya pasó
        const isCurrentDay = this.isSameDay(date, new Date());
        if (isCurrentDay) {
          const [hours, minutes] = time.split(':').map(Number);
          const horasDisponibles = 19 - hours;

          if (duration > horasDisponibles) {
            return {time, available: false};
          }
        }

        // Verificar disponibilidad considerando la duración
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
  generateMonthCalendar(reservations: DetailReservationRoomOutDto[] = []): void {
    this.currentMonthDays = [];
    const year = this.selectedDate.getFullYear();
    const month = this.selectedDate.getMonth();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

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
      const isPastDate = date < today;

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
  isTimeSlotAvailable(dateStr: string, timeStr: string, reservations: DetailReservationRoomOutDto[] = [], durationHours: number = 1): boolean {
    // Si no hay reservas, todos los horarios están disponibles
    if (!reservations || reservations.length === 0) return true;

    // Crear fecha/hora para comparar
    const [year, month, day] = dateStr.split('-').map(Number);
    const [hours, minutes] = timeStr.split(':').map(Number);

    const slotStart = new Date(year, month - 1, day, hours, minutes);
    const slotEnd = new Date(slotStart);

    // Caso especial: si la hora es 18:00, solo permitir 1 hora máximo
    if (hours === 18 && durationHours > 1) {
      durationHours = 1;
    }

    slotEnd.setHours(slotStart.getHours() + durationHours); // Considerar la duración completa

    // Verificar si hay algún conflicto con las reservas existentes
    for (const reservation of reservations) {
      const reservationStart = new Date(reservation.startTime);
      const reservationEnd = new Date(reservation.endTime);

      // Hay conflicto si:
      // 1. El inicio del slot está dentro del período reservado
      // 2. El fin del slot está dentro del período reservado
      // 3. El slot contiene completamente a la reserva
      // 4. Cualquier parte del rango del slot se solapa con la reserva
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
  dayHasReservations(dateStr: string, reservations: DetailReservationRoomOutDto[]): boolean {
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

  isSelectedDay(day: { date: number, month: number, isCurrentMonth: boolean }): boolean {
    if (!day.isCurrentMonth) return false;

    return this.isSameDay(
      new Date(this.selectedDate.getFullYear(), day.month, day.date),
      this.selectedDate
    );
  }

  selectMonthDay(day: { date: number, month: number, isCurrentMonth: boolean }): void {
    if (!day.isCurrentMonth) return;

    // Crear objeto de fecha para el día seleccionado
    const selectedDate = new Date(this.selectedDate.getFullYear(), day.month, day.date);

    // Verificar si la fecha es pasada
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (selectedDate < today) {
      return; // No permitir seleccionar fechas pasadas
    }

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
    this.detailReservationRoomService.getOccupiedBetweenDates(
      startDate.toISOString(),
      endDate.toISOString()
    ).subscribe(allReservations => {
      // Filtrar para esta sala específica
      const roomReservations = allReservations.filter(r => r.roomId === this.roomId);
      this.updateAvailableTimesForDate(dateStr, roomReservations);

      // Cambiar a vista semanal para ver los slots disponibles
      this.calendarView = 'week';
      this.generateWeekSchedule(roomReservations);
    });
  }

  // Cuando el usuario selecciona una fecha en el formulario
  onDateChange(event: Event): void {
    const dateStr = (event.target as HTMLInputElement).value;
    if (!dateStr || !this.roomId) return;

    // Verificar si la fecha es pasada
    const selectedDate = new Date(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (selectedDate < today) {
      this.errorMessage = 'No puedes seleccionar fechas pasadas';
      return;
    }

    this.errorMessage = null;

    // Crear rango de fechas para ese día
    const [year, month, day] = dateStr.split('-').map(Number);
    const startDate = new Date(year, month - 1, day, 0, 0, 0);
    const endDate = new Date(year, month - 1, day, 23, 59, 59);

    // Obtener reservas para ese día específico
    this.detailReservationRoomService.getOccupiedBetweenDates(
      startDate.toISOString(),
      endDate.toISOString()
    ).subscribe(allReservations => {
      // Filtrar para esta sala específica
      const roomReservations = allReservations.filter(r => r.roomId === this.roomId);
      this.updateAvailableTimesForDate(dateStr, roomReservations);
    });
  }

  // Actualizar los horarios disponibles para una fecha específica
  updateAvailableTimesForDate(dateStr: string, reservations: DetailReservationRoomOutDto[]): void {
    // Verificar si la fecha es hoy para filtrar horarios pasados
    const [year, month, day] = dateStr.split('-').map(Number);
    const selectedDate = new Date(year, month - 1, day);
    const today = new Date();

    // Comparar solo las fechas sin considerar el tiempo
    today.setHours(0, 0, 0, 0);
    const selectedDay = new Date(selectedDate);
    selectedDay.setHours(0, 0, 0, 0);

    const isToday = this.isSameDay(selectedDate, new Date());

    // Obtener la duración actual del formulario
    const duration = parseInt(this.bookingForm.get('duration')?.value || '1');

    // Array temporal para guardar los horarios disponibles
    const availableSlots: string[] = [];

    // Filtrar horarios disponibles considerando la duración completa
    this.baseAvailableTimes.forEach(time => {
      // Solo filtrar horas pasadas si es el día actual
      if (isToday) {
        const [hours, minutes] = time.split(':').map(Number);
        const horasDisponibles = 19 - hours;
        if (duration > horasDisponibles) {
          return;
        }
      }

      // Verificar si este horario está disponible por toda la duración
      if (this.isTimeSlotAvailable(dateStr, time, reservations, duration)) {
        availableSlots.push(time);
      }
    });

    // Actualizar el array de horarios disponibles
    this.availableTimes = availableSlots;

    // Si la hora seleccionada ya no está disponible, resetear
    const currentTime = this.bookingForm.get('startTime')?.value;
    if (currentTime && !this.availableTimes.includes(currentTime)) {
      this.bookingForm.get('startTime')?.setValue('');
    }
  }

  // Seleccionar una fecha del calendario
  selectDate(daySchedule: DaySchedule): void {
    // Verificar si la fecha es pasada
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (daySchedule.dateObj < today) {
      return; // No permitir seleccionar fechas pasadas
    }

    this.selectedDate = daySchedule.dateObj;
    this.bookingForm.get('bookingDate')?.setValue(daySchedule.date);

    // Crear rango de fechas para ese día
    const startDate = new Date(daySchedule.dateObj);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(daySchedule.dateObj);
    endDate.setHours(23, 59, 59, 999);

    // Obtener reservas para ese día específico
    this.detailReservationRoomService.getOccupiedBetweenDates(
      startDate.toISOString(),
      endDate.toISOString()
    ).subscribe(allReservations => {
      // Filtrar para esta sala específica
      const roomReservations = allReservations.filter(r => r.roomId === this.roomId);
      this.updateAvailableTimesForDate(daySchedule.date, roomReservations);
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
        duration: '1',
        bookingDate: this.minDate // Usar fecha actual como mínima
      });

      // Cargar horarios disponibles
      this.onDateChange({target: {value: this.minDate}} as unknown as Event);
    }
  }

  calculatePrice(): number {
    if (!this.room || !this.bookingForm.valid) return 0;

    const duration = parseInt(this.bookingForm.get('duration')?.value || '0');
    return this.room.hourlyRate * duration;
  }

  calculateEndTime(startTime: string, durationHours: number): string {
    // Convertir startTime (formato "HH:mm") a Date
    const [hours, minutes] = startTime.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, minutes, 0, 0);

    // Caso especial para las 18:00
    if (hours === 18 && durationHours > 1) {
      durationHours = 1;
    }

    // Añadir la duración en horas
    date.setTime(date.getTime() + (durationHours * 60 * 60 * 1000));

    // Devolver en formato "HH:mm"
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

    // Verificar si la fecha es pasada
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

      // Caso especial para las 18:00
      if (startTime === '18:00' && duration > 1) {
        duration = 1;
      }

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
    if (!this.roomId) return of(false);

    // Crear fechas para el rango a verificar
    const startDateTime = this.createValidDateTime(date, startTime);
    const endDateTime = this.createValidDateTime(date, endTime);

    // Usar el nuevo método para verificar disponibilidad en ese rango
    return this.detailReservationRoomService.getOccupiedBetweenDates(
      this.convertLocalDateToUTC(startDateTime),
      this.convertLocalDateToUTC(endDateTime)
    ).pipe(
      switchMap(reservations => {
        // Filtrar solo las reservas para esta sala
        const roomReservations = reservations.filter(r => r.roomId === this.roomId);

        // Si hay alguna reserva en este período para esta sala, no está disponible
        return of(roomReservations.length === 0);
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

          // Guardar el ID de la reserva para redirigir al pago
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

          // Redirigir al usuario a la página de pago
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
