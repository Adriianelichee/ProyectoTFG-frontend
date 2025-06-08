import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { ServiceInDto } from '../../core/models/service-in-dto';
import { ServiceOutDto } from '../../core/models/service-out-dto';
import { ServiceService } from '../../core/api/service.service';

@Component({
  selector: 'app-services-detail',
  templateUrl: './services-detail.component.html',
  styleUrls: ['./services-detail.component.css'],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule]
})
export class ServicesDetailComponent implements OnInit {
  serviceForm!: FormGroup;
  serviceId?: number;
  isEdit = false;
  loading = false;
  errorMessage: string | null = null;

  constructor(
    private fb: FormBuilder,
    private serviceService: ServiceService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.serviceForm = this.fb.group({
      serviceName: ['', [Validators.required, Validators.maxLength(100)]],
      description: ['', [Validators.required, Validators.maxLength(500)]],
      price: [0, [Validators.required, Validators.min(0)]]
    });

    this.route.paramMap.subscribe((params) => {
      const idParam = params.get('id');
      if (idParam) {
        this.serviceId = Number(idParam);
        this.isEdit = true;
        this.loadService(this.serviceId);
      }
    });
  }

  private loadService(id: number): void {
    this.loading = true;
    this.errorMessage = null;

    this.serviceService.getById(id).subscribe({
      next: (data: ServiceOutDto) => {
        this.serviceForm.patchValue({
          serviceName: data.serviceName,
          description: data.description,
          price: data.price
        });
        this.loading = false;
      },
      error: (err) => {
        console.error('Error cargando servicio:', err);
        this.errorMessage = 'No se pudo cargar los datos del servicio';
        this.loading = false;
      }
    });
  }

  onSubmit(): void {
    if (this.serviceForm.invalid) return;

    this.errorMessage = null;
    const dto: ServiceInDto = {
      serviceName: this.serviceForm.value.serviceName,
      description: this.serviceForm.value.description,
      price: this.serviceForm.value.price
    };

    if (this.isEdit && this.serviceId != null) {
      this.serviceService.update(this.serviceId, dto).subscribe({
        next: () => this.router.navigate(['/services']),
        error: (err) => {
          console.error('Error al actualizar servicio:', err);
          this.errorMessage = 'Error al actualizar el servicio';
        }
      });
    } else {
      this.serviceService.create(dto).subscribe({
        next: () => this.router.navigate(['/services']),
        error: (err) => {
          console.error('Error al crear servicio:', err);
          this.errorMessage = 'Error al crear el servicio';
        }
      });
    }
  }

  onCancel(): void {
    void this.router.navigate(['/services']);
  }

  // Getters para el template
  get serviceNameControl() {
    return this.serviceForm.get('serviceName')!;
  }

  get descriptionControl() {
    return this.serviceForm.get('description')!;
  }

  get priceControl() {
    return this.serviceForm.get('price')!;
  }
}
