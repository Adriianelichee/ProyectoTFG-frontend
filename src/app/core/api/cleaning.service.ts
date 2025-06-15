import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CleaningInDto } from '../models/cleaning-in-dto';
import { CleaningOutDto } from '../models/cleaning-out-dto';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' }) // Hace que el servicio sea singleton y disponible en toda la aplicacion
export class CleaningService {
  private readonly baseUrl = `${environment.apiBase}/cleanings` // URL base para las peticiones relacionadas con cleaning

  constructor(private http: HttpClient) {} // Inyecta el cliente HTTP para hacer peticiones

  getAll(): Observable<CleaningOutDto[]> { // Obtiene todos los registros de cleaning y Observable se usa para recibir datos de manera reactiva y con datos asincronos
    return this.http.get<CleaningOutDto[]>(this.baseUrl) // Realiza una peticion GET a la URL base
  }

  getById(id: number): Observable<CleaningOutDto> { // Obtiene un registro de cleaning por su id
    return this.http.get<CleaningOutDto>(`${this.baseUrl}/${id}`) // Realiza una peticion GET a la URL con el id
  }

  create(dto: CleaningInDto): Observable<CleaningOutDto> { // Crea un nuevo registro de cleaning
    return this.http.post<CleaningOutDto>(this.baseUrl, dto) // Realiza una peticion POST enviando los datos
  }

  update(id: number, dto: CleaningInDto): Observable<CleaningOutDto> { // Actualiza un registro de cleaning por su id
    return this.http.put<CleaningOutDto>(`${this.baseUrl}/${id}`, dto) // Realiza una peticion PUT con el id y los datos
  }

  delete(id: number): Observable<void> { // Elimina un registro de cleaning por su id
    return this.http.delete<void>(`${this.baseUrl}/${id}`) // Realiza una peticion DELETE a la URL con el id
  }
}
