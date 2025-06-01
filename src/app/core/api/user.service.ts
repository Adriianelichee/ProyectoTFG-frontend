import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { UserInDto } from '../models/user-in-dto';
import { UserOutDto } from '../models/user-out-dto';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class UserService {
  private readonly baseUrl = `${environment.apiBase}/users`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<UserOutDto[]> {
    return this.http.get<UserOutDto[]>(this.baseUrl);
  }

  getById(id: number): Observable<UserOutDto> {
    return this.http.get<UserOutDto>(`${this.baseUrl}/${id}`);
  }

  create(dto: UserInDto): Observable<UserOutDto> {
    return this.http.post<UserOutDto>(this.baseUrl, dto);
  }

  update(id: number, dto: UserInDto): Observable<UserOutDto> {
    return this.http.put<UserOutDto>(`${this.baseUrl}/${id}`, dto);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
