import { Component, OnInit } from '@angular/core';
  import { CommonModule } from '@angular/common';
  import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
  import { RoomService } from '../../core/api/room.service';
  import { FloorService } from '../../core/api/floor.service'; // Importar servicio de plantas
  import { ActivatedRoute, Router } from '@angular/router';
  import { RoomInDto } from '../../core/models/room-in-dto';
  import { RoomOutDto } from '../../core/models/room-out-dto';
  import { FloorOutDto } from '../../core/models/floor-out-dto'; // Importar modelo de plantas

  @Component({
    selector: 'app-rooms-detail',
    templateUrl: './rooms-detail.component.html',
    styleUrls: ['./rooms-detail.component.css'],
    standalone: true,
    imports: [ CommonModule, ReactiveFormsModule ]
  })
  export class RoomsDetailComponent implements OnInit {
    roomForm!: FormGroup;
    roomId?: number;
    isEdit = false;
    loading = false;
    errorMessage: string | null = null;
    floors: FloorOutDto[] = []; // Lista de plantas disponibles
    loadingFloors = false; // Flag para carga de plantas

    constructor(
      private fb: FormBuilder,
      private roomService: RoomService,
      private floorService: FloorService, // Servicio para cargar plantas
      private route: ActivatedRoute,
      private router: Router
    ) {}

    ngOnInit(): void {
      this.roomForm = this.fb.group({
        roomName: ['', [Validators.required, Validators.maxLength(45)]],
        capacity: [1, [Validators.required, Validators.min(1)]],
        hourlyRate: [0, [Validators.required, Validators.min(0)]],
        available: [true],
        floorId: [null, [Validators.required, Validators.min(1)]]
      });

      // Cargar la lista de plantas disponibles
      this.loadFloors();

      this.route.paramMap.subscribe((params) => {
        const idParam = params.get('id');
        if (idParam) {
          this.roomId = Number(idParam);
          this.isEdit = true;
          this.loadRoom(this.roomId);
        }
      });
    }

    // Nuevo método para cargar las plantas
    private loadFloors(): void {
      this.loadingFloors = true;
      this.floorService.getAll().subscribe({
        next: (data) => {
          this.floors = data;
          this.loadingFloors = false;
        },
        error: (err) => {
          console.error('Error cargando plantas:', err);
          this.loadingFloors = false;
        }
      });
    }

    private loadRoom(id: number): void {
      this.loading = true;
      this.errorMessage = null;

      this.roomService.getById(id).subscribe({
        next: (data: RoomOutDto) => {
          this.roomForm.patchValue({
            roomName: data.roomName,
            capacity: data.capacity,
            hourlyRate: data.hourlyRate,
            available: data.available,
            floorId: data.floorId
          });
          this.loading = false;
        },
        error: (err) => {
          console.error('Error cargando sala:', err);
          this.errorMessage = 'No se pudo cargar los datos de la sala';
          this.loading = false;
        }
      });
    }

    onSubmit(): void {
      if (this.roomForm.invalid) return;

      this.errorMessage = null;
      const dto: RoomInDto = {
        roomName: this.roomForm.value.roomName,
        capacity: this.roomForm.value.capacity,
        hourlyRate: this.roomForm.value.hourlyRate,
        available: this.roomForm.value.available,
        floorId: this.roomForm.value.floorId
      };

      if (this.isEdit && this.roomId != null) {
        this.roomService.update(this.roomId, dto).subscribe({
          next: () => this.router.navigate(['/rooms']),
          error: (err) => {
            console.error('Error al actualizar sala:', err);
            this.errorMessage = 'Error al actualizar la sala';
          }
        });
      } else {
        this.roomService.create(dto).subscribe({
          next: () => this.router.navigate(['/rooms']),
          error: (err) => {
            console.error('Error al crear sala:', err);
            this.errorMessage = 'Error al crear la sala';
          }
        });
      }
    }

    onCancel(): void {
      void this.router.navigate(['/rooms']);
    }

    get roomNameControl() {
      return this.roomForm.get('roomName')!;
    }

    get capacityControl() {
      return this.roomForm.get('capacity')!;
    }

    get hourlyRateControl() {
      return this.roomForm.get('hourlyRate')!;
    }

    get availableControl() {
      return this.roomForm.get('available')!;
    }

    get floorIdControl() {
      return this.roomForm.get('floorId')!;
    }
  }
