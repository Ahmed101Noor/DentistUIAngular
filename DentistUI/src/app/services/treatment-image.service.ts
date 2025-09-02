import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { CreateTreatmentImageDto, UpdateTreatmentImageDto, TreatmentImageDto } from '../models/treatment-plan.model';

@Injectable({ providedIn: 'root' })
export class TreatmentImageService {
  private readonly apiUrl = `${environment.apiUrl}/treatmentimages`;

  constructor(private http: HttpClient) {}

  getByTreatmentPlanId(treatmentPlanId: number): Observable<TreatmentImageDto[]> {
    return this.http.get<TreatmentImageDto[]>(`${this.apiUrl}/treatment-plan/${treatmentPlanId}`);
  }

  getById(id: number): Observable<TreatmentImageDto> {
    return this.http.get<TreatmentImageDto>(`${this.apiUrl}/${id}`);
  }

  create(image: CreateTreatmentImageDto): Observable<any> {
    // إنشاء FormData لإرسال الملف
    const formData = new FormData();
    formData.append('TreatmentPlanId', image.treatmentPlanId.toString());
    formData.append('ImageType', image.imageType);
    formData.append('UploadDate', image.uploadDate);
    
    if (image.imageFile) {
      formData.append('ImageFile', image.imageFile);
    }
    
    return this.http.post<any>(this.apiUrl, formData);
  }

  update(id: number, image: UpdateTreatmentImageDto): Observable<any> {
    const formData = new FormData();
    formData.append('Id', id.toString());
    formData.append('ImageType', image.imageType);
    
    if (image.file) {
      formData.append('File', image.file);
    }
    
    return this.http.put<any>(`${this.apiUrl}/${id}`, formData);
  }

  delete(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`);
  }
}
