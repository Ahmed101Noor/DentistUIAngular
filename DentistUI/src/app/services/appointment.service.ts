import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { DentalService } from '../models/dental-service.model';

@Injectable({ providedIn: 'root' })
export class AppointmentService {
  private readonly apiUrl = `${environment.apiUrl}/appointments`; // عدّل الرابط حسب عنوان API الفعلي

  constructor(private http: HttpClient) {}

  getAll(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl);
  }

  getById(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}`);
  }

  getByPatientId(patientId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/patient/${patientId}`);
  }

  getByDate(date: string): Observable<any[]> {
    const params = new HttpParams().set('date', date);
    return this.http.get<any[]>(`${this.apiUrl}/date`, { params });
  }

  getByStatus(status: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/status/${status}`);
  }

  getByServiceId(serviceId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/service/${serviceId}`);
  }

  getByDateRange(from: string, to: string): Observable<any[]> {
    const params = new HttpParams().set('from', from).set('to', to);
    return this.http.get<any[]>(`${this.apiUrl}/range`, { params });
  }

  getUpcoming(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/upcoming`);
  }

  getPast(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/past`);
  }

  getPendingByPatientId(patientId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/pending/${patientId}`);
  }

  getReminders(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/reminders`);
  }

  searchByPatientName(name: string): Observable<any[]> {
    const params = new HttpParams().set('name', name);
    return this.http.get<any[]>(`${this.apiUrl}/search`, { params });
  }

  getStatusStats(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/stats`);
  }

  create(appointment: any): Observable<any> {
    return this.http.post<any>(this.apiUrl, appointment);
  }

  update(id: number, appointment: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}`, appointment);
  }

  delete(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`);
  }

  getServices(): Observable<DentalService[]> {
    return this.http.get<DentalService[]>(`${environment.apiUrl}/dentalservices`);
  }

  getAvailableSlots(date: string, serviceIds: string): Observable<string[]> {
    return this.http.get<string[]>(`${environment.apiUrl}/appointments/available-slots?date=${date}&serviceIds=${serviceIds}`);
  }
}