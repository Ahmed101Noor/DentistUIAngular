import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { DentalServiceService } from '../../services/dental-service.service';
import { DentalService } from '../../models/dental-service.model';
import { LoadingService } from '../../services/loading.service';

@Component({
  selector: 'app-clinic-management',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './clinic-management.component.html',
  styleUrl: './clinic-management.component.css'
})
export class ClinicManagementComponent implements OnInit {
  // Tab management
  activeTab = 'services';
  
  // Data properties
  services: DentalService[] = [];
  
  // Form properties
  serviceForm: FormGroup;
  isEditMode = false;
  selectedServiceId: number | null = null;
  
  // UI states
  isLoading = false;
  showServiceModal = false;
  errorMessage = '';
  successMessage = '';

  constructor(
    private fb: FormBuilder,
    private dentalServiceService: DentalServiceService,
    private loadingService: LoadingService
  ) {
    this.serviceForm = this.fb.group({
      name: ['', [Validators.required, Validators.maxLength(100)]],
      description: ['', Validators.maxLength(500)],
      defaultPrice: [null],
      durationInMinutes: [30, [Validators.required, Validators.min(1)]]
    });
  }

  ngOnInit(): void {
    this.loadServices();
  }

  loadServices(): void {
    this.isLoading = true;
    this.loadingService.show();
    
    this.dentalServiceService.getAll().subscribe({
      next: (services) => {
        this.services = services;
        this.isLoading = false;
        this.loadingService.hide();
      },
      error: (error) => {
        console.error('Error loading services:', error);
        this.errorMessage = 'حدث خطأ أثناء تحميل الخدمات';
        this.isLoading = false;
        this.loadingService.hide();
      }
    });
  }

  openAddServiceModal(): void {
    this.isEditMode = false;
    this.selectedServiceId = null;
    this.serviceForm.reset({
      durationInMinutes: 30
    });
    this.showServiceModal = true;
  }

  openEditServiceModal(service: DentalService): void {
    this.isEditMode = true;
    this.selectedServiceId = service.id;
    this.serviceForm.patchValue({
      name: service.name,
      description: service.description || '',
      defaultPrice: service.defaultPrice || null,
      durationInMinutes: service.durationInMinutes
    });
    this.showServiceModal = true;
  }

  closeServiceModal(): void {
    this.showServiceModal = false;
    this.errorMessage = '';
  }

  saveService(): void {
    if (this.serviceForm.invalid) {
      this.serviceForm.markAllAsTouched();
      return;
    }

    const serviceData = this.serviceForm.value;
    this.isLoading = true;
    this.loadingService.show();

    if (this.isEditMode && this.selectedServiceId) {
      // Update existing service
      this.dentalServiceService.update(this.selectedServiceId, serviceData).subscribe({
        next: () => {
          this.successMessage = 'تم تحديث الخدمة بنجاح';
          this.loadServices();
          this.closeServiceModal();
        },
        error: (error) => {
          console.error('Error updating service:', error);
          this.errorMessage = 'حدث خطأ أثناء تحديث الخدمة';
          this.isLoading = false;
          this.loadingService.hide();
        }
      });
    } else {
      // Create new service
      this.dentalServiceService.create(serviceData).subscribe({
        next: () => {
          this.successMessage = 'تم إضافة الخدمة بنجاح';
          this.loadServices();
          this.closeServiceModal();
        },
        error: (error) => {
          console.error('Error creating service:', error);
          this.errorMessage = 'حدث خطأ أثناء إضافة الخدمة';
          this.isLoading = false;
          this.loadingService.hide();
        }
      });
    }
  }

  deleteService(id: number): void {
    if (confirm('هل أنت متأكد من حذف هذه الخدمة؟')) {
      this.isLoading = true;
      this.loadingService.show();
      
      this.dentalServiceService.delete(id).subscribe({
        next: () => {
          this.successMessage = 'تم حذف الخدمة بنجاح';
          this.loadServices();
        },
        error: (error) => {
          console.error('Error deleting service:', error);
          this.errorMessage = 'حدث خطأ أثناء حذف الخدمة';
          this.isLoading = false;
          this.loadingService.hide();
        }
      });
    }
  }

  // Helper methods for form validation
  get nameControl() { return this.serviceForm.get('name'); }
  get descriptionControl() { return this.serviceForm.get('description'); }
  get defaultPriceControl() { return this.serviceForm.get('defaultPrice'); }
  get durationInMinutesControl() { return this.serviceForm.get('durationInMinutes'); }
}