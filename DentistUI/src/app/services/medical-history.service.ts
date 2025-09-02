import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class MedicalHistoryService {
  private readonly apiUrl = `${environment.apiUrl}/medicalhistories`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl);
  }

  getById(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}`);
  }

  getByPatientId(patientId: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/patient/${patientId}`);
  }

  create(history: any): Observable<any> {
    return this.http.post<any>(this.apiUrl, history);
  }

  update(id: number, history: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}`, history);
  }

  delete(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`);
  }
} 