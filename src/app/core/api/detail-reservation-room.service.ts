import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { DetailReservationRoomInDto } from '../models/detail-reservation-room-in-dto';
import { DetailReservationRoomOutDto } from '../models/detail-reservation-room-out-dto';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class DetailReservationRoomService {
  private readonly baseUrl = `${environment.apiBase}/details-reservations-rooms`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<DetailReservationRoomOutDto[]> {
    return this.http.get<DetailReservationRoomOutDto[]>(this.baseUrl);
  }

  getById(id: number): Observable<DetailReservationRoomOutDto> {
    return this.http.get<DetailReservationRoomOutDto>(`${this.baseUrl}/${id}`);
  }

  create(dto: DetailReservationRoomInDto): Observable<DetailReservationRoomOutDto> {
    return this.http.post<DetailReservationRoomOutDto>(this.baseUrl, dto);
  }

  update(id: number, dto: DetailReservationRoomInDto): Observable<DetailReservationRoomOutDto> {
    return this.http.put<DetailReservationRoomOutDto>(`${this.baseUrl}/${id}`, dto);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
