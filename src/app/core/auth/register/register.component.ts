// src/app/core/auth/register.component.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css'],
})
export class RegisterComponent {
  registerForm: FormGroup;
  loading = false;
  errorMessage: string | null = null;

  roles = [
    { value: 'client', label: 'Cliente' },
    { value: 'admin', label: 'Admin' },
    { value: 'report_provider_manager', label: 'Gestor Proveedores' },
    { value: 'secretary', label: 'Secretario' },
  ];

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.registerForm = this.fb.group({
      firstName: ['', [Validators.required, Validators.maxLength(45)]],
      lastName: ['', [Validators.required, Validators.maxLength(45)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      phone: ['', [Validators.required, Validators.maxLength(20)]],
      role: ['', Validators.required],
      companyId: [null, Validators.required],
      providerId: [null],
    });
  }

  onSubmit(): void {
    if (this.registerForm.invalid) {
      return;
    }

    this.loading = true;
    this.errorMessage = null;

    this.authService.register(this.registerForm.value).subscribe({
      next: () => {
        this.loading = false;
        this.router.navigate(['/auth/login']);
      },
      error: (err: any) => {
        console.error('Error al registrarse:', err);
        this.errorMessage = 'No se pudo completar el registro';
        this.loading = false;
      },
    });
  }

  // Getters para no invocar get() en la plantilla
  get firstNameControl() {
    return this.registerForm.get('firstName')!;
  }
  get lastNameControl() {
    return this.registerForm.get('lastName')!;
  }
  get emailControl() {
    return this.registerForm.get('email')!;
  }
  get passwordControl() {
    return this.registerForm.get('password')!;
  }
  get phoneControl() {
    return this.registerForm.get('phone')!;
  }
  get roleControl() {
    return this.registerForm.get('role')!;
  }
  get companyIdControl() {
    return this.registerForm.get('companyId')!;
  }
  // providerId es opcional; no requiero validación en template
}
