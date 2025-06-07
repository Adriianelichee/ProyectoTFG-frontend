// src/app/features/rooms/rooms-list.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule} from '@angular/common';
import { RoomService } from '../../core/api/room.service';
import { RoomOutDto } from '../../core/models/room-out-dto';
import { Router } from '@angular/router';

@Component({
  selector: 'app-rooms-list',
  templateUrl: './rooms-list.component.html',
  styleUrls: ['./rooms-list.component.css'],
  standalone: true,
  imports: [CommonModule]
})
export class RoomsListComponent implements OnInit {
  rooms: RoomOutDto[] = [];
  loading = false;
  errorMessage: string | null = null;

  constructor(
    private roomService: RoomService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadRooms();
  }

  loadRooms(): void {
    this.loading = true;
    this.errorMessage = null;
    this.roomService.getAll().subscribe({
      next: (data) => {
        this.rooms = data;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error al cargar salas:', err);
        this.errorMessage = 'No se pudo cargar el listado de salas';
        this.loading = false;
      }
    });
  }

  onCreate(): void {
    void this.router.navigate(['/rooms/new']);
  }

  onEdit(roomId: number): void {
    void this.router.navigate([`/rooms/${roomId}`]);
  }

  onDelete(roomId: number): void {
    if (!confirm('¿Estás seguro de eliminar esta sala?')) return;
    this.roomService.delete(roomId).subscribe({
      next: () => this.loadRooms(),
      error: (err) => {
        console.error('Error al eliminar sala:', err);
        alert('No se pudo eliminar la sala');
      }
    });
  }
}
