import {ChangeDetectionStrategy, Component, OnInit, ViewEncapsulation, ChangeDetectorRef} from '@angular/core';
import {CommonModule} from '@angular/common';
import {ReactiveFormsModule, FormBuilder, FormGroup, Validators} from '@angular/forms';
import {Router, RouterModule} from '@angular/router';
import {ReportService} from '../../../core/api/report.service';
import {FloorService} from '../../../core/api/floor.service';
import {RoomService} from '../../../core/api/room.service';
import {WorkstationService} from '../../../core/api/workstation.service';
import {AuthService} from '../../../core/auth/auth.service';
import {FloorOutDto} from '../../../core/models/floor-out-dto';
import {RoomOutDto} from '../../../core/models/room-out-dto';
import {WorkstationOutDto} from '../../../core/models/workstation-out-dto';
import {finalize} from 'rxjs';
import {ReportStatus} from '../../../core/models/report-in-dto';

@Component({
  selector: 'app-report-detail',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './report-detail.component.html',
  styleUrl: './report-detail.component.css',
  encapsulation: ViewEncapsulation.Emulated,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ReportDetailComponent implements OnInit {
  reportForm!: FormGroup;
  isSubmitting = false;
  submitSuccess = false;
  errorMessage = '';

  floors: FloorOutDto[] = [];
  rooms: RoomOutDto[] = [];
  workstations: WorkstationOutDto[] = [];

  isLoadingFloors = false;
  isLoadingRooms = false;
  isLoadingWorkstations = false;

  // Para categorías de problemas
  categories = [
    {value: 'maintenance', label: 'Mantenimiento', icon: 'fa-wrench'},
    {value: 'cleaning', label: 'Limpieza', icon: 'fa-broom'},
    {value: 'technology', label: 'Tecnología', icon: 'fa-laptop'},
    {value: 'security', label: 'Seguridad', icon: 'fa-shield-alt'},
    {value: 'general', label: 'General', icon: 'fa-exclamation-circle'}
  ];

  constructor(
    private fb: FormBuilder,
    private reportService: ReportService,
    private floorService: FloorService,
    private roomService: RoomService,
    private workstationService: WorkstationService,
    private authService: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {
  }

  ngOnInit(): void {
    this.createForm();
    this.loadFloors();

    // Observar cambios en el piso seleccionado
    this.reportForm.get('floorId')?.valueChanges.subscribe(floorId => {
      if (floorId) {
        this.reportForm.get('roomId')?.setValue(null);
        this.reportForm.get('workstationId')?.setValue(null);
        this.loadRooms(floorId);
      } else {
        this.rooms = [];
        this.workstations = [];
        this.cdr.markForCheck();
      }
    });

    // Observar cambios en la habitación seleccionada
    this.reportForm.get('roomId')?.valueChanges.subscribe(roomId => {
      if (roomId) {
        this.reportForm.get('workstationId')?.setValue(null);
        this.loadWorkstations(this.reportForm.get('floorId')?.value);
      } else {
        this.workstations = [];
        this.cdr.markForCheck();
      }
    });
  }

  createForm(): void {
    this.reportForm = this.fb.group({
      description: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(500)]],
      category: ['general', Validators.required],
      floorId: [null, Validators.required],
      roomId: [null],
      workstationId: [null]
    });
  }

  loadFloors(): void {
    this.isLoadingFloors = true;

    const userInfo = this.authService.getCurrentUser();
    const companyId = userInfo?.companyId;

    if (companyId) {
      this.floorService.getByCompanyId(companyId).pipe(
        finalize(() => {
          this.isLoadingFloors = false;
          this.cdr.markForCheck();
        })
      ).subscribe({
        next: (floors) => {
          this.floors = floors;
        },
        error: (error) => {
          this.errorMessage = 'Error al cargar los pisos';
          console.error(error);
        }
      });
    } else {
      this.floorService.getAll().pipe(
        finalize(() => {
          this.isLoadingFloors = false;
          this.cdr.markForCheck();
        })
      ).subscribe({
        next: (floors) => {
          this.floors = floors;
        },
        error: (error) => {
          this.errorMessage = 'Error al cargar los pisos';
          console.error(error);
        }
      });
    }
  }

  loadRooms(floorId: number): void {
    this.isLoadingRooms = true;
    this.roomService.getByFloorId(floorId).pipe(
      finalize(() => {
        this.isLoadingRooms = false;
        this.cdr.markForCheck();
      })
    ).subscribe({
      next: (rooms) => {
        this.rooms = rooms;
      },
      error: (error) => {
        this.errorMessage = 'Error al cargar las salas';
        console.error(error);
      }
    });
  }

  loadWorkstations(floorId: number): void {
    this.isLoadingWorkstations = true;
    this.workstationService.getByFloor(floorId).pipe(
      finalize(() => {
        this.isLoadingWorkstations = false;
        this.cdr.markForCheck();
      })
    ).subscribe({
      next: (workstations) => {
        // Filtramos por la sala seleccionada si existe
        const roomId = this.reportForm.get('roomId')?.value;
        if (roomId) {
          this.workstations = workstations.filter(ws => true); // Aquí iría el filtro por sala
        } else {
          this.workstations = workstations;
        }
      },
      error: (error) => {
        this.errorMessage = 'Error al cargar las estaciones de trabajo';
        console.error(error);
      }
    });
  }

  onSubmit(): void {
    if (this.reportForm.invalid) {
      this.markFormGroupTouched(this.reportForm);
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = '';

    const userId = this.authService.getUserId();
    if (!userId) {
      this.errorMessage = 'Debe iniciar sesión para enviar un reporte';
      this.isSubmitting = false;
      return;
    }

    // Creamos el objeto con todas las propiedades requeridas
    const reportData = {
      userId: userId,
      description: this.reportForm.get('description')?.value,
      floorId: this.reportForm.get('floorId')?.value,
      roomId: this.reportForm.get('roomId')?.value || null,
      workstationId: this.reportForm.get('workstationId')?.value || null,
      category: this.reportForm.get('category')?.value,
      // Corrige estas propiedades:
      status: 'pending' as ReportStatus,
      reportDate: new Date().toISOString(),
      assignedManagerId: 0  // Usa 0 en lugar de null para indicar que no hay asignación
    };

    this.reportService.create(reportData).pipe(
      finalize(() => {
        this.isSubmitting = false;
        this.cdr.markForCheck();
      })
    ).subscribe({
      next: () => {
        this.submitSuccess = true;
        setTimeout(() => {
          this.router.navigate(['/reports']);
        }, 3000);
      },
      error: (error) => {
        this.errorMessage = error.message || 'Ha ocurrido un error al enviar el reporte';
      }
    });
  }

  selectCategory(value: string): void {
    const categoryControl = this.reportForm.get('category');
    if (categoryControl) {
      categoryControl.setValue(value);
    }
  }

  markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      formGroup.get(key)?.markAsTouched();
    });
  }

  get descriptionCharsLeft(): number {
    const maxLength = 500;
    const currentLength = this.reportForm.get('description')?.value?.length || 0;
    return maxLength - currentLength;
  }

  resetForm(): void {
    this.reportForm.reset({category: 'general'});
    this.submitSuccess = false;
    this.errorMessage = '';
  }
}
