import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {PaymentInDto, PaymentStatus} from '../models/payment-in-dto';
import { PaymentOutDto } from '../models/payment-out-dto';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class PaymentService {
  private readonly baseUrl = `${environment.apiBase}/payments`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<PaymentOutDto[]> {
    return this.http.get<PaymentOutDto[]>(this.baseUrl);
  }

  getById(id: number): Observable<PaymentOutDto> {
    return this.http.get<PaymentOutDto>(`${this.baseUrl}/${id}`);
  }

  create(dto: PaymentInDto): Observable<PaymentOutDto> {
    return this.http.post<PaymentOutDto>(this.baseUrl, dto);
  }

  update(id: number, dto: PaymentInDto): Observable<PaymentOutDto> {
    return this.http.put<PaymentOutDto>(`${this.baseUrl}/${id}`, dto);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  updateStatus(paymentId: number, newStatus: PaymentStatus): Observable<PaymentOutDto>{
    return this.http.put<PaymentOutDto>(`${this.baseUrl}/${paymentId}/status`, { status: newStatus });
  }
}
