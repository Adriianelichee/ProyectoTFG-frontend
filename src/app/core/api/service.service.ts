import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ServiceInDto } from '../models/service-in-dto';
import { ServiceOutDto } from '../models/service-out-dto';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ServiceService {
  private readonly baseUrl = `${environment.apiBase}/services`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<ServiceOutDto[]> {
    return this.http.get<ServiceOutDto[]>(this.baseUrl);
  }

  getById(id: number): Observable<ServiceOutDto> {
    return this.http.get<ServiceOutDto>(`${this.baseUrl}/${id}`);
  }

  create(dto: ServiceInDto): Observable<ServiceOutDto> {
    return this.http.post<ServiceOutDto>(this.baseUrl, dto);
  }

  update(id: number, dto: ServiceInDto): Observable<ServiceOutDto> {
    return this.http.put<ServiceOutDto>(`${this.baseUrl}/${id}`, dto);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
