import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { WorkstationInDto } from '../models/workstation-in-dto';
import { WorkstationOutDto } from '../models/workstation-out-dto';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class WorkstationService {
  private readonly baseUrl = `${environment.apiBase}/workstations`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<WorkstationOutDto[]> {
    return this.http.get<WorkstationOutDto[]>(this.baseUrl);
  }

  getById(id: number): Observable<WorkstationOutDto> {
    return this.http.get<WorkstationOutDto>(`${this.baseUrl}/${id}`);
  }

  getByFloor(floorId: number): Observable<WorkstationOutDto[]> {
    return this.http.get<WorkstationOutDto[]>(`${this.baseUrl}/floor/${floorId}`);
  }

  create(dto: WorkstationInDto): Observable<WorkstationOutDto> {
    return this.http.post<WorkstationOutDto>(this.baseUrl, dto);
  }

  update(id: number, dto: WorkstationInDto): Observable<WorkstationOutDto> {
    return this.http.put<WorkstationOutDto>(`${this.baseUrl}/${id}`, dto);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
