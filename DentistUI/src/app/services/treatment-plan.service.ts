import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { TreatmentPlanDto, CreateTreatmentPlanDto, UpdateTreatmentPlanDto, TreatmentPlanRequest, TreatmentPlanSearchRequestDto, CreateAttachmentDto, CreateTreatmentImageDto } from '../models/treatment-plan.model';
import { switchMap } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class TreatmentPlanService {
  private readonly apiUrl = `${environment.apiUrl}/treatmentplans`; // عدّل الرابط حسب عنوان API الفعلي

  constructor(private http: HttpClient) {}

  getAll(): Observable<TreatmentPlanDto[]> {
    return this.http.get<TreatmentPlanDto[]>(this.apiUrl);
  }

  getById(id: number): Observable<TreatmentPlanDto> {
    return this.http.get<TreatmentPlanDto>(`${this.apiUrl}/${id}`);
  }

  getByPatientId(patientId: number): Observable<TreatmentPlanDto[]> {
    return this.http.get<TreatmentPlanDto[]>(`${this.apiUrl}/patient/${patientId}`);
  }

  getByCompletionStatus(isCompleted: boolean): Observable<TreatmentPlanDto[]> {
    return this.http.get<TreatmentPlanDto[]>(`${this.apiUrl}/completion-status/${isCompleted}`);
  }

  searchByDescription(keyword: string): Observable<TreatmentPlanDto[]> {
    const params = new HttpParams().set('keyword', keyword);
    return this.http.get<TreatmentPlanDto[]>(`${this.apiUrl}/search-description`, { params });
  }

  countByPatientId(patientId: number): Observable<number> {
    return this.http.get<number>(`${this.apiUrl}/count/patient/${patientId}`);
  }

  countCompleted(): Observable<number> {
    return this.http.get<number>(`${this.apiUrl}/count/completed`);
  }

  countPending(): Observable<number> {
    return this.http.get<number>(`${this.apiUrl}/count/pending`);
  }

  getIncompletePlansByPatientId(patientId: number): Observable<TreatmentPlanDto[]> {
    return this.http.get<TreatmentPlanDto[]>(`${this.apiUrl}/incomplete/${patientId}`);
  }

  search(body: TreatmentPlanSearchRequestDto): Observable<TreatmentPlanDto[]> {
    return this.http.post<TreatmentPlanDto[]>(`${this.apiUrl}/search`, body);
  }

  create(plan: CreateTreatmentPlanDto): Observable<any> {
    const formData = new FormData();
    
    // Add basic plan data
    formData.append('PatientId', plan.patientId.toString());
    formData.append('Description', plan.description);
    formData.append('PlannedDate', new Date(plan.plannedDate).toISOString());
    formData.append('TreatmentPlanType', plan.treatmentPlanType);
    formData.append('IsCompleted', (plan.isCompleted ?? false).toString());
    formData.append('EstimatedCost', plan.estimatedCost.toString());
    
    // Add treatment images if any
    if (plan.treatmentImages && plan.treatmentImages.length > 0) {
      plan.treatmentImages.forEach((img, index) => {
        if (img.imageFile) {
          formData.append(`TreatmentImages[${index}].ImageFile`, img.imageFile);
          formData.append(`TreatmentImages[${index}].ImageType`, img.imageType || 'before');
          formData.append(`TreatmentImages[${index}].UploadDate`, new Date().toISOString());
        }
      });
    }
    
    // Add attachments if any
    if (plan.attachments && plan.attachments.length > 0) {
      plan.attachments.forEach((att, index) => {
        if (att.file) {
          formData.append(`Attachments[${index}].File`, att.file);
          formData.append(`Attachments[${index}].Type`, att.type || 'Other');
        }
      });
    }
    
    return this.http.post<any>(this.apiUrl, formData);
  }

  update(id: number, plan: UpdateTreatmentPlanDto): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}`, plan);
  }

  delete(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`);
  }

  toggleCompletionStatus(id: number, isCompleted: boolean): Observable<any> {
    // First get the current plan data
    return this.http.get<TreatmentPlanDto>(`${this.apiUrl}/${id}`).pipe(
      switchMap(plan => {
        const updateDto: UpdateTreatmentPlanDto = {
          description: plan.description,
          plannedDate: plan.plannedDate,
          isCompleted: isCompleted,
          treatmentPlanType: plan.treatmentPlanType,
          estimatedCost: plan.estimatedCost,
          patientId: plan.patientId,
          treatmentImageIds: [],
          treatmentImages: [],
          attachments: []
        };
        return this.update(id, updateDto);
      })
    );
  }

  // Helper methods for dropdowns (local, not API)
  getTreatmentTypes(): { value: string; label: string }[] {
    return [
      { value: 'cleaning', label: 'تنظيف الأسنان' },
      { value: 'filling', label: 'حشو' },
      { value: 'extraction', label: 'خلع' },
      { value: 'root_canal', label: 'علاج الجذر' },
      { value: 'crown', label: 'تاج' },
      { value: 'bridge', label: 'جسر' },
      { value: 'implant', label: 'زراعة' },
      { value: 'orthodontics', label: 'تقويم' },
      { value: 'surgery', label: 'جراحة' },
      { value: 'other', label: 'أخرى' }
    ];
  }
}