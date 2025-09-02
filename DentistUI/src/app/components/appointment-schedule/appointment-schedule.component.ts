import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { PatientService } from '../../services/patient.service';
import { Patient } from '../../models/patient.model';
import { LoadingService } from '../../services/loading.service';
import { AppointmentService } from '../../services/appointment.service';
import { AppointmentDto, CreateAppointmentDto, UpdateAppointmentDto } from '../../models/appointment.model';
import { DentalService } from '../../models/dental-service.model';

@Component({
  selector: 'app-appointment-schedule',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './appointment-schedule.component.html',
  styleUrls: ['./appointment-schedule.component.css']
})
export class AppointmentScheduleComponent implements OnInit {
  appointmentForm: FormGroup;
  patients: Patient[] = [];
  selectedDate: string = '';
  message: { text: string; type: 'success' | 'error' } = { text: '', type: 'success' };
  editMessage: { text: string; type: 'success' | 'error' } = { text: '', type: 'success' };
  today = new Date().toISOString().split('T')[0];

  // Searchable dropdown properties
  patientSearchTerm: string = '';
  selectedPatient: Patient | null = null;
  filteredPatients: Patient[] = [];
  showPatientDropdown: boolean = false;

  services: DentalService[] = [];
  availableSlots: string[] = [];
  selectedSlot: string = '';

  // --- Appointments List State ---
  appointments: AppointmentDto[] = [];
  filteredAppointments: AppointmentDto[] = [];
  currentPage: number = 1;
  appointmentsPerPage: number = 5;
  pages: number[] = [];
  totalPages: number = 1;
  searchTerm: string = '';
  showAppointmentModal: boolean = false;
  selectedAppointment: AppointmentDto | null = null;
  showEditModal: boolean = false;
  editForm: FormGroup;
  filterDate: string = '';
  filterStatus: string = '';

  // Remove all appointment table, filtering, edit/delete, stats, and reminders logic.
  // Only keep the appointment creation form and patient selection logic.

  constructor(
    private fb: FormBuilder,
    private patientService: PatientService,
    private loadingService: LoadingService,
    private appointmentService: AppointmentService
  ) {
    this.appointmentForm = this.fb.group({
      patientId: ['', [Validators.required]],
      appointmentDate: ['', [Validators.required]],
      serviceIds: [[], [Validators.required]],
      slot: [{ value: '', disabled: true }, [Validators.required]]
    });
    this.editForm = this.fb.group({
      appointmentDateTime: ['', Validators.required],
      status: ['', Validators.required],
      serviceIds: [[], Validators.required]
    });
  }

  ngOnInit(): void {
    console.log('Loading patients in appointment-schedule...');
    this.patientService.getAll().subscribe({
      next: (patients) => {
        console.log('Patients loaded successfully:', patients);
        this.patients = patients;
        this.filteredPatients = patients;
        console.log('filteredPatients initialized:', this.filteredPatients);
      },
      error: (error) => {
        console.error('Error loading patients:', error);
      }
    });
    this.appointmentService.getServices().subscribe(services => {
      this.services = services;
    });
    this.loadAppointments();
  }

loadAppointments(): void {
  this.appointmentService.getAll().subscribe(appointments => {
    this.appointments = appointments;
    this.applyFilters(); // ← استخدم applyFilters بدلاً من التصفية اليدوية
  });
}


  setupPagination(): void {
    this.totalPages = Math.ceil(this.filteredAppointments.length / this.appointmentsPerPage) || 1;
    this.pages = Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

  get currentAppointments(): AppointmentDto[] {
    const start = (this.currentPage - 1) * this.appointmentsPerPage;
    return this.filteredAppointments.slice(start, start + this.appointmentsPerPage);
  }

  onPageChange(page: number): void {
    this.currentPage = page;
  }

  onSearchChange(): void {
    this.applyFilters();
  }

  onDateFilterChange(): void {
    this.applyFilters();
  }

  onStatusFilterChange(): void {
    this.applyFilters();
  }

  applyFilters(): void {
  let filtered = this.appointments;

  // Filter by date if set
  if (this.filterDate) {
    filtered = filtered.filter(a => a.appointmentDateTime.startsWith(this.filterDate));
  }

  // Filter by status if set
  if (this.filterStatus) {
    filtered = filtered.filter(a => a.status === this.filterStatus);
  }

  // Filter by search term if set
  const term = this.searchTerm.trim().toLowerCase();
  if (term) {
    filtered = filtered.filter(a => a.patientFullName.toLowerCase().includes(term));
  }

  // ✅ Always keep only future appointments
  const now = new Date();
  filtered = filtered.filter(a => new Date(a.appointmentDateTime) > now);

  this.filteredAppointments = filtered;
  this.currentPage = 1;
  this.setupPagination();
}


  // Remove all appointment table, filtering, edit/delete, stats, and reminders logic.
  // Only keep the appointment creation form and patient selection logic.

  onPatientSearchChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    const searchTerm = target.value;
    this.patientSearchTerm = searchTerm;
    this.showPatientDropdown = true;
    
    // Clear selected patient if user starts typing again
    if (this.selectedPatient && searchTerm !== this.selectedPatient.fullName) {
      this.selectedPatient = null;
      this.appointmentForm.patchValue({ patientId: '' });
    }
    
    this.filterPatients();
  }

  filterPatients(): void {
    console.log('Filtering patients with term:', this.patientSearchTerm);
    console.log('Available patients:', this.patients);
    const term = this.patientSearchTerm.trim().toLowerCase();
    this.filteredPatients = this.patients.filter(patient =>
      patient.fullName.toLowerCase().includes(term) ||
      patient.phoneNumber.includes(term)
    );
    console.log('Filtered patients result:', this.filteredPatients);
  }

  toggleDropdown(): void {
    this.showPatientDropdown = !this.showPatientDropdown;
    if (this.showPatientDropdown) {
      this.filteredPatients = [...this.patients]; // reset list on open
      this.patientSearchTerm = '';
    }
  }

  selectPatient(patient: Patient): void {
    console.log('Selecting patient:', patient);
    this.selectedPatient = patient;
    this.patientSearchTerm = patient.fullName; // Show selected patient name in input
    this.appointmentForm.patchValue({ patientId: patient.id });
    this.showPatientDropdown = false;
    this.filteredPatients = this.patients; // Reset filtered list
  }

  clearPatientSelection(): void {
    this.selectedPatient = null;
    this.patientSearchTerm = '';
    this.appointmentForm.patchValue({ patientId: '' });
    this.showPatientDropdown = false;
    this.filteredPatients = this.patients;
  }

  onPatientInputBlur(): void {
    // Delay hiding dropdown to allow for clicks on dropdown items
    setTimeout(() => {
      this.showPatientDropdown = false;
    }, 200);
  }

  onPatientSearchInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.patientSearchTerm = target.value;
    this.filterPatients();
    
    if (!this.showPatientDropdown) {
      this.showPatientDropdown = true;
    }
  }

  onServiceChange(): void {
    this.fetchAvailableSlots();
  }

  onServiceCheckboxChange(serviceId: number, event: Event): void {
    const checkbox = event.target as HTMLInputElement;
    const currentServiceIds = this.appointmentForm.get('serviceIds')?.value || [];
    
    if (checkbox.checked) {
      // Add service ID if not already present
      if (!currentServiceIds.includes(serviceId)) {
        this.appointmentForm.patchValue({
          serviceIds: [...currentServiceIds, serviceId]
        });
      }
    } else {
      // Remove service ID
      this.appointmentForm.patchValue({
        serviceIds: currentServiceIds.filter((id: number) => id !== serviceId)
      });
    }
    
    this.fetchAvailableSlots();
  }

  onDateChange(): void {
    this.fetchAvailableSlots();
  }

  onSlotChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    this.selectedSlot = value;
  }

  fetchAvailableSlots(): void {
    const date = this.appointmentForm.value.appointmentDate;
    const serviceIds: number[] = this.appointmentForm.value.serviceIds;
    const slotControl = this.appointmentForm.get('slot');
    if (date && serviceIds.length) {
      const serviceIdsParam = serviceIds.join(',');
      this.appointmentService.getAvailableSlots(date, serviceIdsParam).subscribe(slots => {
        this.availableSlots = slots;
        if (slots.length) {
          slotControl?.enable();
        } else {
          slotControl?.disable();
        }
      });
    } else {
      this.availableSlots = [];
      slotControl?.disable();
    }
    this.appointmentForm.patchValue({ slot: '' });
  }

  onSubmit(): void {
    if (this.appointmentForm.valid) {
      this.loadingService.showLoading();
      const formData = this.appointmentForm.value;
      // Use slot directly as appointmentDateTime since it's already a full datetime string
      const appointmentDateTime = formData.slot;
      const dto: CreateAppointmentDto = {
        patientId: formData.patientId,
        serviceIds: formData.serviceIds.map((id: string | number) => +id), // ensure IDs are numbers
        appointmentDateTime
      };
      console.log('Appointment DTO:', dto); // Debug: log the payload before sending
      this.appointmentService.create(dto).subscribe({
        next: () => {
          this.message = { text: 'تم جدولة الموعد بنجاح!', type: 'success' };
          this.resetForm();
          this.loadingService.hideLoading();
          this.loadAppointments(); // Reload appointments after creating one
        },
        error: (err) => {
          if (err.status === 409) {
            this.message = { text: 'هذا الوقت محجوز بالفعل. يرجى اختيار وقت آخر.', type: 'error' };
          } else {
            this.message = { text: 'حدث خطأ أثناء جدولة الموعد.', type: 'error' };
          }
          this.loadingService.hideLoading();
        }
      });
    } else {
      this.message = { text: 'يرجى ملء جميع الحقول المطلوبة', type: 'error' };
    }
  }

  // --- CRUD Actions ---
  handleViewAppointment(appointment: AppointmentDto): void {
    this.selectedAppointment = appointment;
    this.showAppointmentModal = true;
  }

  closeAppointmentModal(): void {
    this.showAppointmentModal = false;
    this.selectedAppointment = null;
  }

  handleEditAppointment(appointment: AppointmentDto): void {
    this.selectedAppointment = appointment;
    this.showEditModal = true;
    // Map serviceNames to IDs using the services list
    const selectedServiceIds = this.services
      .filter(s => appointment.serviceNames.includes(s.name))
      .map(s => s.id);
    this.editForm.patchValue({
      appointmentDateTime: appointment.appointmentDateTime,
      status: appointment.status,
      serviceIds: selectedServiceIds
    });
  }

  closeEditModal(): void {
    this.showEditModal = false;
    this.selectedAppointment = null;
  }

  handleDeleteAppointment(id: number): void {
    if (confirm('هل أنت متأكد من حذف هذا الموعد؟')) {
      this.appointmentService.delete(id).subscribe(() => {
        this.loadAppointments();
      });
    }
  }

  // Remove all appointment table, filtering, edit/delete, stats, and reminders logic.
  // Only keep the appointment creation form and patient selection logic.

  resetForm() {
    this.appointmentForm.reset();
    this.selectedPatient = null;
    this.patientSearchTerm = '';
  }

  getFieldError(fieldName: string): string {
    const field = this.appointmentForm.get(fieldName);
    if (field?.errors && field.touched) {
      if (field.errors['required']) {
        return 'هذا الحقل مطلوب';
      }
    }
    return '';
  }

  min(a: number, b: number): number {
    return Math.min(a, b);
  }

  onEditSubmit(): void {
    if (this.editForm.valid && this.selectedAppointment) {
      const formValue = this.editForm.value;
      const updated = {
        id: this.selectedAppointment.id,
        appointmentDateTime: formValue.appointmentDateTime,
        status: formValue.status,
        serviceIds: formValue.serviceIds.map((id: string | number) => +id)
      };
      this.appointmentService.update(this.selectedAppointment.id, updated).subscribe({
        next: () => {
          this.editMessage = { text: 'تم تحديث الموعد بنجاح', type: 'success' };
          this.loadAppointments();
          setTimeout(() => {
            this.closeEditModal();
            this.editMessage = { text: '', type: 'success' };
          }, 1000);
        },
        error: () => {
          this.editMessage = { text: 'حدث خطأ أثناء تحديث الموعد', type: 'error' };
        }
      });
    }
  }

  // Map status to Arabic for display and badge
  getArabicStatus(status: string): string {
    switch (status) {
      case 'Pending': return 'مجدول';
      case 'Done': return 'مكتمل';
      case 'Missed': return 'فات';
      case 'Cancelled': return 'ملغي';
      case 'مجدول':
      case 'مكتمل':
      case 'فات':
      case 'ملغي':
        return status;
      default: return status;
    }
  }

  isServiceSelected(serviceId: number): boolean {
    const serviceIds = this.editForm.get('serviceIds')?.value || [];
    return serviceIds.includes(serviceId);
  }

  onEditServiceCheckboxChange(serviceId: number, event: Event): void {
    const checkbox = event.target as HTMLInputElement;
    const currentServiceIds = this.editForm.get('serviceIds')?.value || [];
    
    if (checkbox.checked) {
      // Add service ID if not already present
      if (!currentServiceIds.includes(serviceId)) {
        this.editForm.patchValue({
          serviceIds: [...currentServiceIds, serviceId]
        });
      }
    } else {
      // Remove service ID
      this.editForm.patchValue({
        serviceIds: currentServiceIds.filter((id: number) => id !== serviceId)
      });
    }
  }
}