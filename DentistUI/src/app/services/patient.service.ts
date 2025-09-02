import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Patient, RegisterPatientDto, UpdatePatientDto, PatientSearchRequestDto, PatientDetailDto } from '../models/patient.model';

@Injectable({ providedIn: 'root' })
export class PatientService {
  private readonly apiUrl = `${environment.apiUrl}/patients`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<Patient[]> {
    return this.http.get<Patient[]>(this.apiUrl);
  }

  getById(id: number): Observable<PatientDetailDto> {
    return this.http.get<PatientDetailDto>(`${this.apiUrl}/${id}`);
  }

  search(request: PatientSearchRequestDto): Observable<Patient[]> {
    return this.http.post<Patient[]>(`${this.apiUrl}/search`, request);
  }

  add(patient: RegisterPatientDto): Observable<any> {
    return this.http.post<any>(this.apiUrl, patient);
  }

  update(id: number, patient: UpdatePatientDto): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}`, patient);
  }

  delete(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`);
  }

  registerPatient(dto: RegisterPatientDto): Observable<any> {
    return this.http.post(`${this.apiUrl}`, dto);
  }

  // Get patient appointments from appointments endpoint
  getPatientAppointments(patientId: number): Observable<any[]> {
    return this.http.get<any[]>(`${environment.apiUrl}/appointments/patient/${patientId}`);
  }

  // Get patient medical history from medical histories endpoint
  getPatientMedicalHistory(patientId: number): Observable<any> {
    return this.http.get<any>(`${environment.apiUrl}/medicalhistories/patient/${patientId}`);
  }
} 