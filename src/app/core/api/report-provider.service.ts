import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ReportProviderInDto } from '../models/report-provider-in-dto';
import { ReportProviderOutDto } from '../models/report-provider-out-dto';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ReportProviderService {
  private readonly baseUrl = `${environment.apiBase}/reports-providers`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<ReportProviderOutDto[]> {
    return this.http.get<ReportProviderOutDto[]>(this.baseUrl);
  }

  getById(id: number): Observable<ReportProviderOutDto> {
    return this.http.get<ReportProviderOutDto>(`${this.baseUrl}/${id}`);
  }

  create(dto: ReportProviderInDto): Observable<ReportProviderOutDto> {
    return this.http.post<ReportProviderOutDto>(this.baseUrl, dto);
  }

  update(id: number, dto: ReportProviderInDto): Observable<ReportProviderOutDto> {
    return this.http.put<ReportProviderOutDto>(`${this.baseUrl}/${id}`, dto);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
