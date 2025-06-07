import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { PurchasedServiceInDto } from '../models/purchased-service-in-dto';
import { PurchasedServiceOutDto } from '../models/purchased-service-out-dto';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class PurchasedServiceService {
  private readonly baseUrl = `${environment.apiBase}/purchased-services`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<PurchasedServiceOutDto[]> {
    return this.http.get<PurchasedServiceOutDto[]>(this.baseUrl);
  }

  getById(id: number): Observable<PurchasedServiceOutDto> {
    return this.http.get<PurchasedServiceOutDto>(`${this.baseUrl}/${id}`);
  }

  create(dto: PurchasedServiceInDto): Observable<PurchasedServiceOutDto> {
    return this.http.post<PurchasedServiceOutDto>(this.baseUrl, dto);
  }

  update(id: number, dto: PurchasedServiceInDto): Observable<PurchasedServiceOutDto> {
    return this.http.put<PurchasedServiceOutDto>(`${this.baseUrl}/${id}`, dto);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
