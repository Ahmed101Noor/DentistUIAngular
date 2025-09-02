import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { DentalService } from '../models/dental-service.model';

@Injectable({ providedIn: 'root' })
export class DentalServiceService {
  private readonly apiUrl = `${environment.apiUrl}/dentalservices`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<DentalService[]> {
    return this.http.get<DentalService[]>(this.apiUrl);
  }

  getById(id: number): Observable<DentalService> {
    return this.http.get<DentalService>(`${this.apiUrl}/${id}`);
  }

  create(service: Omit<DentalService, 'id'>): Observable<number> {
    return this.http.post<number>(this.apiUrl, service);
  }

  update(id: number, service: Omit<DentalService, 'id'>): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/${id}`, { id, ...service });
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}