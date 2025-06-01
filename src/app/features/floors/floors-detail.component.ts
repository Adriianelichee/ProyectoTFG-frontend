// src/app/features/floors/floors-detail.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { FloorService } from '../../core/api/floor.service';
import { ActivatedRoute, Router } from '@angular/router';
import { FloorInDto } from '../../core/models/floor-in-dto';
import { FloorOutDto } from '../../core/models/floor-out-dto';

@Component({
  selector: 'app-floors-detail',
  templateUrl: './floors-detail.component.html',
  styleUrls: ['./floors-detail.component.css'],
  standalone: true,
  imports: [ CommonModule, ReactiveFormsModule ]
})
export class FloorsDetailComponent implements OnInit {
  floorForm!: FormGroup;
  floorId?: number;
  isEdit = false;
  loading = false;
  errorMessage: string | null = null;

  constructor(
    private fb: FormBuilder,
    private floorService: FloorService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.floorForm = this.fb.group({
      floorName: ['', [Validators.required, Validators.maxLength(45)]],
      description: ['', Validators.required]
    });

    this.route.paramMap.subscribe((params) => {
      const idParam = params.get('id');
      if (idParam) {
        this.floorId = Number(idParam);
        this.isEdit = true;
        this.loadFloor(this.floorId);
      }
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
        this.loading = false;
      },
      error: (err) => {
        console.error('Error cargando piso:', err);
        this.errorMessage = 'No se pudo cargar los datos del piso';
        this.loading = false;
      }
    });
  }

  onSubmit(): void {
    if (this.floorForm.invalid) return;

    this.errorMessage = null;
    const dto: FloorInDto = {
      floorName: this.floorForm.value.floorName,
      description: this.floorForm.value.description
    };

    if (this.isEdit && this.floorId != null) {
      this.floorService.update(this.floorId, dto).subscribe({
        next: () => this.router.navigate(['/floors']),
        error: (err) => {
          console.error('Error al actualizar piso:', err);
          this.errorMessage = 'Error al actualizar el piso';
        }
      });
    } else {
      this.floorService.create(dto).subscribe({
        next: () => this.router.navigate(['/floors']),
        error: (err) => {
          console.error('Error al crear piso:', err);
          this.errorMessage = 'Error al crear el piso';
        }
      });
    }
  }

  onCancel(): void {
   void  this.router.navigate(['/floors']);
  }
  get floorNameControl() {
    return this.floorForm.get('floorName')!;
  }

  get descriptionControl() {
    return this.floorForm.get('description')!;
  }
}
