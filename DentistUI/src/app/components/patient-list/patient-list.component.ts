import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { PatientService } from '../../services/patient.service';
import { Patient, UpdatePatientDto, PatientSearchRequestDto, PatientDetailDto } from '../../models/patient.model';
import { LoadingService } from '../../services/loading.service';
import { AppointmentService } from '../../services/appointment.service';
import { forkJoin, switchMap, map, of, catchError } from 'rxjs';
import { Router } from '@angular/router';

@Component({
  selector: 'app-patient-list',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl:'./patient-list.component.html',
  styleUrls: ['./patient-list.component.css']
})
export class PatientListComponent implements OnInit {
  patients: Patient[] = [];
  filteredPatients: Patient[] = [];
  searchTerm: string = '';
  statusFilter: string = 'all';
  currentPage: number = 1;
  patientsPerPage: number = 5;
  filteredAppointmentsByDate: any[] = [];
  appointmentsForSelectedDate: any[] = [];
  
  // إضافة خاصية مؤقتة لدعم اسم الخدمة القادمة في القالب
  appointmentServiceName?: string;
  // Popup modal properties
  showPatientModal: boolean = false;
  selectedPatient: PatientDetailDto | null = null;
  
  // Edit modal properties
  showEditModal: boolean = false;
  editingPatient: Patient | null = null;
  editForm: FormGroup;
  message: { text: string; type: 'success' | 'error' } = { text: '', type: 'success' };
  today: string = new Date().toISOString().split('T')[0];

  // Appointment modal properties
  showAppointmentModal: boolean = false;
  appointmentPatient: Patient | null = null;
  appointmentForm: FormGroup;
  appointmentMessage: { text: string; type: 'success' | 'error' } = { text: '', type: 'success' };
  dateFilter: string = '';

  // --- Appointment Edit Modal State ---
  selectedAppointmentId: number | null = null;
  selectedAppointment: any = null;
  appointmentsForPatient: any[] = [];
  appointmentEditForm: FormGroup;
  availableServices: any[] = [];

  // Map status values to Arabic
  statusNameMap: { [key: string]: string } = {
    'Pending': 'مجدول',
    'Done': 'مكتمل',
    'Missed': 'فات',
    'Cancelled': 'ملغي',
    'scheduled': 'مجدول',
    'confirmed': 'مؤكد',
    'waiting': 'في الانتظار',
    'cancelled': 'ملغي',
    'completed': 'مكتمل'
  };

  // 1. Add new properties for services, availableSlots, selectedSlot, and update appointmentForm
  services: any[] = [];
  availableSlots: string[] = [];
  selectedSlot: string = '';

  constructor(
    private patientService: PatientService,
    private fb: FormBuilder,
    private loadingService: LoadingService,
    private appointmentService: AppointmentService,
    private router: Router
  ) {
    this.editForm = this.fb.group({
      firstName: ['', [Validators.required, Validators.minLength(2)]],
      middleName: [''],
      lastName: ['', [Validators.required, Validators.minLength(2)]],
      age: ['', [Validators.required, Validators.min(0), Validators.max(120)]],
      gender: ['male'],
      phoneNumber: ['', [Validators.required, Validators.pattern(/^[0-9+\-\s()]+$/)]],
      city: ['', [Validators.required, Validators.minLength(2)]],
      street: [''],
      doctorNotes: ['']
    });

    this.appointmentForm = this.fb.group({
      patientId: ['', [Validators.required]],
      serviceIds: [[], [Validators.required]],
      appointmentDate: ['', [Validators.required]],
      slot: [{ value: '', disabled: true }, [Validators.required]]
    });

    this.appointmentEditForm = this.fb.group({
      appointmentDateTime: ['', Validators.required],
      status: ['', Validators.required],
      serviceIds: [[], Validators.required]
    });
  }

  ngOnInit(): void {
    this.loadPatients();
    this.appointmentService.getServices().subscribe(services => {
      this.services = services;
    });
  }

  loadPatients(): void {
    this.loadingService.show();
    this.patientService.getAll().subscribe({
      next: (patients) => {
        // For each patient, fetch their appointments and medical history
        const patientDataPromises = patients.map(patient => {
          return forkJoin({
            patient: of(patient),
            appointments: this.patientService.getPatientAppointments(patient.id).pipe(
              catchError(() => of([])) // Return empty array if error
            ),
            medicalHistory: this.patientService.getPatientMedicalHistory(patient.id).pipe(
              catchError(() => of(null)) // Return null if error
            )
          }).pipe(
            map(result => ({
              ...result.patient,
              appointments: result.appointments,
              medicalHistory: result.medicalHistory,
              // Extract next appointment and last visit from appointments
              nextAppointment: this.getNextAppointment(result.appointments),
              lastVisit: this.getLastVisit(result.appointments),
              appointmentServiceName: this.getNextAppointmentServiceName(result.appointments),
              status: this.getNextAppointmentStatus(result.appointments)
            }))
          );
        });

        // Wait for all patient data to be loaded
        forkJoin(patientDataPromises).subscribe({
          next: (enrichedPatients) => {
            this.patients = enrichedPatients;
            this.filterPatients();
            this.loadingService.hide();
          },
          error: (error) => {
            console.error('Error loading patient data:', error);
            this.patients = patients; // Fallback to basic patient data
            this.filterPatients();
            this.loadingService.hide();
          }
        });
      },
      error: () => {
        this.patients = [];
        this.filterPatients();
        this.loadingService.hide();
      }
    });
  }

  filterPatients(): void {
  this.filteredPatients = this.patients.filter(patient => {
    const matchesSearch = 
      patient.fullName.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
      patient.phoneNumber?.toLowerCase().includes(this.searchTerm.toLowerCase());
      
    const statusArabic = this.getStatusName(patient.status || '');
    const matchesStatus = this.statusFilter === 'all' || statusArabic === this.statusFilter;
    const matchesDate = !this.dateFilter || (patient.nextAppointment && patient.nextAppointment.startsWith(this.dateFilter));
    
    return matchesSearch && matchesStatus && matchesDate;
  });
  this.currentPage = 1;
}

  get currentPatients(): Patient[] {
    const startIndex = (this.currentPage - 1) * this.patientsPerPage;
    const endIndex = startIndex + this.patientsPerPage;
    return this.filteredPatients.slice(startIndex, endIndex);
  }

  get totalPages(): number {
    return Math.ceil(this.filteredPatients.length / this.patientsPerPage);
  }

  get pages(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

  onPageChange(page: number): void {
    this.currentPage = page;
  }

  onSearchChange(): void {
    this.filterPatients();
  }

  onStatusFilterChange(): void {
    this.filterPatients();
  }

  onDateFilterChange(): void {
    this.filterPatients();
  }

  handleViewPatient(id: number): void {
    this.loadingService.show();
    
    // Combine all three API calls in parallel
    forkJoin({
      patient: this.patientService.getById(id),
      appointments: this.patientService.getPatientAppointments(id),
      medicalHistory: this.patientService.getPatientMedicalHistory(id)
    }).subscribe({
      next: (result) => {
        console.log('Patient data received:', result.patient);
        console.log('Appointments received:', result.appointments);
        console.log('Medical history received:', result.medicalHistory);
        
        // Combine all the data
        this.selectedPatient = { 
          ...result.patient, 
          appointments: result.appointments,
          medicalHistory: result.medicalHistory 
        };
        this.showPatientModal = true;
        this.loadingService.hide();
      },
      error: (error) => {
        console.error('Error fetching patient data:', error);
        this.loadingService.hide();
        // يمكن إضافة رسالة خطأ هنا
      }
    });
  }

  // Example 1: Sequential API calls (one after another)
  handleViewPatientWithAppointments(id: number): void {
    this.loadingService.show();
    
    // First call - get patient details
    this.patientService.getById(id).subscribe({
      next: (patient) => {
        console.log('Patient data received:', patient);
        
        // Second call - get patient appointments
        this.patientService.getPatientAppointments(id).subscribe({
          next: (appointments) => {
            console.log('Appointments received:', appointments);
            // Combine the data
            this.selectedPatient = { ...patient, appointments };
            this.showPatientModal = true;
            this.loadingService.hide();
          },
          error: (error) => {
            console.error('Error fetching appointments:', error);
            // Still show patient data without appointments
            this.selectedPatient = patient;
            this.showPatientModal = true;
            this.loadingService.hide();
          }
        });
      },
      error: (error) => {
        console.error('Error fetching patient:', error);
        this.loadingService.hide();
      }
    });
  }

  // Example 2: Parallel API calls using forkJoin
  handleViewPatientWithAllData(id: number): void {
    this.loadingService.show();
    
    // Make both API calls in parallel
    forkJoin({
      patient: this.patientService.getById(id),
      appointments: this.patientService.getPatientAppointments(id),
      medicalHistory: this.patientService.getPatientMedicalHistory(id)
    }).subscribe({
      next: (result) => {
        console.log('All data received:', result);
        // Combine all the data
        this.selectedPatient = { 
          ...result.patient, 
          appointments: result.appointments,
          medicalHistory: result.medicalHistory 
        };
        this.showPatientModal = true;
        this.loadingService.hide();
      },
      error: (error) => {
        console.error('Error fetching data:', error);
        this.loadingService.hide();
      }
    });
  }

  // Example 3: Using switchMap for sequential calls
  handleViewPatientWithSwitchMap(id: number): void {
    this.loadingService.show();
    
    this.patientService.getById(id).pipe(
      switchMap(patient => {
        console.log('Patient data received:', patient);
        // Get appointments after patient data
        return this.patientService.getPatientAppointments(id).pipe(
          map(appointments => ({ patient, appointments }))
        );
      })
    ).subscribe({
      next: (result) => {
        console.log('Patient and appointments:', result);
        this.selectedPatient = { ...result.patient, appointments: result.appointments };
        this.showPatientModal = true;
        this.loadingService.hide();
      },
      error: (error) => {
        console.error('Error:', error);
        this.loadingService.hide();
      }
    });
  }

  closePatientModal(): void {
    this.showPatientModal = false;
    this.selectedPatient = null;
  }

  handleEditPatient(id: number): void {
    this.loadingService.show();
    this.patientService.getById(id).subscribe({
      next: (patient) => {
        console.log('Patient data for editing:', patient);
        this.editingPatient = patient as any; // Cast to Patient type
        if (this.editingPatient) {
          this.populateEditForm(this.editingPatient);
          this.showEditModal = true;
        }
        this.loadingService.hide();
      },
      error: (error) => {
        console.error('Error fetching patient for editing:', error);
        this.loadingService.hide();
        this.message = { text: 'حدث خطأ أثناء تحميل بيانات المريض', type: 'error' };
      }
    });
  }

  closeEditModal(): void {
    this.showEditModal = false;
    this.editingPatient = null;
    this.message = { text: '', type: 'success' };
    this.editForm.reset();
  }

  populateEditForm(patient: Patient): void {
    // Parse fullName into separate name parts
    const nameParts = patient.fullName ? patient.fullName.split(' ') : ['', '', ''];
    const firstName = nameParts[0] || '';
    const middleName = nameParts.length > 2 ? nameParts.slice(1, -1).join(' ') : '';
    const lastName = nameParts.length > 1 ? nameParts[nameParts.length - 1] : '';

    this.editForm.patchValue({
      firstName: firstName,
      middleName: middleName,
      lastName: lastName,
      age: patient.age,
      gender: patient.gender,
      phoneNumber: patient.phoneNumber,
      city: patient.city || '',
      street: patient.street || '',
      doctorNotes: patient.doctorNotes || ''
    });
  }

  onEditSubmit(): void {
    if (this.editForm.valid && this.editingPatient) {
      const formData = this.editForm.value;
      
      const updateDto: UpdatePatientDto = {
        id: this.editingPatient.id,
        firstName: formData.firstName,
        middleName: formData.middleName || '',
        lastName: formData.lastName,
        age: parseInt(formData.age),
        gender: formData.gender,
        phoneNumber: formData.phoneNumber,
        city: formData.city,
        street: formData.street || '',
        doctorNotes: formData.doctorNotes || ''
      };
      
      this.loadingService.show();
      this.patientService.update(updateDto.id, updateDto).subscribe({
        next: () => {
          this.message = { text: 'تم تحديث بيانات المريض بنجاح', type: 'success' };
          this.loadPatients();
          setTimeout(() => {
            this.closeEditModal();
          }, 2000);
        },
        error: (error) => {
          console.error('Error updating patient:', error);
          this.message = { text: 'حدث خطأ أثناء تحديث بيانات المريض', type: 'error' };
          this.loadingService.hide();
        }
      });
    }
  }

  getEditFieldError(fieldName: string): string {
    const field = this.editForm.get(fieldName);
    if (field && field.invalid && (field.dirty || field.touched)) {
      if (field.errors?.['required']) {
        return 'هذا الحقل مطلوب';
      }
      if (field.errors?.['minlength']) {
        return `يجب أن يكون الطول على الأقل ${field.errors['minlength'].requiredLength} أحرف`;
      }
      if (field.errors?.['min']) {
        return `يجب أن تكون القيمة على الأقل ${field.errors['min'].min}`;
      }
      if (field.errors?.['max']) {
        return `يجب أن تكون القيمة على الأكثر ${field.errors['max'].max}`;
      }
      if (field.errors?.['pattern']) {
        return 'صيغة غير صحيحة';
      }
    }
    return '';
  }

  handleScheduleAppointment(id: number): void {
    this.appointmentPatient = this.patients.find(patient => patient.id === id) || null;
    this.showAppointmentModal = false;
    this.availableSlots = [];
    this.selectedSlot = '';
    if (this.appointmentPatient) {
      this.appointmentForm.reset();
      this.appointmentForm.patchValue({ patientId: this.appointmentPatient.id });
      this.showAppointmentModal = true;
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

  onSlotChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    this.selectedSlot = value;
  }

  onAppointmentSubmit(): void {
    if (this.appointmentForm.valid) {
      this.loadingService.show();
      const formData = this.appointmentForm.value;
      const appointmentDateTime = formData.slot;
      const dto = {
        patientId: formData.patientId,
        serviceIds: formData.serviceIds.map((id: string | number) => +id),
        appointmentDateTime
      };
      this.appointmentService.create(dto).subscribe({
        next: () => {
          this.appointmentMessage = { text: 'تم جدولة الموعد بنجاح!', type: 'success' };
          this.loadingService.hide();
          setTimeout(() => {
            this.closeAppointmentModal();
            this.appointmentMessage = { text: '', type: 'success' };
            this.loadPatients();
          }, 2000);
        },
        error: (err) => {
          if (err.status === 409) {
            this.appointmentMessage = { text: 'هذا الوقت محجوز بالفعل. يرجى اختيار وقت آخر.', type: 'error' };
          } else {
            this.appointmentMessage = { text: 'حدث خطأ أثناء جدولة الموعد.', type: 'error' };
          }
          this.loadingService.hide();
        }
      });
    } else {
      this.appointmentMessage = { text: 'يرجى ملء جميع الحقول المطلوبة', type: 'error' };
    }
  }

  onAppointmentEditSubmit(): void {
    if (this.appointmentEditForm.valid && this.selectedAppointment) {
      this.loadingService.show();
      const formData = this.appointmentEditForm.value;
      // Convert datetime-local to ISO string
      const isoDateTime = formData.appointmentDateTime ? new Date(formData.appointmentDateTime).toISOString() : '';
      const updateDto = {
        id: this.selectedAppointment.id,
        appointmentDateTime: isoDateTime,
        status: formData.status,
        serviceIds: formData.serviceIds
      };
      this.appointmentService.update(this.selectedAppointment.id, updateDto).subscribe({
        next: () => {
          this.appointmentMessage = { text: 'تم تحديث الموعد بنجاح!', type: 'success' };
          this.loadingService.hide();
          setTimeout(() => {
            this.closeAppointmentModal();
            this.appointmentMessage = { text: '', type: 'success' };
            this.loadPatients();
          }, 2000);
        },
        error: () => {
          this.appointmentMessage = { text: 'حدث خطأ أثناء تحديث الموعد. حاول مرة أخرى.', type: 'error' };
          this.loadingService.hide();
        }
      });
    } else {
      this.appointmentMessage = { text: 'يرجى ملء جميع الحقول المطلوبة', type: 'error' };
    }
  }

  getAppointmentFieldError(fieldName: string): string {
    const field = this.appointmentForm.get(fieldName);
    if (field && field.invalid && (field.dirty || field.touched)) {
      if (field.errors?.['required']) {
        return 'هذا الحقل مطلوب';
      }
      if (field.errors?.['pattern']) {
        return 'صيغة غير صحيحة';
      }
    }
    return '';
  }

  handleDeletePatient(id: number): void {
    if (confirm('هل أنت متأكد من حذف هذا المريض؟')) {
      this.loadingService.show();
      this.patientService.delete(id).subscribe({
        next: () => {
          this.loadPatients();
        },
        error: () => {
          this.loadingService.hide();
        }
      });
    }
  }

  getStatusBadgeClass(status: string): string {
    const statusStyles: { [key: string]: string } = {
      scheduled: "bg-blue-100 text-blue-800",
      confirmed: "bg-green-100 text-green-800",
      waiting: "bg-yellow-100 text-yellow-800",
      cancelled: "bg-red-100 text-red-800",
      completed: "bg-gray-100 text-gray-800"
    };
    return statusStyles[status] || "bg-gray-100 text-gray-800";
  }

  getStatusName(status: string): string {
    return this.statusNameMap[status] || status;
  }

  min(a: number, b: number): number {
    return Math.min(a, b);
  }

  formatDate(dateString: string): string {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB'); // Gregorian calendar format
  }

  formatDateFromDto(dateString: string | undefined): string {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB'); // Gregorian calendar format
  }

  formatTime(dateTimeString: string): string {
    if (!dateTimeString) return '';
    const date = new Date(dateTimeString);
    return date.toLocaleTimeString('ar-SA', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    });
  }

  getFirstAvailableDate(patient: Patient): string {
    return patient.appointmentDate || patient.nextAppointment || '';
  }

  private combineDateAndTime(date: string, time: string): string {
    if (!date || !time) return '';
    const dateTimeString = `${date}T${time}`;
    const dateObj = new Date(dateTimeString);
    if (isNaN(dateObj.getTime())) return '';
    return dateObj.toISOString();
  }

  // Helper methods to extract appointment data
  private getNextAppointment(appointments: any[]): string {
    if (!appointments || appointments.length === 0) return '';
    const now = new Date();
    const futureAppointments = appointments
      .filter(apt => new Date(apt.appointmentDateTime) > now)
      .sort((a, b) => new Date(a.appointmentDateTime).getTime() - new Date(b.appointmentDateTime).getTime());
    return futureAppointments.length > 0 ? futureAppointments[0].appointmentDateTime : '';
  }

  private getNextAppointmentServiceName(appointments: any[]): string {
    if (!appointments || appointments.length === 0) return '-';
    const futureAppointments = appointments
      .filter(apt => new Date(apt.appointmentDateTime) > new Date())
      .sort((a, b) => new Date(a.appointmentDateTime).getTime() - new Date(b.appointmentDateTime).getTime());
    if (futureAppointments.length > 0) {
      const nextApt = futureAppointments[0];
      if (nextApt.serviceNames && Array.isArray(nextApt.serviceNames) && nextApt.serviceNames.length > 0) {
        return nextApt.serviceNames[0];
      }
    }
    return '-';
  }

  private getLastVisit(appointments: any[]): string {
    if (!appointments || appointments.length === 0) return '';
    const now = new Date();
    // If there is no future appointment, lastVisit is the most recent appointment (even if it was just now)
    // If there is a future appointment, lastVisit is the most recent past appointment
    const pastAppointments = appointments
      .filter(apt => new Date(apt.appointmentDateTime) <= now)
      .sort((a, b) => new Date(b.appointmentDateTime).getTime() - new Date(a.appointmentDateTime).getTime());
    return pastAppointments.length > 0 ? pastAppointments[0].appointmentDateTime : '';
  }

  private getNextAppointmentType(appointments: any[]): string {
    if (!appointments || appointments.length === 0) return '';
    
    const futureAppointments = appointments
      .filter(apt => new Date(apt.appointmentDateTime) > new Date())
      .sort((a, b) => new Date(a.appointmentDateTime).getTime() - new Date(b.appointmentDateTime).getTime());
    
    return futureAppointments.length > 0 ? futureAppointments[0].appointmentType : '';
  }

  private getNextAppointmentStatus(appointments: any[]): string {
    if (!appointments || appointments.length === 0) return '';
    
    const futureAppointments = appointments
      .filter(apt => new Date(apt.appointmentDateTime) > new Date())
      .sort((a, b) => new Date(a.appointmentDateTime).getTime() - new Date(b.appointmentDateTime).getTime());
    
    return futureAppointments.length > 0 ? futureAppointments[0].status : '';
  }

  getAppointmentForPatientOnDate(patientId: number, date: string): any | null {
    if (!this.appointmentsForSelectedDate || !date) return null;
    return this.appointmentsForSelectedDate.find(
      (appt: any) => appt.patientId === patientId
    ) || null;
  }

  getGenderArabic(gender: string): string {
    if (!gender) return 'غير محدد';
    const g = gender.toLowerCase();
    if (g === 'male') return 'ذكر';
    if (g === 'female') return 'أنثى';
    return 'غير محدد';
  }

  goToRegistration(): void {
    this.router.navigate(['/register']);
  }

  closeAppointmentModal(): void {
    this.showAppointmentModal = false;
    this.appointmentPatient = null;
    this.appointmentForm.reset();
    this.appointmentMessage = { text: '', type: 'success' };
  }
}