import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { TeethDto, UpdateToothStatusDto } from '../models/teeth.model';

@Injectable({
  providedIn: 'root'
})
export class TeethService {
  private apiUrl = `${environment.apiUrl}/Teeth`;

  constructor(private http: HttpClient) {}

  getById(id: number): Observable<TeethDto> {
    return this.http.get<TeethDto>(`${this.apiUrl}/${id}`);
  }

  getAllByPatientId(patientId: number): Observable<TeethDto[]> {
    const parsedId = patientId ; // Ensure int32
    return this.http.get<TeethDto[]>(`${this.apiUrl}/patient/${parsedId}`);
  }

  getStatusById(id: number): Observable<string> {
    return this.http.get<string>(`${this.apiUrl}/status/${id}`);
  }

  updateToothStatus(patientId: number, toothNumber: number, dto: UpdateToothStatusDto): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/patient/${patientId}/number/${toothNumber}`, dto);
  }
}