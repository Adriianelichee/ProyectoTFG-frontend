import {Component, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {CleaningService} from '../../../core/api/cleaning.service';
import {FloorService} from '../../../core/api/floor.service';
import {RoomService} from '../../../core/api/room.service';
import {UserService} from '../../../core/api/user.service';
import {CompanyService} from '../../../core/api/company.service';
import {CleaningOutDto} from '../../../core/models/cleaning-out-dto';
import {FloorOutDto} from '../../../core/models/floor-out-dto';
import {RoomOutDto} from '../../../core/models/room-out-dto';
import {UserOutDto} from '../../../core/models/user-out-dto';
import {format} from 'date-fns';

interface CleaningEvent {
  date: string;
  action: string;
  username: string;
}

interface CleaningRequestDto extends CleaningOutDto {
  status: 'pending' | 'inProgress' | 'completed' | 'cancelled';
  history?: CleaningEvent[];
  companyName?: string;
}

@Component({
  selector: 'app-cleaning-requests',
  templateUrl: './cleaning-requests.component.html',
  styleUrls: ['./cleaning-requests.component.css'],
  standalone: true,
  imports: [CommonModule, FormsModule]
})
export class CleaningRequestsComponent implements OnInit {

  cleaningRequests: CleaningRequestDto[] = [];
  filteredRequests: CleaningRequestDto[] = [];
  paginatedRequests: CleaningRequestDto[] = [];
  floors: FloorOutDto[] = [];
  rooms: RoomOutDto[] = [];
  users: UserOutDto[] = [];

  selectedRequest: CleaningRequestDto | null = null;

  searchTerm: string = '';
  statusFilter: string = 'all';
  dateFilterStart: string | null = null;
  dateFilterEnd: string | null = null;

  sortColumn: string = 'cleaningDate';
  sortDirection: 'asc' | 'desc' = 'desc';

  currentPage: number = 1;
  pageSize: number = 10;
  totalPages: number = 0;

  loading: boolean = false;
  errorMessage: string | null = null;
  showFilterDropdown: boolean = false;

  constructor(
    private cleaningService: CleaningService,
    private floorService: FloorService,
    private roomService: RoomService,
    private userService: UserService,
    private companyService: CompanyService
  ) {
  }

  ngOnInit(): void {
    this.loadAllData();
  }

  loadAllData(): void {
    this.loadCleaningRequests();
    this.loadFloors();
    this.loadRooms();
    this.loadUsers();
  }

  loadCleaningRequests(): void {
    this.loading = true;
    this.errorMessage = null;

    this.cleaningService.getAll().subscribe({
      next: (cleanings: CleaningOutDto[]) => {
        this.cleaningRequests = cleanings.map(cleaning => {
          const status = this.extractStatusFromNotes(cleaning.notes);

          return {
            ...cleaning,
            status
          };
        });

        this.applyFilters();
        this.loading = false;
      },
      error: (error) => {
        console.error('Error al cargar las solicitudes de limpieza', error);
        this.errorMessage = 'No se pudieron cargar las solicitudes de limpieza. Por favor, inténtelo de nuevo.';
        this.loading = false;
      }
    });
  }

  private extractStatusFromNotes(notes: string | null): 'pending' | 'inProgress' | 'completed' | 'cancelled' {
    if (!notes) return 'pending';

    if (notes.includes('status:inProgress')) return 'inProgress';
    if (notes.includes('status:completed')) return 'completed';
    if (notes.includes('status:cancelled')) return 'cancelled';

    return 'pending';
  }

  private extractActualNotes(notes: string | null): string {
    if (!notes) return '';

    const noteParts = notes.split('|');
    return noteParts.length > 1 ? noteParts[1] : notes;
  }

  loadFloors(): void {
    this.floorService.getAll().subscribe({
      next: (floors) => {
        this.floors = floors;
      },
      error: (error) => {
        console.error('Error al cargar los pisos', error);
      }
    });
  }

  loadRooms(): void {
    this.roomService.getAll().subscribe({
      next: (rooms) => {
        this.rooms = rooms;
      },
      error: (error) => {
        console.error('Error al cargar las salas', error);
      }
    });
  }

  loadUsers(): void {
    this.userService.getAll().subscribe({
      next: (users) => {
        this.users = users;

        users.forEach(user => {
          if (user.companyId) {
            this.companyService.getById(user.companyId).subscribe({
              next: (company) => {
                this.cleaningRequests = this.cleaningRequests.map(req => {
                  if (req.userId === user.userId) {
                    return {...req, companyName: company.companyName};
                  }
                  return req;
                });

                if (this.filteredRequests.length > 0) {
                  this.applyFilters();
                }
              }
            });
          }
        });
      },
      error: (error) => {
        console.error('Error al cargar los usuarios', error);
      }
    });
  }

  applyFilters(): void {
    this.filteredRequests = [...this.cleaningRequests];

    if (this.searchTerm.trim() !== '') {
      const searchTermLower = this.searchTerm.toLowerCase();
      this.filteredRequests = this.filteredRequests.filter(request => {
        const floorName = this.getFloorName(request.floorId).toLowerCase();
        const roomName = request.roomId ? this.getRoomName(request.roomId).toLowerCase() : '';
        const userName = this.getUserName(request.userId).toLowerCase();

        return floorName.includes(searchTermLower) ||
          roomName.includes(searchTermLower) ||
          userName.includes(searchTermLower) ||
          request.cleaningId.toString().includes(searchTermLower);
      });
    }

    if (this.statusFilter !== 'all') {
      this.filteredRequests = this.filteredRequests.filter(request =>
        request.status === this.statusFilter
      );
    }

    if (this.dateFilterStart) {
      const startDate = new Date(this.dateFilterStart);
      startDate.setHours(0, 0, 0, 0);

      this.filteredRequests = this.filteredRequests.filter(request => {
        const cleaningDate = new Date(request.cleaningDate);
        return cleaningDate >= startDate;
      });
    }

    if (this.dateFilterEnd) {
      const endDate = new Date(this.dateFilterEnd);
      endDate.setHours(23, 59, 59, 999);

      this.filteredRequests = this.filteredRequests.filter(request => {
        const cleaningDate = new Date(request.cleaningDate);
        return cleaningDate <= endDate;
      });
    }

    this.sortRequests();

    this.totalPages = Math.ceil(this.filteredRequests.length / this.pageSize);

    if (this.currentPage > this.totalPages) {
      this.currentPage = 1;
    }

    this.updatePaginatedRequests();
  }

  sortBy(column: string): void {
    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }

    this.sortRequests();
    this.updatePaginatedRequests();
  }

  sortRequests(): void {
    this.filteredRequests.sort((a, b) => {
      let valueA, valueB;

      switch (this.sortColumn) {
        case 'cleaningId':
          valueA = a.cleaningId;
          valueB = b.cleaningId;
          break;
        case 'cleaningDate':
          valueA = new Date(a.cleaningDate).getTime();
          valueB = new Date(b.cleaningDate).getTime();
          break;
        case 'status':
          valueA = a.status;
          valueB = b.status;
          break;
        default:
          valueA = a.cleaningId;
          valueB = b.cleaningId;
      }

      if (valueA < valueB) {
        return this.sortDirection === 'asc' ? -1 : 1;
      }
      if (valueA > valueB) {
        return this.sortDirection === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }

  updatePaginatedRequests(): void {
    const startIndex = (this.currentPage - 1) * this.pageSize;
    this.paginatedRequests = this.filteredRequests.slice(
      startIndex,
      startIndex + this.pageSize
    );
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.updatePaginatedRequests();
    }
  }

  changePage(): void {
    this.totalPages = Math.ceil(this.filteredRequests.length / this.pageSize);
    if (this.currentPage > this.totalPages) {
      this.currentPage = 1;
    }
    this.updatePaginatedRequests();
  }

  getPaginationInfo(): { start: number; end: number } {
    const start = (this.currentPage - 1) * this.pageSize + 1;
    const end = Math.min(start + this.pageSize - 1, this.filteredRequests.length);
    return {start, end};
  }

  toggleFilterDropdown(): void {
    this.showFilterDropdown = !this.showFilterDropdown;
  }

  setStatusFilter(status: string): void {
    this.statusFilter = status;
    this.applyFilters();
    this.showFilterDropdown = false;
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.statusFilter = 'all';
    this.dateFilterStart = null;
    this.dateFilterEnd = null;
    this.applyFilters();
    this.showFilterDropdown = false;
  }

  getFloorName(floorId: number): string {
    const floor = this.floors.find(f => f.floorId === floorId);
    return floor ? floor.floorName : `Piso ${floorId}`;
  }

  getRoomName(roomId: number): string {
    const room = this.rooms.find(r => r.roomId === roomId);
    return room ? room.roomName : `Sala ${roomId}`;
  }

  getUserName(userId: number): string {
    const user = this.users.find(u => u.userId === userId);
    return user ? `${user.firstName} ${user.lastName}` : `Usuario ${userId}`;
  }

  getUserInitials(userId: number): string {
    const user = this.users.find(u => u.userId === userId);
    if (!user) return '??';
    return `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase();
  }

  getUserCompanyName(userId: number): string {
    const request = this.cleaningRequests.find(r => r.userId === userId);
    return request?.companyName || 'Empresa';
  }

  formatDate(dateString: string): string {
    return format(new Date(dateString), 'dd/MM/yyyy');
  }

  formatTime(dateString: string): string {
    return format(new Date(dateString), 'HH:mm');
  }

  formatDateTime(dateString: string): string {
    return format(new Date(dateString), 'dd/MM/yyyy HH:mm');
  }

  getStatusIcon(status: string): string {
    switch (status) {
      case 'pending':
        return 'fa-clock';
      case 'inProgress':
        return 'fa-sync-alt';
      case 'completed':
        return 'fa-check-circle';
      case 'cancelled':
        return 'fa-times-circle';
      default:
        return 'fa-question-circle';
    }
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case 'pending':
        return 'Pendiente';
      case 'inProgress':
        return 'En progreso';
      case 'completed':
        return 'Completada';
      case 'cancelled':
        return 'Cancelada';
      default:
        return 'Desconocido';
    }
  }

  getSortIcon(column: string): string {
    if (this.sortColumn !== column) {
      return 'fa-sort';
    }
    return this.sortDirection === 'asc' ? 'fa-sort-up' : 'fa-sort-down';
  }

  getRequestCountByStatus(status: string): number {
    return this.cleaningRequests.filter(r => r.status === status).length;
  }

  viewDetails(request: CleaningRequestDto): void {
    this.selectedRequest = {...request};
  }

  closeModal(): void {
    this.selectedRequest = null;
  }

  startCleaning(request: CleaningRequestDto): void {
    if (request.status !== 'pending') return;

    this.loading = true;

    const actualNotes = this.extractActualNotes(request.notes);
    const newNotes = `status:inProgress|${actualNotes}`;

    this.cleaningService.update(request.cleaningId, {
      ...request,
      notes: newNotes
    }).subscribe({
      next: () => {
        this.cleaningRequests = this.cleaningRequests.map(req => {
          if (req.cleaningId === request.cleaningId) {
            return {
              ...req,
              notes: newNotes,
              status: 'inProgress' as const
            };
          }
          return req;
        });

        this.applyFilters();

        if (this.selectedRequest?.cleaningId === request.cleaningId) {
          this.selectedRequest = this.cleaningRequests.find(r => r.cleaningId === request.cleaningId) || null;
        }

        this.loading = false;
      },
      error: (err) => {
        console.error('Error al actualizar el estado de la limpieza', err);
        this.errorMessage = 'No se pudo iniciar la limpieza. Por favor, inténtelo de nuevo.';
        this.loading = false;
      }
    });
  }

  completeCleaning(request: CleaningRequestDto): void {
    if (request.status !== 'inProgress') return;

    this.loading = true;

    const actualNotes = this.extractActualNotes(request.notes);
    const newNotes = `status:completed|${actualNotes}`;

    this.cleaningService.update(request.cleaningId, {
      ...request,
      notes: newNotes
    }).subscribe({
      next: () => {
        this.cleaningRequests = this.cleaningRequests.map(req => {
          if (req.cleaningId === request.cleaningId) {
            return {
              ...req,
              notes: newNotes,
              status: 'completed' as const
            };
          }
          return req;
        });

        this.applyFilters();

        if (this.selectedRequest?.cleaningId === request.cleaningId) {
          this.selectedRequest = this.cleaningRequests.find(r => r.cleaningId === request.cleaningId) || null;
        }

        this.loading = false;
      },
      error: (err) => {
        console.error('Error al actualizar el estado de la limpieza', err);
        this.errorMessage = 'No se pudo completar la limpieza. Por favor, inténtelo de nuevo.';
        this.loading = false;
      }
    });
  }

  cancelCleaning(request: CleaningRequestDto): void {
    if (request.status !== 'pending' && request.status !== 'inProgress') return;

    this.loading = true;

    const actualNotes = this.extractActualNotes(request.notes);
    const newNotes = `status:cancelled|${actualNotes}`;

    this.cleaningService.update(request.cleaningId, {
      ...request,
      notes: newNotes
    }).subscribe({
      next: () => {
        this.cleaningRequests = this.cleaningRequests.map(req => {
          if (req.cleaningId === request.cleaningId) {
            return {
              ...req,
              notes: newNotes,
              status: 'cancelled' as const
            };
          }
          return req;
        });

        this.applyFilters();

        if (this.selectedRequest?.cleaningId === request.cleaningId) {
          this.selectedRequest = this.cleaningRequests.find(r => r.cleaningId === request.cleaningId) || null;
        }

        this.loading = false;

        if (this.selectedRequest?.cleaningId === request.cleaningId) {
          setTimeout(() => this.closeModal(), 1500);
        }
      },
      error: (err) => {
        console.error('Error al actualizar el estado de la limpieza', err);
        this.errorMessage = 'No se pudo cancelar la limpieza. Por favor, inténtelo de nuevo.';
        this.loading = false;
      }
    });
  }
}
