import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FloorService } from '../../core/api/floor.service';
import { RoomService } from '../../core/api/room.service';
import { WorkstationService } from '../../core/api/workstation.service';
import { FloorOutDto } from '../../core/models/floor-out-dto';

@Component({
  selector: 'app-floors-view',
  templateUrl: './floors-view.component.html',
  styleUrls: ['./floors-view.component.css'],
  standalone: true,
  imports: [CommonModule]
})
export class FloorsViewComponent implements OnInit {
  floorId!: number;
  floor: FloorOutDto | null = null;
  rooms: any[] = [];
  workstations: any[] = [];
  activeTab: 'rooms' | 'workstations' = 'rooms';
  loading = true;
  errorMessage: string | null = null;

  // Estadísticas
  totalRooms = 0;
  availableRooms = 0;
  totalWorkstations = 0;
  availableWorkstations = 0;
  hasAvailableSpaces = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private floorService: FloorService,
    private roomService: RoomService,
    private workstationService: WorkstationService
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.floorId = +id;
        this.loadFloorDetails();
      } else {
        this.errorMessage = 'ID de planta no proporcionado';
        this.loading = false;
      }
    });
  }

  loadFloorDetails(): void {
    this.loading = true;
    this.errorMessage = null;

    this.floorService.getById(this.floorId).subscribe({
      next: (data) => {
        this.floor = data;
        this.loadRooms();
        this.loadWorkstations();
      },
      error: (err) => {
        console.error('Error al cargar detalles de la planta:', err);
        this.errorMessage = 'No se pudieron cargar los detalles de la planta';
        this.loading = false;
      }
    });
  }

  loadRooms(): void {
    this.roomService.getByFloorId(this.floorId).subscribe({
      next: (data) => {
        this.rooms = data;
        this.totalRooms = this.rooms.length;
        this.availableRooms = this.rooms.filter(room => room.available).length;
        this.updateAvailabilityStatus();
      },
      error: (err) => {
        console.error('Error al cargar salas:', err);
        this.rooms = [];
        this.updateAvailabilityStatus();
      }
    });
  }

  loadWorkstations(): void {
    // Cambiado a getByFloorId para mantener consistencia
    this.workstationService.getByFloor(this.floorId).subscribe({
      next: (data) => {
        this.workstations = data;
        this.totalWorkstations = this.workstations.length;
        this.availableWorkstations = this.workstations.filter(ws => ws.available).length;
        this.updateAvailabilityStatus();
      },
      error: (err) => {
        console.error('Error al cargar puestos de trabajo:', err);
        this.workstations = [];
        this.updateAvailabilityStatus(); // Importante: llamamos aquí también
      }
    });
  }

  updateAvailabilityStatus(): void {
    if (this.rooms !== undefined && this.workstations !== undefined) {
      this.hasAvailableSpaces = this.availableRooms > 0 || this.availableWorkstations > 0;
      this.loading = false; // IMPORTANTE: Aquí detenemos la carga
    }
  }

  reserveSpace(type: 'room' | 'workstation', id: number): void {
    if (type === 'room') {
      // Navegar a la vista de detalle de sala
      void this.router.navigate(['/rooms', id, 'view']);
    } else {
      // Navegar a la vista de detalle de estación de trabajo
      void this.router.navigate(['/workstations', id, 'view']);
    }
  }

  goBack(): void {
    void this.router.navigate(['/floors']);
  }
}
