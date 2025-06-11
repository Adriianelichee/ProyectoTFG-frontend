import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { DetailReservationRoomInDto } from '../models/detail-reservation-room-in-dto';
import { DetailReservationRoomOutDto } from '../models/detail-reservation-room-out-dto';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class DetailReservationRoomService {
  private readonly baseUrl = `${environment.apiBase}/reservation-details/rooms`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<DetailReservationRoomOutDto[]> {
    return this.http.get<DetailReservationRoomOutDto[]>(this.baseUrl);
  }

  getById(id: number): Observable<DetailReservationRoomOutDto> {
    return this.http.get<DetailReservationRoomOutDto>(`${this.baseUrl}/${id}`);
  }

  getByReservationId(reservationId: number): Observable<DetailReservationRoomOutDto> {
    return this.http.get<DetailReservationRoomOutDto>(`${this.baseUrl}/reservation/${reservationId}`);
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

  /**
   * Obtiene todos los detalles de reservas de salas ocupadas
   */
  getOccupiedRoomDetails(): Observable<DetailReservationRoomOutDto[]> {
    return this.http.get<DetailReservationRoomOutDto[]>(`${this.baseUrl}/occupied`);
  }

  /**
   * Obtiene los detalles de reservas ocupadas para una sala específica
   * @param roomId ID de la sala
   */
  getByRoom(roomId: number): Observable<DetailReservationRoomOutDto[]> {
    return this.http.get<DetailReservationRoomOutDto[]>(`${this.baseUrl}/occupied/room/${roomId}`);
  }

  /**
   * Obtiene los detalles de reservas ocupadas entre dos fechas
   * @param start Fecha y hora de inicio (ISO string)
   * @param end Fecha y hora de fin (ISO string)
   */
  getOccupiedBetweenDates(start: string, end: string): Observable<DetailReservationRoomOutDto[]> {
    let params = new HttpParams()
      .set('start', start)
      .set('end', end);

    return this.http.get<DetailReservationRoomOutDto[]>(`${this.baseUrl}/occupied/date-range`, { params });
  }
}
