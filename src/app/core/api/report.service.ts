import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ReportInDto } from '../models/report-in-dto';
import { ReportOutDto } from '../models/report-out-dto';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ReportService {
  private readonly baseUrl = `${environment.apiBase}/reports`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<ReportOutDto[]> {
    return this.http.get<ReportOutDto[]>(this.baseUrl);
  }

  getById(id: number): Observable<ReportOutDto> {
    return this.http.get<ReportOutDto>(`${this.baseUrl}/${id}`);
  }

  create(dto: ReportInDto): Observable<ReportOutDto> {
    return this.http.post<ReportOutDto>(this.baseUrl, dto);
  }

  update(id: number, dto: ReportInDto): Observable<ReportOutDto> {
    return this.http.put<ReportOutDto>(`${this.baseUrl}/${id}`, dto);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
