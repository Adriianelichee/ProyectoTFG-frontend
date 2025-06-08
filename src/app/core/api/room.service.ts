import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { RoomInDto } from '../models/room-in-dto';
import { RoomOutDto } from '../models/room-out-dto';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class RoomService {
  private readonly baseUrl = `${environment.apiBase}/rooms`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<RoomOutDto[]> {
    return this.http.get<RoomOutDto[]>(this.baseUrl);
  }

  getById(id: number): Observable<RoomOutDto> {
    return this.http.get<RoomOutDto>(`${this.baseUrl}/${id}`);
  }

  getByFloorId(floorId: number): Observable<RoomOutDto[]> {
    return this.http.get<RoomOutDto[]>(`${this.baseUrl}/floor/${floorId}`);
  }

  create(dto: RoomInDto): Observable<RoomOutDto> {
    return this.http.post<RoomOutDto>(this.baseUrl, dto);
  }

  update(id: number, dto: RoomInDto): Observable<RoomOutDto> {
    return this.http.put<RoomOutDto>(`${this.baseUrl}/${id}`, dto);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
