export interface CreateTreatmentPlanDto {
  patientId: number;
  description: string;
  plannedDate: string; // ISO string
  treatmentPlanType: string;
  estimatedCost: number;
  isCompleted: boolean;
  treatmentImages?: CreateTreatmentImageDto[];
  attachments?: CreateAttachmentDto[];
}

export interface UpdateTreatmentPlanDto {
  description: string;
  plannedDate: string; // ISO string
  isCompleted: boolean;
  treatmentPlanType: string;
  estimatedCost: number;
  patientId: number;
  treatmentImageIds?: number[];
  treatmentImages?: CreateTreatmentImageDto[];
  attachments?: CreateAttachmentDto[];
}

export interface TreatmentPlanDto {
  id: number;
  description: string;
  plannedDate: string; // ISO string
  treatmentPlanType: string;
  isCompleted: boolean;
  patientId: number;
  estimatedCost: number;
}

export interface TreatmentPlanRequest {
  patientId: number;
  description: string;
  plannedDate: string; // ISO string
  treatmentPlanType: string;
  isCompleted: boolean;
  estimatedCost: number;
  treatmentImages?: CreateTreatmentImageDto[];
  attachments?: CreateAttachmentDto[];
}

export interface TreatmentPlanSearchRequestDto {
  keyword?: string;
  pageNumber: number;
  pageSize: number;
}

export interface CreateTreatmentImageDto {
  treatmentPlanId: number;
  imageFile?: File; // This should be File, not base64 string
  imageType: string;
  uploadDate: string;
  // Remove imageUrl as it's not needed for creation
}

export interface CreateAttachmentDto {
  treatmentPlanId: number;
  file: File; // This should be File, not base64 string
  type: string;
  // Remove fileUrl as it's not needed for creation
}

export interface UpdateTreatmentImageDto {
  id: number;
  imageType: string;
  file?: File; // تغيير من imageUrl إلى file
}

export interface TreatmentImageDto {
  id: number;
  treatmentPlanId?: number;
  imageUrl?: string;
  imageType?: string;
  uploadDate?: string; // ISO string
}

export interface UpdateAttachmentDto {
  id: number;
  type: string;
  file?: File; // تغيير من fileUrl إلى file
}

export interface AttachmentDto {
  id: number;
  treatmentPlanId?: number;
  fileUrl?: string;
  type?: string;
  uploadDate?: string; // ISO string
}