import { Routes } from '@angular/router';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { PatientRegistrationComponent } from './components/patient-registration/patient-registration.component';
import { AppointmentScheduleComponent } from './components/appointment-schedule/appointment-schedule.component';
import { PatientListComponent } from './components/patient-list/patient-list.component';
import { TreatmentPlansComponent } from './components/treatment-plans/treatment-plans.component';
import { MedicalHistoryComponent } from './components/medical-history/medical-history.component';
import { ReportsComponent } from './components/reports/reports.component';
import { InventoryManagementComponent } from './components/inventory-management/inventory-management.component';
import { ClinicManagementComponent } from './components/clinic-management/clinic-management.component';
import { PaymentManagementComponent } from './components/payment-management/payment-management.component';
import { LoadingGuard } from './guards/loading.guard';

export const routes: Routes = [
  { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
  { path: 'dashboard', component: DashboardComponent, canActivate: [LoadingGuard] },
  { path: 'register', component: PatientRegistrationComponent, canActivate: [LoadingGuard] },
  { path: 'schedule', component: AppointmentScheduleComponent, canActivate: [LoadingGuard] },
  { path: 'patients', component: PatientListComponent, canActivate: [LoadingGuard] },
  { path: 'treatments', component: TreatmentPlansComponent, canActivate: [LoadingGuard] },
  { path: 'history', component: MedicalHistoryComponent, canActivate: [LoadingGuard] },
  { path: 'reports', component: ReportsComponent, canActivate: [LoadingGuard] },
  { path: 'inventory', component: InventoryManagementComponent, canActivate: [LoadingGuard] },
  { path: 'payments', component: PaymentManagementComponent, canActivate: [LoadingGuard] },
  { path: 'clinic', component: ClinicManagementComponent, canActivate: [LoadingGuard] }
];
