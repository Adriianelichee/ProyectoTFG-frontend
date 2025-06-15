import {Component, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {ReactiveFormsModule, FormBuilder, FormGroup, Validators} from '@angular/forms';
import {Router, ActivatedRoute} from '@angular/router';
import {CleaningService} from '../../../core/api/cleaning.service';
import {FloorService} from '../../../core/api/floor.service';
import {RoomService} from '../../../core/api/room.service';
import {WorkstationService} from '../../../core/api/workstation.service';
import {CompanyService} from '../../../core/api/company.service';
import {AuthService} from '../../../core/auth/auth.service';
import {CleaningInDto} from '../../../core/models/cleaning-in-dto';
import {CleaningOutDto} from '../../../core/models/cleaning-out-dto';
import {FloorOutDto} from '../../../core/models/floor-out-dto';
import {RoomOutDto} from '../../../core/models/room-out-dto';
import {WorkstationOutDto} from '../../../core/models/workstation-out-dto';
import {format} from 'date-fns';

@Component({
  selector: 'app-cleaning-form',
  templateUrl: './cleaning-form.component.html',
  styleUrls: ['./cleaning-form.component.css'],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule]
})
export class CleaningFormComponent implements OnInit {
  cleaningForm!: FormGroup;
  cleaningId?: number;
  isEdit = false;
  loading = false;
  errorMessage: string | null = null;

  floors: FloorOutDto[] = [];
  rooms: RoomOutDto[] = [];
  workstations: WorkstationOutDto[] = [];
  filteredRooms: RoomOutDto[] = [];
  filteredWorkstations: WorkstationOutDto[] = [];
  successMessage: string | null = null;


  userId: number = 0;
  companyId: number = 0;
  companyName: string = '';
  minDate: string = '';

  constructor(
    private fb: FormBuilder,
    private cleaningService: CleaningService,
    private floorService: FloorService,
    private roomService: RoomService,
    private workstationService: WorkstationService,
    private companyService: CompanyService,
    private authService: AuthService,
    private route: ActivatedRoute,
    private router: Router
  ) {
    // Establecer la fecha mínima como ahora en formato YYYY-MM-DDThh:mm
    const now = new Date();
    this.minDate = format(now, "yyyy-MM-dd'T'HH:mm");
  }

  ngOnInit(): void {
    this.initForm();
    this.loadUserInfo();
    this.loadFloors();

    this.route.paramMap.subscribe((params) => {
      const idParam = params.get('id');
      if (idParam) {
        this.cleaningId = Number(idParam);
        this.isEdit = true;
        this.loadCleaning(this.cleaningId);
      }
    });

    // Manejamos los cambios en el selector de piso
    this.floorIdControl.valueChanges.subscribe(floorId => {
      this.roomIdControl.setValue(null);
      this.workstationIdControl.setValue(null);

      if (floorId) {
        this.filterRoomsByFloor(floorId);
      } else {
        this.filteredRooms = [];
        this.filteredWorkstations = [];
      }
    });

    // Manejamos los cambios en el selector de sala
    this.roomIdControl.valueChanges.subscribe(roomId => {
      this.workstationIdControl.setValue(null);

      if (roomId) {
        this.filterWorkstationsByRoom(roomId);
      } else {
        this.filteredWorkstations = [];
      }
    });
  }

  private initForm(): void {
    this.cleaningForm = this.fb.group({
      cleaningDate: [format(new Date(), "yyyy-MM-dd'T'HH:mm"), Validators.required],
      floorId: [null, Validators.required],
      roomId: [null],
      workstationId: [null],
      notes: [''],
      termsAccepted: [false, Validators.requiredTrue]
    });
  }

  private loadUserInfo(): void {
    const user = this.authService.getCurrentUser();
    if (user && user.userId && user.companyId) {
      this.userId = user.userId;
      this.companyId = user.companyId;

      // Cargar el nombre de la compañía
      this.companyService.getById(this.companyId).subscribe({
        next: (company) => {
          this.companyName = company.companyName;
        },
        error: (err) => {
          console.error('Error al cargar información de la compañía:', err);
        }
      });
    } else {
      this.errorMessage = 'No se pudo obtener la información del usuario';
      // Redireccionar al login si no hay usuario autenticado
      setTimeout(() => {
        this.router.navigate(['/auth/login']);
      }, 2000);
    }
  }

  private loadFloors(): void {
    this.loading = true;

    this.floorService.getByCompanyId(this.companyId).subscribe({
      next: (floors) => {
        this.floors = floors;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error al cargar pisos:', err);
        this.errorMessage = 'No se pudieron cargar los pisos disponibles';
        this.loading = false;
      }
    });

    // Cargamos todas las habitaciones y puestos de trabajo disponibles
    this.loadAllRooms();
    this.loadAllWorkstations();
  }

  private loadAllRooms(): void {
    this.roomService.getAll().subscribe({
      next: (rooms) => {
        this.rooms = rooms;
      },
      error: (err) => {
        console.error('Error al cargar salas:', err);
      }
    });
  }

  private loadAllWorkstations(): void {
    this.workstationService.getAll().subscribe({
      next: (workstations) => {
        this.workstations = workstations;
      },
      error: (err) => {
        console.error('Error al cargar puestos de trabajo:', err);
      }
    });
  }

  private filterRoomsByFloor(floorId: number): void {
    this.filteredRooms = this.rooms.filter(room => room.floorId === floorId);
  }

  private filterWorkstationsByRoom(roomId: number): void {
    // Necesitamos modificar esta función para adaptarla a la estructura de WorkstationOutDto
    // Ya que WorkstationOutDto no tiene roomId, sino floorId
    const selectedRoom = this.rooms.find(room => room.roomId === roomId);
    if (selectedRoom) {
      // Filtramos por el mismo floorId que la sala seleccionada
      this.filteredWorkstations = this.workstations.filter(
        workstation => workstation.floorId === selectedRoom.floorId
      );
    } else {
      this.filteredWorkstations = [];
    }
  }

  private loadCleaning(id: number): void {
    this.loading = true;
    this.errorMessage = null;

    this.cleaningService.getById(id).subscribe({
      next: (data: CleaningOutDto) => {
        // Verificar que la solicitud pertenece al usuario actual
        if (data.userId !== this.userId) {
          this.errorMessage = 'No tiene permiso para editar esta solicitud';
          this.router.navigate(['/services/cleaning']);
          return;
        }

        // Formatear la fecha para el formato YYYY-MM-DDThh:mm que espera el input datetime-local
        const cleaningDate = data.cleaningDate ? format(new Date(data.cleaningDate), "yyyy-MM-dd'T'HH:mm") : '';

        // Cargar datos en el formulario
        this.cleaningForm.patchValue({
          cleaningDate: cleaningDate,
          floorId: data.floorId,
          roomId: data.roomId,
          workstationId: data.workstationId,
          notes: data.notes
        });

        // Aseguramos que se filtren las salas y puestos de trabajo
        if (data.floorId) {
          this.filterRoomsByFloor(data.floorId);
        }
        if (data.roomId) {
          this.filterWorkstationsByRoom(data.roomId);
        }

        this.loading = false;
      },
      error: (err) => {
        console.error('Error cargando solicitud de limpieza:', err);
        this.errorMessage = 'No se pudo cargar los datos de la solicitud';
        this.loading = false;
      }
    });
  }

  onSubmit(): void {
    if (this.cleaningForm.invalid) return;

    this.errorMessage = null;
    this.successMessage = null;

    if (!this.validateIds()) {
      return;
    }

    const formattedDate = this.formatDateForBackend(this.cleaningDateControl.value);

    const dto: CleaningInDto = {
      userId: this.userId,
      cleaningDate: formattedDate,
      floorId: +this.floorIdControl.value,
      roomId: this.roomIdControl.value ? +this.roomIdControl.value : null,
      workstationId: this.workstationIdControl.value ? +this.workstationIdControl.value : null,
      notes: this.notesControl.value || ''
    };

    console.log('Enviando DTO:', dto);

    this.loading = true;

    if (this.isEdit && this.cleaningId != null) {
      this.cleaningService.update(this.cleaningId, dto).subscribe({
        next: () => {
          this.loading = false;
          this.successMessage = 'La solicitud de limpieza se ha actualizado correctamente';
          setTimeout(() => {
            this.router.navigate(['/services/cleaning/requests']);
          }, 2000);
        },
        error: (err) => {
          console.error('Error al actualizar solicitud de limpieza:', err);
          this.errorMessage = 'Error al actualizar la solicitud de limpieza';
          this.loading = false;
        }
      });
    } else {
      this.cleaningService.create(dto).subscribe({
        next: () => {
          this.loading = false;
          this.successMessage = 'La solicitud de limpieza se ha enviado correctamente';
          setTimeout(() => {
            this.router.navigate(['/services/cleaning/requests']);
          }, 2000);
        },
        error: (err) => {
          console.error('Error al crear solicitud de limpieza:', err);
          this.errorMessage = 'Error al crear la solicitud de limpieza';
          this.loading = false;
        }
      });
    }
  }

  private formatDateForBackend(dateString: string): string {
    try {
      // Crear un objeto Date a partir del string
      const date = new Date(dateString);

      // Verificar que la fecha es válida
      if (isNaN(date.getTime())) {
        throw new Error('Fecha inválida');
      }

      // Formatear la fecha en formato ISO 8601 (UTC)
      return date.toISOString();
    } catch (error) {
      console.error('Error al formatear la fecha:', error);
      // En caso de error, devolver la fecha actual
      return new Date().toISOString();
    }
  }

  private validateIds(): boolean {
    // Verificar que el floorId existe
    const floorExists = this.floors.some(floor => floor.floorId === +this.floorIdControl.value);
    if (!floorExists) {
      this.errorMessage = 'El piso seleccionado no existe';
      return false;
    }

    // Verificar que el roomId existe si se ha seleccionado
    if (this.roomIdControl.value) {
      const roomExists = this.rooms.some(room => room.roomId === +this.roomIdControl.value);
      if (!roomExists) {
        this.errorMessage = 'La sala seleccionada no existe';
        return false;
      }
    }

    // Verificar que el workstationId existe si se ha seleccionado
    if (this.workstationIdControl.value) {
      const workstationExists = this.workstations.some(
        workstation => workstation.workstationId === +this.workstationIdControl.value
      );
      if (!workstationExists) {
        this.errorMessage = 'El puesto de trabajo seleccionado no existe';
        return false;
      }
    }

    return true;
  }

  onCancel(): void {
    void this.router.navigate(['/services/cleaning/requests']);
  }

  // Getters para el template
  get cleaningDateControl() {
    return this.cleaningForm.get('cleaningDate')!;
  }

  get floorIdControl() {
    return this.cleaningForm.get('floorId')!;
  }

  get roomIdControl() {
    return this.cleaningForm.get('roomId')!;
  }

  get workstationIdControl() {
    return this.cleaningForm.get('workstationId')!;
  }

  get notesControl() {
    return this.cleaningForm.get('notes')!;
  }

  get termsAcceptedControl() {
    return this.cleaningForm.get('termsAccepted')!;
  }
}
