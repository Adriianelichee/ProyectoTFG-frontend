import { Injectable } from '@angular/core';
import {HttpClient, HttpParams} from '@angular/common/http';
import { Observable } from 'rxjs';
import { DetailReservationWorkstationInDto } from '../models/detail-reservation-workstation-in-dto';
import { DetailReservationWorkstationOutDto } from '../models/detail-reservation-workstation-out-dto';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class DetailReservationWorkstationService {
  private readonly baseUrl = `${environment.apiBase}/reservation-details/workstations`;

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

  /**
   * Obtiene los detalles de reservas para una estación de trabajo específica
   * @param workstationId ID de la estación de trabajo
   */
  getByWorkstation(workstationId: number): Observable<DetailReservationWorkstationOutDto[]> {
    return this.http.get<DetailReservationWorkstationOutDto[]>(`${this.baseUrl}/workstation/${workstationId}`);
  }

  /**
   * Obtiene las reservas que existen entre dos fechas específicas
   * @param start Fecha de inicio (ISO string)
   * @param end Fecha de fin (ISO string)
   */
  getOccupiedBetweenDates(start: string, end: string): Observable<DetailReservationWorkstationOutDto[]> {
    let params = new HttpParams()
      .set('startDate', start)
      .set('endDate', end);

    return this.http.get<DetailReservationWorkstationOutDto[]>(`${this.baseUrl}/occupied`, { params });
  }

}
