export interface Patient {
  id: number;
  firstName: string;
  middleName: string; // تم إزالة ? لأننا هنخزن "" بدلاً من undefined
  lastName: string;
  fullName: string; // للعرض فقط
  age: number;
  gender: 'Male' | 'Female';
  phoneNumber: string;
  city: string;
  street: string; // تم إزالة ? 
  doctorNotes: string; // تم إزالة ?
  lastVisit?: string;
  nextAppointment?: string;
  nextAppointmentTime?: string;
  appointmentType?: string;
  status?: string;
  appointmentServiceName?: string;

  // Medical history checkboxes
  infectiousHepatitis: boolean;
  allergies: boolean;
  asthma: boolean;
  diabetes: boolean;
  radiationTherapy: boolean;
  epilepsy: boolean;
  hivPositive: boolean;
  anemia: boolean;
  heartDisease: boolean;
  hypertension: boolean;
  hypotension: boolean;
  hemophilia: boolean;
  kidneyDisease: boolean;
  liverDisease: boolean;
  pepticUlcer: boolean;

  // Appointment details
  appointmentDate?: string;
  appointmentTime?: string;
  appointmentDuration?: string;
  appointmentReason?: string;
  appointmentNotes?: string;

  // Additional properties
  appointments?: any[];
  medicalHistory?: any;
}

export interface PatientFormData {
  firstName: string;
  middleName: string;  // تم إزالة ?
  lastName: string;
  age: string;
  gender: 'Male' | 'Female';
  phoneNumber: string;
  city: string;
  street: string;      // تم إزالة ?
  doctorNotes: string; // تم إزالة ?
  infectiousHepatitis: boolean;
  allergies: boolean;
  asthma: boolean;
  diabetes: boolean;
  radiationTherapy: boolean;
  epilepsy: boolean;
  hivPositive: boolean;
  anemia: boolean;
  heartDisease: boolean;
  hypertension: boolean;
  hypotension: boolean;
  hemophilia: boolean;
  kidneyDisease: boolean;
  liverDisease: boolean;
  pepticUlcer: boolean;
  appointmentDate: string;
  appointmentTime: string;
  appointmentType: string;
  appointmentDuration: string;
  appointmentReason: string;
  appointmentNotes: string;
}

// DTOs
export interface RegisterPatientDto {
  firstName: string;
  middleName: string;   // تم إزالة ?
  lastName: string;
  age: number;
  gender: string;
  phoneNumber: string;
  street: string;       // تم إزالة ?
  city: string;
  doctorNotes: string;  // تم إزالة ?
  infectiousHepatitis: boolean;
  allergies: boolean;
  asthma: boolean;
  diabetes: boolean;
  radiationTherapy: boolean;
  epilepsy: boolean;
  hivPositive: boolean;
  anemia: boolean;
  heartDisease: boolean;
  hypertension: boolean;
  hypotension: boolean;
  hemophilia: boolean;
  kidneyDisease: boolean;
  liverDisease: boolean;
  pepticUlcer: boolean;
  appointmentDateTime: string;
  serviceIds: number[];
}

export interface UpdatePatientDto {
  id: number;
  firstName: string;
  middleName: string;   // تم إزالة ?
  lastName: string;
  age: number;
  gender: string;
  phoneNumber: string;
  street: string;       // تم إزالة ?
  city: string;
  doctorNotes: string;  // تم إزالة ?
}

export interface PatientSearchRequestDto {
  name?: string;
  pageNumber?: number;
  pageSize?: number;
}

export interface PatientDetailDto {
  id: number;
  fullName: string;
  age: number;
  gender: string;
  phoneNumber: string;
  street: string;        // تم إزالة ?
  city: string;          // تم إزالة ?
  doctorNotes: string;   // تم إزالة ?
  appointments?: any[];
  medicalHistory?: any;
}
export interface PatientSearchResultDto {
  patients: Patient[];
  totalCount: number;
}
  