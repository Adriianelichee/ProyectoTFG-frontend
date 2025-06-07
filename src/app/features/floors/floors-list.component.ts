import { Component, OnInit } from '@angular/core';
import { CommonModule} from '@angular/common';
import { FloorService } from '../../core/api/floor.service';
import { FloorOutDto } from '../../core/models/floor-out-dto';
import { Router } from '@angular/router';

@Component({
  selector: 'app-floors-list',
  templateUrl: './floors-list.component.html',
  styleUrls: ['./floors-list.component.css'],
  standalone: true,
  imports: [CommonModule]
})
export class FloorsListComponent implements OnInit {
  floors: FloorOutDto[] = [];
  loading = false;
  errorMessage: string | null = null;

  constructor(
    private floorService: FloorService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadFloors();
  }

  loadFloors(): void {
    this.loading = true;
    this.errorMessage = null;

    this.floorService.getAll().subscribe({
      next: (data) => {
        this.floors = data;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error al cargar pisos:', err);
        this.errorMessage = 'No se pudo cargar el listado de pisos';
        this.loading = false;
      }
    });
  }

  onCreate(): void {
    void this.router.navigate(['/floors/new']);
  }

  onEdit(floorId: number): void {
    void this.router.navigate([`/floors/${floorId}`]);
  }

  onDelete(floorId: number): void {
    if (!confirm('¿Estás seguro de eliminar este piso?')) return;

    this.floorService.delete(floorId).subscribe({
      next: () => this.loadFloors(),
      error: (err) => {
        console.error('Error al eliminar piso:', err);
        alert('No se pudo eliminar el piso');
      }
    });
  }
}
