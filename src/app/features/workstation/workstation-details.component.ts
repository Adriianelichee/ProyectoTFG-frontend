import { Component, OnInit } from '@angular/core';
    import { CommonModule } from '@angular/common';
    import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
    import { WorkstationService } from '../../core/api/workstation.service';
    import { FloorService } from '../../core/api/floor.service';
    import { ActivatedRoute, Router } from '@angular/router';
    import { WorkstationInDto } from '../../core/models/workstation-in-dto';
    import { WorkstationOutDto } from '../../core/models/workstation-out-dto';
    import { FloorOutDto } from '../../core/models/floor-out-dto';

    @Component({
      selector: 'app-workstation-details',
      templateUrl: './workstation-details.component.html',
      styleUrls: ['./workstation-details.component.css'],
      standalone: true,
      imports: [ CommonModule, ReactiveFormsModule ]
    })
    export class WorkstationDetailsComponent implements OnInit {
      workstationForm!: FormGroup;
      workstationId?: number;
      isEdit = false;
      loading = false;
      errorMessage: string | null = null;
      floors: FloorOutDto[] = [];
      loadingFloors = false;

      constructor(
        private fb: FormBuilder,
        private workstationService: WorkstationService,
        private floorService: FloorService,
        private route: ActivatedRoute,
        private router: Router
      ) {}

      ngOnInit(): void {
        this.workstationForm = this.fb.group({
          // Mantenemos los mismos campos en el formulario para la UI
          workstationName: ['', [Validators.required, Validators.maxLength(45)]],
          hourlyRate: [0, [Validators.required, Validators.min(0)]],
          position: ['', [Validators.required]],
          available: [true],
          floorId: [null, [Validators.required, Validators.min(1)]]
        });

        // Cargar la lista de plantas disponibles
        this.loadFloors();

        this.route.paramMap.subscribe((params) => {
          const idParam = params.get('id');
          if (idParam) {
            this.workstationId = Number(idParam);
            this.isEdit = true;
            this.loadWorkstation(this.workstationId);
          }
        });
      }

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

      private loadWorkstation(id: number): void {
        this.loading = true;
        this.errorMessage = null;

        this.workstationService.getById(id).subscribe({
          next: (data: WorkstationOutDto) => {
            this.workstationForm.patchValue({
              workstationName: `Estación ${data.workstationId}`,
              hourlyRate: data.hourlyRate,
              position: `Posición ${data.workstationId}`,
              available: data.available,
              floorId: data.floorId
            });
            this.loading = false;
          },
          error: (err) => {
            console.error('Error cargando estación de trabajo:', err);
            this.errorMessage = 'No se pudo cargar los datos de la estación';
            this.loading = false;
          }
        });
      }

      onSubmit(): void {
        if (this.workstationForm.invalid) return;

        this.errorMessage = null;
        const dto: WorkstationInDto = {
          hourlyRate: this.workstationForm.value.hourlyRate,
          available: this.workstationForm.value.available,
          floorId: this.workstationForm.value.floorId
        };

        if (this.isEdit && this.workstationId != null) {
          this.workstationService.update(this.workstationId, dto).subscribe({
            next: () => this.router.navigate(['/workstations']),
            error: (err) => {
              console.error('Error al actualizar estación de trabajo:', err);
              this.errorMessage = 'Error al actualizar la estación de trabajo';
            }
          });
        } else {
          this.workstationService.create(dto).subscribe({
            next: () => this.router.navigate(['/workstations']),
            error: (err) => {
              console.error('Error al crear estación de trabajo:', err);
              this.errorMessage = 'Error al crear la estación de trabajo';
            }
          });
        }
      }

      onCancel(): void {
        void this.router.navigate(['/workstations']);
      }

      // Mantenemos los getters para la UI
      get workstationNameControl() {
        return this.workstationForm.get('workstationName')!;
      }

      get hourlyRateControl() {
        return this.workstationForm.get('hourlyRate')!;
      }

      get positionControl() {
        return this.workstationForm.get('position')!;
      }

      get availableControl() {
        return this.workstationForm.get('available')!;
      }

      get floorIdControl() {
        return this.workstationForm.get('floorId')!;
      }
    }
