import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FloorService } from '../../core/api/floor.service';
import { RoomService } from '../../core/api/room.service';
import { WorkstationService } from '../../core/api/workstation.service';
import { FloorOutDto } from '../../core/models/floor-out-dto';
import { Router } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';

interface FloorAvailability {
  rooms: number;
  workstations: number;
  availableRooms: number;
  availableWorkstations: number;
  hasAvailableSpaces: boolean;
}

@Component({
  selector: 'app-floors-list',
  templateUrl: './floors-list.component.html',
  styleUrls: ['./floors-list.component.css'],
  standalone: true,
  imports: [CommonModule, FormsModule]
})
export class FloorsListComponent implements OnInit {
  floors: FloorOutDto[] = [];
  filteredFloors: FloorOutDto[] = [];
  floorAvailability: {[floorId: number]: FloorAvailability} = {};
  loading = false;
  errorMessage: string | null = null;
  isAdmin = false;

  // Filtros
  searchTerm = '';
  availabilityFilter = 'all';

  constructor(
    private floorService: FloorService,
    private roomService: RoomService,
    private workstationService: WorkstationService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.isAdmin = this.authService.hasRole('admin');
    this.loadFloors();
  }

  loadFloors(): void {
    this.loading = true;
    this.errorMessage = null;

    this.floorService.getAll().subscribe({
      next: (data) => {
        this.floors = data;
        this.filteredFloors = data;
        this.loading = false;
        this.loadFloorAvailability();
      },
      error: (err) => {
        console.error('Error al cargar pisos:', err);
        this.errorMessage = 'No se pudo cargar el listado de plantas';
        this.loading = false;
      }
    });
  }

  loadFloorAvailability(): void {
    this.floors.forEach(floor => {
      this.roomService.getByFloorId(floor.floorId).subscribe(rooms => {
        this.workstationService.getByFloor(floor.floorId).subscribe(workstations => {
          const availableRooms = rooms.filter(r => r.available).length;
          const availableWorkstations = workstations.filter(w => w.available).length;

          this.floorAvailability[floor.floorId] = {
            rooms: rooms.length,
            workstations: workstations.length,
            availableRooms,
            availableWorkstations,
            hasAvailableSpaces: availableRooms > 0 || availableWorkstations > 0
          };
        });
      });
    });
  }

  filterFloors(): void {
    this.filteredFloors = this.floors.filter(floor => {
      // Filtro de búsqueda
      const matchesSearch =
        floor.floorName.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        floor.description.toLowerCase().includes(this.searchTerm.toLowerCase());

      // Filtro de disponibilidad
      let matchesAvailability = true;
      if (this.availabilityFilter !== 'all' && this.floorAvailability[floor.floorId]) {
        const hasSpaces = this.floorAvailability[floor.floorId].hasAvailableSpaces;
        matchesAvailability =
          (this.availabilityFilter === 'available' && hasSpaces) ||
          (this.availabilityFilter === 'full' && !hasSpaces);
      }

      return matchesSearch && matchesAvailability;
    });
  }

  viewFloorDetails(floorId: number): void {
    void this.router.navigate([`/floors/${floorId}/view`]);
  }

  onCreate(): void {
    void this.router.navigate(['/floors/new']);
  }

  onEdit(floorId: number): void {
    void this.router.navigate([`/floors/${floorId}`]);
  }

  onDelete(floorId: number): void {
    if (!confirm('¿Estás seguro de eliminar esta planta?')) return;

    this.floorService.delete(floorId).subscribe({
      next: () => this.loadFloors(),
      error: (err) => {
        console.error('Error al eliminar planta:', err);
        alert('No se pudo eliminar la planta');
      }
    });
  }
}
