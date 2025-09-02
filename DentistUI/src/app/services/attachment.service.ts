import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { CreateAttachmentDto, UpdateAttachmentDto, AttachmentDto } from '../models/treatment-plan.model';

@Injectable({ providedIn: 'root' })
export class AttachmentService {
  private readonly apiUrl = `${environment.apiUrl}/attachments`;

  constructor(private http: HttpClient) {}

  getByTreatmentPlanId(treatmentPlanId: number): Observable<AttachmentDto[]> {
    return this.http.get<AttachmentDto[]>(`${this.apiUrl}/treatment-plan/${treatmentPlanId}`);
  }

  getById(id: number): Observable<AttachmentDto> {
    return this.http.get<AttachmentDto>(`${this.apiUrl}/${id}`);
  }

  create(attachment: CreateAttachmentDto): Observable<any> {
    // Create FormData for file upload
    const formData = new FormData();
    formData.append('TreatmentPlanId', attachment.treatmentPlanId.toString());
    formData.append('Type', attachment.type);
    
    if (attachment.file) {
      formData.append('File', attachment.file);
    }
    
    return this.http.post<any>(`${this.apiUrl}/attachments`, formData);
  }

  update(id: number, attachment: UpdateAttachmentDto): Observable<any> {
    const formData = new FormData();
    formData.append('Id', id.toString());
    formData.append('Type', attachment.type);
    
    if (attachment.file) {
      formData.append('File', attachment.file);
    }
    
    return this.http.put<any>(`${this.apiUrl}/${id}`, formData);
  }

  delete(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`);
  }
}