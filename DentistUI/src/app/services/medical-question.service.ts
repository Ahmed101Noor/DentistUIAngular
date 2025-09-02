import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  MedicalQuestionDto,
  CreateMedicalQuestionDto,
  UpdateMedicalQuestionDto
} from '../models/medical-question.model';

@Injectable({
  providedIn: 'root'
})
export class MedicalQuestionService {
  private apiUrl = `${environment.apiUrl}/MedicalQuestions`;

  constructor(private http: HttpClient) {}

  getById(id: number): Observable<MedicalQuestionDto> {
    return this.http.get<MedicalQuestionDto>(`${this.apiUrl}/${id}`);
  }

  getByPatientId(patientId: number): Observable<MedicalQuestionDto[]> {
    return this.http.get<MedicalQuestionDto[]>(`${this.apiUrl}/patient/${patientId}`);
  }

  create(dto: CreateMedicalQuestionDto): Observable<any> {
    return this.http.post<any>(this.apiUrl, dto);
  }

  update(dto: UpdateMedicalQuestionDto): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/${dto.id}`, dto);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}