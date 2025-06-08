import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { FloorInDto } from '../models/floor-in-dto';
import { FloorOutDto } from '../models/floor-out-dto';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class FloorService {
  private readonly baseUrl = `${environment.apiBase}/floors`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<FloorOutDto[]> {
    return this.http.get<FloorOutDto[]>(this.baseUrl);
  }

  getById(id: number): Observable<FloorOutDto> {
    return this.http.get<FloorOutDto>(`${this.baseUrl}/${id}`);
  }

  create(dto: FloorInDto): Observable<FloorOutDto> {
    return this.http.post<FloorOutDto>(this.baseUrl, dto);
  }

  update(id: number, dto: FloorInDto): Observable<FloorOutDto> {
    return this.http.put<FloorOutDto>(`${this.baseUrl}/${id}`, dto);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
  getByCompanyId(companyId: number): Observable<FloorOutDto[]> {
    return this.http.get<FloorOutDto[]>(`${this.baseUrl}/company/${companyId}`);
  }

}
