import {Component, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormArray} from '@angular/forms';
import {FloorService} from '../../core/api/floor.service';
import {RoomService} from '../../core/api/room.service';
import {WorkstationService} from '../../core/api/workstation.service';
import {ActivatedRoute, Router} from '@angular/router';
import {FloorInDto} from '../../core/models/floor-in-dto';
import {FloorOutDto} from '../../core/models/floor-out-dto';
import {RoomOutDto} from '../../core/models/room-out-dto';
import {WorkstationOutDto} from '../../core/models/workstation-out-dto';
import {forkJoin} from 'rxjs';

@Component({
  selector: 'app-floors-detail',
  templateUrl: './floors-detail.component.html',
  styleUrls: ['./floors-detail.component.css'],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule]
})
export class FloorsDetailComponent implements OnInit {
  floorForm!: FormGroup;
  floorId?: number;
  isEdit = false;
  loading = false;
  loadingRooms = false;
  loadingWorkstations = false;
  errorMessage: string | null = null;

  availableRooms: RoomOutDto[] = [];
  availableWorkstations: WorkstationOutDto[] = [];

  selectedRoomIds: number[] = [];
  selectedWorkstationIds: number[] = [];

  constructor(
    private fb: FormBuilder,
    private floorService: FloorService,
    private roomService: RoomService,
    private workstationService: WorkstationService,
    private route: ActivatedRoute,
    private router: Router
  ) {
  }

  ngOnInit(): void {
    this.initForm();

    this.route.paramMap.subscribe((params) => {
      const idParam = params.get('id');
      if (idParam) {
        this.floorId = Number(idParam);
        this.isEdit = true;
        this.loadFloor(this.floorId);
      } else {
        this.loadAvailableSpaces();
      }
    });
  }

  private initForm(): void {
    this.floorForm = this.fb.group({
      floorName: ['', [Validators.required, Validators.maxLength(45)]],
      description: ['', Validators.required],
      rooms: this.fb.array([]),
      workstations: this.fb.array([])
    });
  }

  private loadFloor(id: number): void {
    this.loading = true;
    this.errorMessage = null;

    this.floorService.getById(id).subscribe({
      next: (data: FloorOutDto) => {
        this.floorForm.patchValue({
          floorName: data.floorName,
          description: data.description
        });
        this.loadSpacesForEdit(id);
      },
      error: (err) => {
        console.error('Error cargando Planta:', err);
        this.errorMessage = 'No se pudo cargar los datos del Planta';
        this.loading = false;
      }
    });
  }

  private loadSpacesForEdit(floorId: number): void {
    this.loadingRooms = true;
    this.loadingWorkstations = true;

    // Cargamos todas las salas y puestos disponibles
    const allRooms$ = this.roomService.getAll();
    const allWorkstations$ = this.workstationService.getAll();

    // Cargamos las salas y puestos asignados a este Planta
    const floorRooms$ = this.roomService.getByFloorId(floorId);
    const floorWorkstations$ = this.workstationService.getByFloor(floorId);

    // Usamos forkJoin para ejecutar todas las peticiones en paralelo
    forkJoin({
      allRooms: allRooms$,
      allWorkstations: allWorkstations$,
      floorRooms: floorRooms$,
      floorWorkstations: floorWorkstations$
    }).subscribe({
      next: (result) => {
        // Guardamos las salas y puestos disponibles
        this.availableRooms = result.allRooms;
        this.availableWorkstations = result.allWorkstations;

        // Guardamos los IDs de las salas y puestos ya asignados a este Planta
        this.selectedRoomIds = result.floorRooms.map(room => room.roomId);
        this.selectedWorkstationIds = result.floorWorkstations.map(ws => ws.workstationId);

        // Actualizamos los FormArrays con los valores seleccionados
        this.updateRoomsFormArray();
        this.updateWorkstationsFormArray();

        this.loadingRooms = false;
        this.loadingWorkstations = false;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error cargando espacios:', err);
        this.errorMessage = 'No se pudieron cargar las salas y puestos de trabajo';
        this.loadingRooms = false;
        this.loadingWorkstations = false;
        this.loading = false;
      }
    });
  }

  private loadAvailableSpaces(): void {
    this.loadingRooms = true;
    this.loadingWorkstations = true;

    // Cargamos todas las salas y puestos que no están asignados a ningún Planta
    // o que tienen floorId = null
    forkJoin({
      rooms: this.roomService.getAll(),
      workstations: this.workstationService.getAll()
    }).subscribe({
      next: (result) => {
        // Filtramos solo las salas y puestos sin asignar (floorId = null)
        this.availableRooms = result.rooms.filter(room => !room.floorId);
        this.availableWorkstations = result.workstations.filter(ws => !ws.floorId);

        // Actualizamos los FormArrays
        this.updateRoomsFormArray();
        this.updateWorkstationsFormArray();

        this.loadingRooms = false;
        this.loadingWorkstations = false;
      },
      error: (err) => {
        console.error('Error cargando espacios disponibles:', err);
        this.errorMessage = 'No se pudieron cargar las salas y puestos de trabajo disponibles';
        this.loadingRooms = false;
        this.loadingWorkstations = false;
      }
    });
  }

  private updateRoomsFormArray(): void {
    // Limpiamos el FormArray actual
    while (this.roomsFormArray.length) {
      this.roomsFormArray.removeAt(0);
    }

    // Añadimos un control por cada sala disponible
    this.availableRooms.forEach(room => {
      const isSelected = this.selectedRoomIds.includes(room.roomId);
      this.roomsFormArray.push(this.fb.control(isSelected));
    });
  }

  private updateWorkstationsFormArray(): void {
    // Limpiamos el FormArray actual
    while (this.workstationsFormArray.length) {
      this.workstationsFormArray.removeAt(0);
    }

    // Añadimos un control por cada puesto disponible
    this.availableWorkstations.forEach(ws => {
      const isSelected = this.selectedWorkstationIds.includes(ws.workstationId);
      this.workstationsFormArray.push(this.fb.control(isSelected));
    });
  }

  onSubmit(): void {
    if (this.floorForm.invalid) return;

    this.errorMessage = null;
    const dto: FloorInDto = {
      floorName: this.floorForm.value.floorName,
      description: this.floorForm.value.description
    };

    // Primero creamos o actualizamos el Planta
    if (this.isEdit && this.floorId != null) {
      this.floorService.update(this.floorId, dto).subscribe({
        next: (updatedFloor) => {
          // Después actualizamos las salas y puestos seleccionados
          this.updateSelectedSpaces(updatedFloor.floorId);
        },
        error: (err) => {
          console.error('Error al actualizar Planta:', err);
          this.errorMessage = 'Error al actualizar el Planta';
        }
      });
    } else {
      this.floorService.create(dto).subscribe({
        next: (newFloor) => {
          // Después actualizamos las salas y puestos seleccionados
          this.updateSelectedSpaces(newFloor.floorId);
        },
        error: (err) => {
          console.error('Error al crear Planta:', err);
          this.errorMessage = 'Error al crear el Planta';
        }
      });
    }
  }

  private updateSelectedSpaces(floorId: number): void {
    // Obtenemos los IDs de las salas seleccionadas
    const selectedRoomIds = this.availableRooms
      .filter((_, index) => this.roomsFormArray.at(index).value)
      .map(room => room.roomId);

    // Obtenemos los IDs de los puestos seleccionados
    const selectedWorkstationIds = this.availableWorkstations
      .filter((_, index) => this.workstationsFormArray.at(index).value)
      .map(ws => ws.workstationId);

    // Creamos un array de observables para actualizar todas las salas
    const roomUpdates = selectedRoomIds.map(roomId => {
      // Obtenemos la sala actual
      const room = this.availableRooms.find(r => r.roomId === roomId);
      if (!room) return null;

      // Creamos el DTO para actualizar la sala
      const roomDto = {
        roomName: room.roomName,
        capacity: room.capacity,
        hourlyRate: room.hourlyRate,
        available: room.available,
        floorId: floorId
      };

      return this.roomService.update(roomId, roomDto);
    }).filter(obs => obs !== null);

    const workstationUpdates = selectedWorkstationIds.map(wsId => {
      const ws = this.availableWorkstations.find(w => w.workstationId === wsId);
      if (!ws) return null;

      const wsDto = {
        available: ws.available,
        hourlyRate: ws.hourlyRate,
        floorId: floorId
      };
      return this.workstationService.update(wsId, wsDto);
    }).filter(obs => obs !== null);

    // Combinamos todos los observables
    const allUpdates = [...roomUpdates, ...workstationUpdates];

    if (allUpdates.length > 0) {
      // Si hay actualizaciones, las ejecutamos en paralelo
      forkJoin(allUpdates).subscribe({
        next: () => {
          // Navegamos a la lista de Plantas cuando todo esté listo
          this.router.navigate(['/floors']);
        },
        error: (err) => {
          console.error('Error al actualizar espacios:', err);
          this.errorMessage = 'Error al actualizar salas y puestos de trabajo';
        }
      });
    } else {
      // Si no hay actualizaciones, simplemente navegamos a la lista de Plantas
      this.router.navigate(['/floors']);
    }
  }

  onCancel(): void {
    void this.router.navigate(['/floors']);
  }

  navigateToCreateRoom(): void {
    // Si estamos editando, pasamos el ID del Planta como parámetro
    if (this.isEdit && this.floorId) {
      void this.router.navigate(['/rooms/new'], {
        queryParams: {floorId: this.floorId}
      });
    } else {
      void this.router.navigate(['/rooms/new']);
    }
  }

  navigateToCreateWorkstation(): void {
    if (this.isEdit && this.floorId) {
      void this.router.navigate(['/workstations/new'], {
        queryParams: {floorId: this.floorId}
      });
    } else {
      void this.router.navigate(['/workstations/new']);
    }
  }

  // Getters para acceder a los FormArrays desde la plantilla
  get roomsFormArray(): FormArray {
    return this.floorForm.get('rooms') as FormArray;
  }

  get workstationsFormArray(): FormArray {
    return this.floorForm.get('workstations') as FormArray;
  }

  // Getters para los controles del formulario
  get floorNameControl() {
    return this.floorForm.get('floorName')!;
  }

  get descriptionControl() {
    return this.floorForm.get('description')!;
  }
}
