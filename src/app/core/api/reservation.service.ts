import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ReservationInDto } from '../models/reservation-in-dto';
import { ReservationOutDto } from '../models/reservation-out-dto';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ReservationService {
  private readonly baseUrl = `${environment.apiBase}/reservations`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<ReservationOutDto[]> {
    return this.http.get<ReservationOutDto[]>(this.baseUrl);
  }

  getById(id: number): Observable<ReservationOutDto> {
    return this.http.get<ReservationOutDto>(`${this.baseUrl}/${id}`);
  }

  create(dto: ReservationInDto): Observable<ReservationOutDto> {
    return this.http.post<ReservationOutDto>(this.baseUrl, dto);
  }

  update(id: number, dto: ReservationInDto): Observable<ReservationOutDto> {
    return this.http.put<ReservationOutDto>(`${this.baseUrl}/${id}`, dto);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
