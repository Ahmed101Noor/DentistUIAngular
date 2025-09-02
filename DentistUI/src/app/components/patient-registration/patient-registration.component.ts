import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { PatientService } from '../../services/patient.service';
import { RegisterPatientDto } from '../../models/patient.model';
import { LoadingService } from '../../services/loading.service';
import { MedicalHistoryService } from '../../services/medical-history.service';
import { AppointmentService } from '../../services/appointment.service';
import { ToastService } from '../../services/toast.service';
import { DentalService } from '../../models/dental-service.model';

@Component({
  selector: 'app-patient-registration',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './patient-registration.component.html',
  styleUrls: ['./patient-registration.component.css']
})
export class PatientRegistrationComponent implements OnInit {
  patientForm: FormGroup;
  today = new Date().toISOString().split('T')[0];
  services: DentalService[] = [];
  availableSlots: string[] = [];
  selectedSlot: string = '';

  private readonly ageValidators = [Validators.required, Validators.min(0), Validators.max(120)];

  private readonly defaultValues = {
    gender: 'male',
    infectiousHepatitis: false,
    allergies: false,
    asthma: false,
    diabetes: false,
    radiationTherapy: false,
    epilepsy: false,
    hivPositive: false,
    anemia: false,
    heartDisease: false,
    hypertension: false,
    hypotension: false,
    hemophilia: false,
    kidneyDisease: false,
    liverDisease: false,
    pepticUlcer: false,
    serviceIds: [],
    slot: ''
  };

  constructor(
    private fb: FormBuilder,
    private patientService: PatientService,
    private loadingService: LoadingService,
    private medicalHistoryService: MedicalHistoryService,
    private appointmentService: AppointmentService,
    private toastService: ToastService
  ) {
    this.patientForm = this.fb.group({
      firstName: ['', Validators.required],
      middleName: [''],
      lastName: ['', Validators.required],
      age: ['', this.ageValidators],
      gender: ['', Validators.required],
      phoneNumber: ['', Validators.required],
      city: ['', Validators.required],
      street: [''],
      doctorNotes: [''],
      // Medical history
      infectiousHepatitis: [false],
      allergies: [false],
      asthma: [false],
      diabetes: [false],
      radiationTherapy: [false],
      epilepsy: [false],
      hivPositive: [false],
      anemia: [false],
      heartDisease: [false],
      hypertension: [false],
      hypotension: [false],
      hemophilia: [false],
      kidneyDisease: [false],
      liverDisease: [false],
      pepticUlcer: [false],
      // Appointment
      appointmentDate: ['', Validators.required],
      serviceIds: [[], Validators.required],
      slot: [{ value: '', disabled: true }, Validators.required]
    });
  }

  ngOnInit(): void {
    this.appointmentService.getServices().subscribe(services => {
      this.services = services;
    });
  }

  onServiceChange(): void {
    this.fetchAvailableSlots();
  }

  onServiceCheckboxChange(serviceId: number, event: Event): void {
    const checkbox = event.target as HTMLInputElement;
    const currentServiceIds = this.patientForm.get('serviceIds')?.value || [];
    
    if (checkbox.checked) {
      // Add service if not already selected
      if (!currentServiceIds.includes(serviceId)) {
        const updatedServiceIds = [...currentServiceIds, serviceId];
        this.patientForm.patchValue({ serviceIds: updatedServiceIds });
      }
    } else {
      // Remove service if unchecked
      const updatedServiceIds = currentServiceIds.filter((id: number) => id !== serviceId);
      this.patientForm.patchValue({ serviceIds: updatedServiceIds });
    }
    
    this.fetchAvailableSlots();
  }

  onDateChange(): void {
    this.fetchAvailableSlots();
  }

  onSlotChange(event: Event): void {
    this.selectedSlot = (event.target as HTMLSelectElement).value;
  }

  fetchAvailableSlots(): void {
    const { appointmentDate: date, serviceIds } = this.patientForm.value;
    const slotControl = this.patientForm.get('slot');

    if (date && serviceIds?.length) {
      const serviceIdsParam = serviceIds.join(',');
      this.appointmentService.getAvailableSlots(date, serviceIdsParam).subscribe(slots => {
        this.availableSlots = slots;
        slotControl?.[slots.length ? 'enable' : 'disable']();
      });
    } else {
      this.availableSlots = [];
      slotControl?.disable();
    }

    this.patientForm.patchValue({ slot: '' });
  }

 onSubmit(): void {
  if (this.patientForm.invalid) {
    this.patientForm.markAllAsTouched();
    this.toastService.show('يرجى ملء جميع الحقول المطلوبة', 'error');
    return;
  }

  const formData = this.patientForm.value;

  if (!formData.appointmentDate || !formData.slot) {
    this.toastService.show('يرجى اختيار تاريخ ووقت الموعد', 'error');
    return;
  }

  this.loadingService.show();

  const dto: RegisterPatientDto = {
    firstName: formData.firstName,
    middleName: formData.middleName || '',
    lastName: formData.lastName,
    age: formData.age,
    gender: formData.gender,
    phoneNumber: formData.phoneNumber,
    street: formData.street || '',
    city: formData.city,
    doctorNotes: formData.doctorNotes || '',
    infectiousHepatitis: formData.infectiousHepatitis,
    allergies: formData.allergies,
    asthma: formData.asthma,
    diabetes: formData.diabetes,
    radiationTherapy: formData.radiationTherapy,
    epilepsy: formData.epilepsy,
    hivPositive: formData.hivPositive,
    anemia: formData.anemia,
    heartDisease: formData.heartDisease,
    hypertension: formData.hypertension,
    hypotension: formData.hypotension,
    hemophilia: formData.hemophilia,
    kidneyDisease: formData.kidneyDisease,
    liverDisease: formData.liverDisease,
    pepticUlcer: formData.pepticUlcer,
    appointmentDateTime: formData.slot,
    serviceIds: formData.serviceIds || []
  };

  this.patientService.registerPatient(dto).subscribe({
    next: () => {
      this.toastService.show('تم تسجيل المريض بنجاح!', 'success');
      this.patientForm.reset(this.defaultValues);
      this.loadingService.hide();
    },
    error: () => {
      this.toastService.show('حدث خطأ أثناء التسجيل. حاول مرة أخرى.', 'error');
      this.loadingService.hide();
    }
  });
}

  getFieldError(fieldName: string): string {
    const field = this.patientForm.get(fieldName);
    if (!field || !field.touched || !field.errors) return '';

    if (field.errors['required']) return 'هذا الحقل مطلوب';
    if (field.errors['min'] || field.errors['max']) return 'العمر يجب أن يكون بين 0 و 120';

    return '';
  }

  private combineDateAndTime(date: string, time: string): string {
    if (!date || !time) return '';
    const dateTimeString = `${date}T${time}`;
    const dateObj = new Date(dateTimeString);
    return isNaN(dateObj.getTime()) ? '' : dateObj.toISOString();
  }
}
