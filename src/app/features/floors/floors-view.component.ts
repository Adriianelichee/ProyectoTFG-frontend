import {Component, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {ActivatedRoute, Router} from '@angular/router';
import {FloorService} from '../../core/api/floor.service';
import {RoomService} from '../../core/api/room.service';
import {WorkstationService} from '../../core/api/workstation.service';
import {FloorOutDto} from '../../core/models/floor-out-dto';

// Componente para visualizar detalles de una planta específica
@Component({
  selector: 'app-floors-view',
  templateUrl: './floors-view.component.html',
  styleUrls: ['./floors-view.component.css'],
  standalone: true,
  imports: [CommonModule]
})
export class FloorsViewComponent implements OnInit {
  floorId!: number;                       // ID de la planta que estamos visualizando
  floor: FloorOutDto | null = null;       // Datos completos de la planta
  rooms: any[] = [];                      // Lista de salas en esta planta
  workstations: any[] = [];               // Lista de puestos de trabajo en esta planta
  activeTab: 'rooms' | 'workstations' = 'rooms';  // Control de pestañas activas
  loading = true;                         // Indicador de carga de datos
  errorMessage: string | null = null;     // Mensaje de error si algo falla

  // Estadísticas de disponibilidad
  totalRooms = 0;                        // Número total de salas
  availableRooms = 0;                    // Número de salas disponibles
  totalWorkstations = 0;                 // Número total de puestos de trabajo
  availableWorkstations = 0;             // Número de puestos disponibles
  hasAvailableSpaces = false;            // Indicador rápido de disponibilidad

  // Inyectamos los servicios necesarios para el funcionamiento del componente
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private floorService: FloorService,
    private roomService: RoomService,
    private workstationService: WorkstationService
  ) {
  }

  // Inicializamos el componente cuando se carga
  ngOnInit(): void {
    // Obtenemos el ID de la planta desde los parámetros de la URL
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.floorId = +id;               // Convertimos el ID a número
        this.loadFloorDetails();          // Cargamos los detalles de la planta
      } else {
        this.errorMessage = 'ID de planta no proporcionado';
        this.loading = false;
      }
    });
  }

  // Método para cargar los detalles de la planta seleccionada
  loadFloorDetails(): void {
    this.loading = true;
    this.errorMessage = null;

    // Llamamos al servicio para obtener los datos de la planta
    this.floorService.getById(this.floorId).subscribe({
      next: (data) => {
        this.floor = data;
        this.loadRooms();                // Cargamos las salas de la planta
        this.loadWorkstations();         // Cargamos los puestos de trabajo
      },
      error: (err) => {
        console.error('Error al cargar detalles de la planta:', err);
        this.errorMessage = 'No se pudieron cargar los detalles de la planta';
        this.loading = false;
      }
    });
  }

  // Método para cargar las salas asociadas a esta planta
  loadRooms(): void {
    this.roomService.getByFloorId(this.floorId).subscribe({
      next: (data) => {
        this.rooms = data;
        this.totalRooms = this.rooms.length;
        this.availableRooms = this.rooms.filter(room => room.available).length;
        this.updateAvailabilityStatus();  // Actualizamos el estado de disponibilidad
      },
      error: (err) => {
        console.error('Error al cargar salas:', err);
        this.rooms = [];
        this.updateAvailabilityStatus();
      }
    });
  }

  // Método para cargar los puestos de trabajo asociados a esta planta
  loadWorkstations(): void {
    this.workstationService.getByFloor(this.floorId).subscribe({
      next: (data) => {
        this.workstations = data;
        this.totalWorkstations = this.workstations.length;
        this.availableWorkstations = this.workstations.filter(ws => ws.available).length;
        this.updateAvailabilityStatus();  // Actualizamos el estado de disponibilidad
      },
      error: (err) => {
        console.error('Error al cargar puestos de trabajo:', err);
        this.workstations = [];
        this.updateAvailabilityStatus();
      }
    });
  }

  // Actualizamos el estado de disponibilidad global y el indicador de carga
  updateAvailabilityStatus(): void {
    if (this.rooms !== undefined && this.workstations !== undefined) {
      this.hasAvailableSpaces = this.availableRooms > 0 || this.availableWorkstations > 0;
      this.loading = false;  // Terminamos la carga cuando se han procesado todos los datos
    }
  }

  // Método para navegar a la reserva de un espacio específico
  reserveSpace(type: 'room' | 'workstation', id: number): void {
    if (type === 'room') {
      void this.router.navigate(['/rooms', id, 'view']);
    } else {
      void this.router.navigate(['/workstations', id, 'view']);
    }
  }

  // Método para volver a la lista de plantas
  goBack(): void {
    void this.router.navigate(['/floors']);
  }
}
