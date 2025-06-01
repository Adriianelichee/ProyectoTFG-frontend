import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CleaningInDto } from '../models/cleaning-in-dto';
import { CleaningOutDto } from '../models/cleaning-out-dto';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class CleaningService {
  private readonly baseUrl = `${environment.apiBase}/cleanings`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<CleaningOutDto[]> {
    return this.http.get<CleaningOutDto[]>(this.baseUrl);
  }

  getById(id: number): Observable<CleaningOutDto> {
    return this.http.get<CleaningOutDto>(`${this.baseUrl}/${id}`);
  }

  create(dto: CleaningInDto): Observable<CleaningOutDto> {
    return this.http.post<CleaningOutDto>(this.baseUrl, dto);
  }

  update(id: number, dto: CleaningInDto): Observable<CleaningOutDto> {
    return this.http.put<CleaningOutDto>(`${this.baseUrl}/${id}`, dto);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
