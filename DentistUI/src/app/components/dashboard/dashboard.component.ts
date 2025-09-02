import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { LoadingService } from '../../services/loading.service';
import { DashboardService, DashboardStats, RecentActivity } from '../../services/dashboard.service';
import { AppointmentDto } from '../../models/appointment.model';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit {
  stats: DashboardStats = {
    totalPatients: 0,
    todayAppointments: 0,
    pendingAppointments: 0,
    completedTreatments: 0
  };

  recentActivities: RecentActivity[] = [];
  upcomingAppointments: AppointmentDto[] = [];
  isLoading = true;

  constructor(
    private loadingService: LoadingService,
    private dashboardService: DashboardService
  ) {}

  ngOnInit(): void {
    this.loadDashboardData();
  }

  loadDashboardData(): void {
    this.isLoading = true;
    this.loadingService.show();
    this.dashboardService.getDashboardData().subscribe(data => {
      this.stats = data.stats;
      this.recentActivities = data.recentActivities;
      this.upcomingAppointments = data.upcomingAppointments;
      this.isLoading = false;
      this.loadingService.hide();
    });
  }

  getActivityIcon(type: string): string {
    switch (type) {
      case 'appointment':
        return '📅';
      case 'registration':
        return '👤';
      default:
        return '📋';
    }
  }

  getStatusBadgeClass(status: string): string {
    // التعامل مع القيم الفارغة أو null
    if (!status) {
      return 'bg-yellow-100 text-yellow-800';
    }
    
    const statusLower = status.toLowerCase();
    switch (statusLower) {
      case 'confirmed':
      case 'مؤكد':
        return 'bg-green-100 text-green-800';
      case 'scheduled':
      case 'مجدول':
        return 'bg-blue-100 text-blue-800';
      case 'waiting':
      case 'pending':
      case 'في الانتظار':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
      case 'ملغي':
        return 'bg-red-100 text-red-800';
      default:
        console.log('فئة حالة ميعاد غير معروفة:', status);
        return 'bg-yellow-100 text-yellow-800';
    }
  }

  getStatusName(status: string): string {
    // التعامل مع القيم الفارغة أو null
    if (!status) {
      return 'في الانتظار';
    }
    
    const statusLower = status.toLowerCase();
    switch (statusLower) {
      case 'confirmed':
      case 'مؤكد':
        return 'مؤكد';
      case 'scheduled':
      case 'مجدول':
        return 'مجدول';
      case 'waiting':
      case 'pending':
      case 'في الانتظار':
        return 'في الانتظار';
      case 'cancelled':
      case 'ملغي':
        return 'ملغي';
      default:
        console.log('حالة ميعاد غير معروفة:', status);
        return 'في الانتظار';
    }
  }
}