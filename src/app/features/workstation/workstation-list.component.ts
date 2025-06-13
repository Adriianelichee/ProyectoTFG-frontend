import {Component, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {WorkstationService} from '../../core/api/workstation.service';
import {WorkstationOutDto} from '../../core/models/workstation-out-dto';
import {Router} from '@angular/router';
import {AuthService} from '../../core/auth/auth.service';

@Component({
  selector: 'app-workstation-list',
  templateUrl: './workstation-list.component.html',
  styleUrls: ['./workstation-list.component.css'],
  standalone: true,
  imports: [CommonModule, FormsModule]
})
export class WorkstationListComponent implements OnInit {
  workstations: WorkstationOutDto[] = [];
  filteredWorkstations: WorkstationOutDto[] = [];
  searchTerm: string = '';
  loading = false;
  errorMessage: string | null = null;

  constructor(
    private workstationService: WorkstationService,
    private router: Router,
    private authService: AuthService
  ) {
  }

  ngOnInit(): void {
    this.loadWorkstations();
  }

  hasAdminAccess(): boolean {
    return this.authService.hasRole('admin') || this.authService.hasRole('secretary');
  }

  loadWorkstations(): void {
    this.loading = true;
    this.errorMessage = null;
    this.workstationService.getAll().subscribe({
      next: (data) => {
        this.workstations = data;
        this.filteredWorkstations = [...this.workstations];
        this.loading = false;
      },
      error: (err) => {
        console.error('Error al cargar estaciones de trabajo:', err);
        this.errorMessage = 'No se pudo cargar el listado de estaciones de trabajo';
        this.loading = false;
      }
    });
  }

  filterWorkstations(): void {
    if (!this.searchTerm) {
      this.filteredWorkstations = [...this.workstations];
      return;
    }

    const term = this.searchTerm.toLowerCase();
    this.filteredWorkstations = this.workstations.filter(workstation =>
      workstation.workstationId.toString().includes(term) ||
      workstation.hourlyRate.toString().includes(term) ||
      workstation.floorId.toString().includes(term)
    );
  }

  onCreate(): void {
    void this.router.navigate(['/workstations/new']);
  }

  onView(workstationId: number): void {
    void this.router.navigate([`/workstations/${workstationId}/view`]);
  }

  onEdit(workstationId: number): void {
    void this.router.navigate([`/workstations/${workstationId}`]);
  }

  onDelete(workstationId: number): void {
    if (!confirm('¿Estás seguro de eliminar esta estación de trabajo?')) return;
    this.workstationService.delete(workstationId).subscribe({
      next: () => this.loadWorkstations(),
      error: (err) => {
        console.error('Error al eliminar estación de trabajo:', err);
        alert('No se pudo eliminar la estación de trabajo');
      }
    });
  }
}
