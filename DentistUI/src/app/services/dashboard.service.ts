import { Injectable } from '@angular/core';
import { forkJoin, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { PatientService } from './patient.service';
import { AppointmentService } from './appointment.service';
import { TreatmentPlanService } from './treatment-plan.service';
import { Patient } from '../models/patient.model';
import { AppointmentDto } from '../models/appointment.model';

export interface DashboardStats {
  totalPatients: number;
  todayAppointments: number;
  pendingAppointments: number;
  completedTreatments: number;
}

export interface RecentActivity {
  id: string;
  type: 'appointment' | 'registration';
  title: string;
  description: string;
  time: string;
  patientName?: string;
}

export interface DashboardData {
  stats: DashboardStats;
  recentActivities: RecentActivity[];
  upcomingAppointments: AppointmentDto[];
}

@Injectable({ providedIn: 'root' })
export class DashboardService {
  constructor(
    private patientService: PatientService,
    private appointmentService: AppointmentService,
    private treatmentPlanService: TreatmentPlanService
  ) {}

  getDashboardData(): Observable<DashboardData> {
    const today = new Date().toISOString().split('T')[0];
    return forkJoin({
      patients: this.patientService.getAll(),
      todayAppointments: this.appointmentService.getByDate(today),
      pendingAppointments: this.appointmentService.getByStatus('Pending'),
      completedTreatments: this.treatmentPlanService.countCompleted(),
      upcomingAppointments: this.appointmentService.getUpcoming()
    }).pipe(
      map(result => {
        const stats: DashboardStats = {
          totalPatients: result.patients.length,
          todayAppointments: result.todayAppointments.length,
          pendingAppointments: result.pendingAppointments.length,
          completedTreatments: result.completedTreatments
        };
        const recentActivities: RecentActivity[] = [
          ...(result.todayAppointments.slice(0, 2).map(a => ({
            id: String(a.id),
            type: 'appointment' as 'appointment',
            title: 'موعد جديد',
            description: `موعد للمريض ${a.patientFullName || a.patientName}`,
            time: a.appointmentDateTime || a.time,
            patientName: a.patientFullName || a.patientName
          }))),
          ...(result.patients.slice(-2).map(p => ({
            id: String(p.id),
            type: 'registration' as 'registration',
            title: 'مريض جديد',
            description: `تم تسجيل المريض ${p.fullName}`,
            time: (p as any).createdAt || '',
            patientName: p.fullName
          })))
        ];
        return {
          stats,
          recentActivities,
          upcomingAppointments: result.upcomingAppointments
        };
      })
    );
  }
} 