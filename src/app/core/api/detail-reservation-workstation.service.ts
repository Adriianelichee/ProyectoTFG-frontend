import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { DetailReservationWorkstationInDto } from '../models/detail-reservation-workstation-in-dto';
import { DetailReservationWorkstationOutDto } from '../models/detail-reservation-workstation-out-dto';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class DetailReservationWorkstationService {
  private readonly baseUrl = `${environment.apiBase}/details-reservations-workstations`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<DetailReservationWorkstationOutDto[]> {
    return this.http.get<DetailReservationWorkstationOutDto[]>(this.baseUrl);
  }

  getById(id: number): Observable<DetailReservationWorkstationOutDto> {
    return this.http.get<DetailReservationWorkstationOutDto>(`${this.baseUrl}/${id}`);
  }

  create(dto: DetailReservationWorkstationInDto): Observable<DetailReservationWorkstationOutDto> {
    return this.http.post<DetailReservationWorkstationOutDto>(this.baseUrl, dto);
  }

  update(id: number, dto: DetailReservationWorkstationInDto): Observable<DetailReservationWorkstationOutDto> {
    return this.http.put<DetailReservationWorkstationOutDto>(`${this.baseUrl}/${id}`, dto);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
