import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CompanyInDto } from '../models/company-in-dto';
import { CompanyOutDto } from '../models/company-out-dto';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class CompanyService {
  private readonly baseUrl = `${environment.apiBase}/companies`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<CompanyOutDto[]> {
    return this.http.get<CompanyOutDto[]>(this.baseUrl);
  }

  getById(id: number): Observable<CompanyOutDto> {
    return this.http.get<CompanyOutDto>(`${this.baseUrl}/${id}`);
  }

  create(dto: CompanyInDto): Observable<CompanyOutDto> {
    return this.http.post<CompanyOutDto>(this.baseUrl, dto);
  }

  update(id: number, dto: CompanyInDto): Observable<CompanyOutDto> {
    return this.http.put<CompanyOutDto>(`${this.baseUrl}/${id}`, dto);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
