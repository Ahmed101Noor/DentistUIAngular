export interface AppointmentDto {
  id: number;
  patientFullName: string;
  serviceNames: string[];
  appointmentDateTime: string; // ISO string
  status: string;
  isReminderSent: boolean;
}

export interface CreateAppointmentDto {
  patientId: number;
  serviceIds: number[];
  appointmentDateTime: string; // ISO string
}

export interface UpdateAppointmentDto extends CreateAppointmentDto {
  id: number;
} 