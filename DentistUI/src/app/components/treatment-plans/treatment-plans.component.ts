import { Component, OnInit, OnDestroy, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { LoadingService } from '../../services/loading.service';
import { TreatmentPlanService } from '../../services/treatment-plan.service';
import { PatientService } from '../../services/patient.service';
import { TreatmentPlanDto, CreateTreatmentPlanDto, UpdateTreatmentPlanDto, TreatmentImageDto, CreateTreatmentImageDto, UpdateTreatmentImageDto, AttachmentDto, CreateAttachmentDto, UpdateAttachmentDto, TreatmentPlanRequest, TreatmentPlanSearchRequestDto } from '../../models/treatment-plan.model';
import { Patient } from '../../models/patient.model';
import { Subscription } from 'rxjs';
import { ToastService } from '../../services/toast.service';
import { TreatmentImageService } from '../../services/treatment-image.service';
import { AttachmentService } from '../../services/attachment.service';
import { ChangeDetectorRef } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { MedicalQuestionDto, CreateMedicalQuestionDto, UpdateMedicalQuestionDto } from '../../models/medical-question.model';
import { MedicalQuestionService } from '../../services/medical-question.service';
import { TeethDto, UpdateToothStatusDto, TeethStatus, getTeethStatusOptions, getTeethStatusColor, getTeethStatusLabel, convertStringToTeethStatus } from '../../models/teeth.model';
import { TeethService } from '../../services/teeth.service';

// Additional interfaces for the tabs
interface PatientImage {
  id: number;
  imageUrl: string;
  imageType: 'before' | 'after';
  uploadDate: string;
  description?: string;
}

interface ToothStatus {
  id: number;
  toothNumber: number; // Uses 1-32 numbering internally
  status: TeethStatus;
  notes?: string;
  lastUpdated?: Date;
}

@Component({
  selector: 'app-treatment-plans',
  standalone: true,
  
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './treatment-plans.component.html',
  styleUrls: ['./treatment-plans.component.css']
})
export class TreatmentPlansComponent implements OnInit, OnDestroy {
  // Image file properties
  beforeImageFile: File | null = null;
  afterImageFile: File | null = null;
  attachmentFile: File | null = null;
  attachmentFileName: string = '';
  beforeImagePreview: string | null = null;
  afterImagePreview: string | null = null;
  patients: Patient[] = [];
  // --- Patient Searchable Dropdown ---
  patientSearchTerm: string = '';
  filteredPatients: Patient[] = [];
  showPatientDropdown: boolean = false;
  
  // Remove all logic and properties related to treatment plan data, attachments, and images
  // Remove: treatmentPlans, beforeImages, afterImages, patientAttachments, and any related methods or state
  // Only keep logic for the tab structure, patient selection, teeth status, and non-treatment-plan features

  // --- Remove the following properties and methods ---
  // treatmentPlans: TreatmentPlan[]
  // beforeImages: ...
  // afterImages: ...
  // patientAttachments: ...
  // Any methods for loading, previewing, or manipulating these
  selectedPatientId: number | null = null;
  selectedPatient: Patient | null = null;
  showForm = false;
  editingPlanId: number | null = null;
  treatmentPlanForm: FormGroup;
  treatmentTypes: { value: string; label: string }[] = [];
  priorities: { value: string; label: string; color: string }[] = [];

  // --- Treatment Plan CRUD State ---
  treatmentPlans: TreatmentPlanDto[] = [];
  isEditMode = false;
  selectedPlan: TreatmentPlanDto | null = null;
  treatmentImages: TreatmentImageDto[] = [];
  attachments: AttachmentDto[] = [];
  
  // Add this line for selectedPlanId
  selectedPlanId: number | null = null;
  // Tab management
  activeTab = 'treatment-plans';
  
  // Medical Questions
  medicalQuestions: MedicalQuestionDto[] = [];
  showQuestionForm = false;
  questionForm: FormGroup;
  editingQuestionId: number | null = null;
  
  // Teeth Status
  teethStatus: ToothStatus[] = [];
  selectedToothNumber: number | null = null;
  selectedToothStatus: TeethStatus = TeethStatus.Healthy;
  
  // For interactive teeth diagram
  selectedTooth: ToothStatus | null = null;
  toothStatusOptions = getTeethStatusOptions();

  hoveredTooth: number | null = null;

  getToothStyle(status: TeethStatus, isHovered: boolean = false): string {
    const color = getTeethStatusColor(status);
    return `fill: ${color}; stroke: #374151; stroke-width: 1; cursor: pointer; ${isHovered ? 'filter: brightness(1.1);' : ''}`;
  }

  getToothStatusButtonClass(status: TeethStatus): string {
    const color = getTeethStatusColor(status);
    return `text-white`;
  }

  selectTooth(tooth: ToothStatus): void {
    this.selectedTooth = tooth;
  }

  selectToothByNumber(fdiNumber: number): void {
    // Convert FDI number from HTML to 1-32 for internal use
    const toothNumber = this.fromFDINotation(fdiNumber);
    this.selectedToothNumber = toothNumber;
    // جلب بيانات السن من teethStatus
    const tooth = this.teethStatus.find(t => t.toothNumber === toothNumber);
    this.tempToothStatus = tooth ? tooth.status : TeethStatus.Healthy;
    this.tempToothNotes = tooth ? tooth.notes || '' : '';
  }

  // Temporary status and notes for modal editing
  tempToothStatus: TeethStatus | null = null;
  tempToothNotes: string | null = null;

  // Tooth mapping from 1-32 to FDI for HTML display
  teethMapping = {
    // Upper right quadrant (1-8 -> 11-18)
    1: 18, 2: 17, 3: 16, 4: 15, 5: 14, 6: 13, 7: 12, 8: 11,
    // Upper left quadrant (9-16 -> 21-28)
    9: 21, 10: 22, 11: 23, 12: 24, 13: 25, 14: 26, 15: 27, 16: 28,
    // Lower left quadrant (17-24 -> 31-38)
    17: 31, 18: 32, 19: 33, 20: 34, 21: 35, 22: 36, 23: 37, 24: 38,
    // Lower right quadrant (25-32 -> 41-48)
    25: 41, 26: 42, 27: 43, 28: 44, 29: 45, 30: 46, 31: 47, 32: 48
  };

  updateToothStatusByNumber(toothNumber: number, status: TeethStatus): void {
    // toothNumber is already in 1-32 format from selectedToothNumber
    // Only update the temporary status, don't save to backend yet
    this.tempToothStatus = status;
  }

  getToothStatus(fdiNumber: number): TeethStatus {
    // If no patient is selected or teeth status is not loaded, return Unknown as default
    if (!this.selectedPatientId || !this.teethStatus || this.teethStatus.length === 0) {
      return TeethStatus.Unknown;
    }
    
    // Convert FDI number from HTML to 1-32 for internal lookup
    const toothNumber = this.fromFDINotation(fdiNumber);
    const tooth = this.teethStatus.find(t => t.toothNumber === toothNumber);
    if (tooth) {
      console.log(`Found tooth ${toothNumber} (FDI: ${fdiNumber}) with status:`, tooth.status);
      return tooth.status;
    }
    
    console.log(`Tooth ${toothNumber} (FDI: ${fdiNumber}) not found in teeth status array`);
    return TeethStatus.Unknown;
  }

  // Get the display status for the modal (temporary status if available, otherwise current status)
  getDisplayToothStatus(toothNumber: number): TeethStatus {
    // toothNumber is already in 1-32 format from selectedToothNumber
    if (this.selectedToothNumber === toothNumber && this.tempToothStatus !== null) {
      return this.tempToothStatus;
    }
    // Convert to FDI for getToothStatus call
    const fdiNumber = this.toFDINotation(toothNumber);
    return this.getToothStatus(fdiNumber);
  }

  // Close modal and reset temporary status
  closeToothStatusModal(): void {
    this.selectedToothNumber = null;
    this.tempToothStatus = null;
    this.tempToothNotes = null;
  }

  // --- Images and Attachments DTO-driven logic ---
  // Remove all logic and properties related to treatment plan data, attachments, and images
  // Remove: beforeImages, afterImages, patientAttachments, and any related methods or state
  // Only keep logic for the tab structure, patient selection, teeth status, and non-treatment-plan features

  // --- Remove the following properties and methods ---
  // beforeImages: { url: string; description?: string; uploadDate: string }[]
  // afterImages: { url: string; description?: string; uploadDate: string }[]
  // patientAttachments: CreateAttachmentDto[]
  // Any methods for loading, previewing, or manipulating these

  // --- Form Validation Helpers ---
  isFieldInvalid(field: string): boolean {
    const control = this.treatmentPlanForm.get(field);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }
  getFieldError(field: string): string {
    const control = this.treatmentPlanForm.get(field);
    if (!control || !control.errors) return '';
    if (control.errors['required']) return 'هذا الحقل مطلوب';
    if (control.errors['minlength']) return `يجب أن يكون على الأقل ${control.errors['minlength'].requiredLength} حرًا`;
    if (control.errors['min']) return 'القيمة يجب أن تكون أكبر من أو تساوي 0';
    return 'قيمة غير صالحة';
  }

  // --- Image Preview Logic ---
  // Image preview modal state
  showImagePreview = false;
  previewImageUrl: string | null = null;
  previewImageDescription: string | null = null;
  previewImageIndex: number = 0;
  previewImageList: CreateTreatmentImageDto[] = [];

  openImagePreviewFromList(images: CreateTreatmentImageDto[], index: number): void {
    this.previewImageList = images;
    this.previewImageIndex = index;
    this.previewImageUrl = images[index].imageFile ? URL.createObjectURL(images[index].imageFile) : '';
    this.showImagePreview = true;
  }

  openImagePreviewFromTreatmentImages(images: { url: string }[], index: number): void {
    // Accepts TreatmentImage[] (with url property)
    this.previewImageList = [] as any; // Clear to avoid type confusion
    this.previewImageIndex = index;
    this.previewImageUrl = images[index].url;
    this.showImagePreview = true;
    // Optionally, you could add a flag to distinguish the type if needed
  }

  nextPreviewImage(): void {
    if (this.previewImageList.length > 0) {
      this.previewImageIndex = (this.previewImageIndex + 1) % this.previewImageList.length;
      const imageFile = this.previewImageList[this.previewImageIndex].imageFile;
      this.previewImageUrl = imageFile ? URL.createObjectURL(imageFile as Blob) : '';
    }
  }

  prevPreviewImage(): void {
    if (this.previewImageList.length > 0) {
      this.previewImageIndex = (this.previewImageIndex - 1 + this.previewImageList.length) % this.previewImageList.length;
      const imageFile = this.previewImageList[this.previewImageIndex].imageFile;
      this.previewImageUrl = imageFile ? URL.createObjectURL(imageFile as Blob) : '';
    }
  }

  closeImagePreview(): void {
    this.showImagePreview = false;
    this.previewImageUrl = null;
    this.previewImageDescription = null;
    this.previewImageList = [];
    this.previewImageIndex = 0;
  }

  // Preview an uploaded or new attachment
  isImage(url: string): boolean {
  if (!url) return false;
  const ext = url.split('.').pop()?.toLowerCase() || '';
  return ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'].includes(ext);
}

previewAttachment(att: { fileUrl?: string; type?: string }): void {
  const url = this.getFullImageUrl(att.fileUrl ?? '');
  if (this.isImage(att.fileUrl ?? '')) {
    this.previewImageUrl = url;
    this.previewImageDescription = att.type || 'مرفق';
    this.showImagePreview = true;
  } else {
    window.open(url, '_blank');
  }
}

  deleteAttachment(index: number): void {
    // this.patientAttachments.splice(index, 1); // This line is removed
  }

  handleKeyDown(event: KeyboardEvent): void {
    if (this.showImagePreview) {
      if (event.key === 'Escape') {
        this.closeImagePreview();
      } else if (event.key === 'ArrowRight') {
        this.nextPreviewImage();
      } else if (event.key === 'ArrowLeft') {
        this.prevPreviewImage();
      }
    }
  }

  // Remove duplicate selectTooth (keep only the one that takes ToothStatus)
  // Implement onBeforeImageSelected and onAfterImageSelected methods
  onBeforeImageSelected(event: any): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length) {
      const file = input.files[0];
      this.beforeImageFile = file;
      
      // Create a preview using FileReader
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.beforeImagePreview = e.target.result;
      };
      reader.readAsDataURL(file);
      
      // Upload if a plan is selected
      if (this.selectedPlan && this.selectedPlan.id) {
        const dto: CreateTreatmentImageDto = {
          treatmentPlanId: this.selectedPlan.id,
          imageFile: file,
          imageType: 'before',
          uploadDate: new Date().toISOString()
        };
        this.uploadTreatmentImage(dto);
      }
    }
  }
  
  onAfterImageSelected(event: any): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length) {
      const file = input.files[0];
      this.afterImageFile = file;
      
      // Create a preview using FileReader
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.afterImagePreview = e.target.result;
      };
      reader.readAsDataURL(file);
      
      // Upload if a plan is selected
      if (this.selectedPlan && this.selectedPlan.id) {
        const dto: CreateTreatmentImageDto = {
          treatmentPlanId: this.selectedPlan.id,
          imageFile: file,
          imageType: 'after',
          uploadDate: new Date().toISOString()
        };
        this.uploadTreatmentImage(dto);
      }
    }
  }

  // Implement updateToothStatus
  updateToothStatus(tooth: ToothStatus, status: TeethStatus): void {
    tooth.status = status;
    this.selectedTooth = null;
  }

  // Add upperJawTeeth and lowerJawTeeth arrays for SVG mapping
  get upperJawTeeth() {
    // Map teethStatus for upper jaw (11-18, 21-28)
    return this.teethStatus
      .filter(t => (t.toothNumber >= 11 && t.toothNumber <= 18) || (t.toothNumber >= 21 && t.toothNumber <= 28))
      .map((t, i) => ({
        ...t,
        path: 'M10 10h20v20h-20z', // Placeholder path, replace with real SVG
        labelX: 20 + i * 30,
        labelY: 50,
        number: t.toothNumber
      }));
  }
  get lowerJawTeeth() {
    // Map teethStatus for lower jaw (31-38, 41-48)
    return this.teethStatus
      .filter(t => (t.toothNumber >= 31 && t.toothNumber <= 38) || (t.toothNumber >= 41 && t.toothNumber <= 48))
      .map((t, i) => ({
        ...t,
        path: 'M10 100h20v20h-20z', // Placeholder path, replace with real SVG
        labelX: 20 + i * 30,
        labelY: 150,
        number: t.toothNumber
      }));
  }

  private subscriptions = new Subscription();

  constructor(
    private loadingService: LoadingService,
    private treatmentPlanService: TreatmentPlanService,
    private patientService: PatientService,
    private fb: FormBuilder,
    private toastService: ToastService,
    private treatmentImageService: TreatmentImageService,
    private attachmentService: AttachmentService,
    private medicalQuestionService: MedicalQuestionService,
    private teethService: TeethService,
    private cdr: ChangeDetectorRef,
    private zone: NgZone,
    private http: HttpClient
  ) {
    this.treatmentPlanForm = this.fb.group({
      description: ['', [Validators.required, Validators.minLength(10)]],
      plannedDate: ['', Validators.required],
      isCompleted: [false],
      doctorNotes: [''],
      treatmentType: ['', Validators.required],
      estimatedCost: [0, [Validators.required, Validators.min(0)]],
      beforeImageDescription: [''],
      afterImageDescription: ['']
      
    });

    this.questionForm = this.fb.group({
      questionText: ['', Validators.required],
      answer: ['no', Validators.required]
    });
  }

  ngOnInit(): void {
    console.log('Initializing TreatmentPlansComponent');
    this.loadingService.showForDuration(1000);
    
    // Load initial data
    this.loadPatients();
    this.loadTreatmentTypes();
    
    // Initialize empty teeth status array
  this.teethStatus = [];
  console.log('Initial teeth statuses on component initialization:', this.teethStatus);
  
  // Initialize filteredPatients
  this.filteredPatients = this.patients;
    
    console.log('TreatmentPlansComponent initialized');
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  // Tab management
  setActiveTab(tabName: string): void {
    this.activeTab = tabName;
    
    // No need to load teeth data here as it's already loaded when patient is selected
  }

  isActiveTab(tabName: string): boolean {
    return this.activeTab === tabName;
  }

  loadPatients(): void {
    console.log('Loading patients...');
    this.patientService.getAll().subscribe({
      next: (patients) => {
        console.log('Loaded patients:', patients);
        this.patients = patients;
        this.filteredPatients = [...patients];
      },
      error: (error) => {
        console.error('Error loading patients:', error);
        this.toastService.show('خطأ في تحميل قائمة المرضى', 'error');
        this.patients = [];
        this.filteredPatients = [];
      }
    });
  }
  filterPatients(): void {
    const term = this.patientSearchTerm.trim().toLowerCase();
    this.filteredPatients = this.patients.filter(patient =>
      patient.fullName.toLowerCase().includes(term) ||
      patient.phoneNumber.includes(term)
    );
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
    this.selectedPatientId = patient.id;
    this.patientSearchTerm = patient.fullName;
    this.showPatientDropdown = false;
    this.filteredPatients = this.patients;
    console.log("Selected id", this.selectedPatientId);
    
    // Clear any existing teeth data before loading new patient data
    this.teethStatus = [];
    this.selectedToothNumber = null;
    
    // Load patient data - this will also load teeth data
    this.onPatientSelect(patient.id);
  }

  clearPatientSelection(): void {
    this.selectedPatient = null;
    this.selectedPatientId = null;
    this.patientSearchTerm = '';
    this.filteredPatients = this.patients;
    this.showPatientDropdown = true;
  }

  onPatientInputBlur(): void {
    setTimeout(() => {
      this.zone.run(() => {
        this.showPatientDropdown = false;
        this.cdr.detectChanges();
      });
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

  loadTreatmentTypes(): void {
    this.treatmentTypes = this.treatmentPlanService.getTreatmentTypes();
  }

  getArabicTreatmentType(type: string): string {
    const arabicTypes: { [key: string]: string } = {
      'cleaning': 'تنظيف الأسنان',
      'filling': 'حشو',
      'extraction': 'خلع',
      'root_canal': 'علاج الجذر',
      'crown': 'تاج',
      'bridge': 'جسر',
      'implant': 'زراعة',
      'orthodontics': 'تقويم',
      'surgery': 'جراحة',
      'other': 'أخرى'
    };
    return arabicTypes[type] || type;
  }

  getFormattedPlannedDate(date: string): string {
    if (!date || date.startsWith('0001-01-01')) {
      return 'غير محدد';
    }
    return new Date(date).toISOString().split('T')[0];
  }

  // Load all treatment plans for the selected patient
  loadTreatmentPlans(patientId: number): void {
    this.treatmentPlanService.getByPatientId(patientId).subscribe(plans => {
      this.treatmentPlans = plans;
    });
  }

  // When a patient is selected, load their treatment plans and teeth data
  onPatientSelect(patientId: number): void {
    if (!patientId) {
      return;
    }
    
    this.selectedPatientId = patientId;
    this.selectedPatient = this.patients.find(p => p.id === patientId) || null;
    
    // Reset all form states and selections
    this.treatmentPlanForm.reset({ isCompleted: false, estimatedCost: 0 });
    this.questionForm.reset({ answer: null });
    this.selectedToothNumber = null;
    this.selectedToothStatus = TeethStatus.Healthy;
    this.tempToothStatus = null;
    this.tempToothNotes = null;
    this.showForm = false;
    this.showQuestionForm = false;
    this.editingQuestionId = null;
    
    // Load patient data in sequence to avoid race conditions
    this.loadTreatmentPlans(patientId);
    this.loadMedicalQuestions(patientId);
    
    // Set active tab to treatment plans by default
    this.activeTab = 'treatment-plans';
    
    // Initialize and load teeth data when patient is selected
    this.resetTeethStatus();
    this.loadTeethStatus(patientId);
  }

  // Open form for new plan
  showAddForm(): void {
    console.log('showAddForm called');
    this.isEditMode = false;
    this.selectedPlan = null;
    this.treatmentPlanForm.reset();
    this.showForm = true;
  }

  // Preview an uploaded image
  previewImage(img: TreatmentImageDto): void {
    this.previewImageUrl = this.getFullImageUrl(img.imageUrl ?? '');
    this.previewImageDescription = img.imageType === 'before' ? 'قبل' : (img.imageType === 'after' ? 'بعد' : (img.imageType ?? ''));
    this.showImagePreview = true;
  }

  getFullImageUrl(url: string): string {
    return `${environment.apiUrl.replace('/api', '')}${url}`;
  }

  // Delete an uploaded image
  deleteUploadedImage(planId: number, imageId: number): void {
    this.treatmentImageService.delete(imageId).subscribe({
      next: () => {
        this.toastService.show('تم حذف الصورة بنجاح', 'success');
        this.treatmentImageService.getByTreatmentPlanId(planId).subscribe(imgs => this.planImages[planId] = imgs);
      },
      error: () => {
        this.toastService.show('حدث خطأ أثناء حذف الصورة', 'error');
      }
    });
  }

  // Delete an uploaded attachment
  deleteUploadedAttachment(planId: number, attId: number): void {
    this.attachmentService.delete(attId).subscribe({
      next: () => {
        this.toastService.show('تم حذف المرفق بنجاح', 'success');
        this.attachmentService.getByTreatmentPlanId(planId).subscribe(atts => this.planAttachments[planId] = atts);
      },
      error: () => {
        this.toastService.show('حدث خطأ أثناء حذف المرفق', 'error');
      }
    });
  }

  // When editing a plan, load its images and attachments into the modal
  showEditForm(plan: TreatmentPlanDto): void {
    console.log('showEditForm called', plan);
    this.isEditMode = true;
    this.selectedPlan = plan;
    // Fill form fields with fetched plan data
    this.treatmentPlanForm.patchValue({
      description: plan.description,
      plannedDate: plan.plannedDate,
      isCompleted: plan.isCompleted,
      treatmentType: plan.treatmentPlanType,
      estimatedCost: (plan as any).estimatedCost || 0
    });
    // Do NOT clear treatmentImages or attachments arrays here
    // Load images and attachments for this plan (for preview/delete only)
    this.treatmentImageService.getByTreatmentPlanId(plan.id).subscribe(imgs => {
      this.planImages[plan.id] = imgs;
    });
    this.attachmentService.getByTreatmentPlanId(plan.id).subscribe(atts => {
      this.planAttachments[plan.id] = atts;
    });
    this.showForm = true;
  }

  // Upload treatment image method
  uploadTreatmentImage(dto: CreateTreatmentImageDto): void {
    this.treatmentImageService.create(dto).subscribe({
      next: (response) => {
        this.toastService.show('تم رفع الصورة بنجاح', 'success');
        if (dto.treatmentPlanId) {
          this.treatmentImageService.getByTreatmentPlanId(dto.treatmentPlanId)
            .subscribe(imgs => this.planImages[dto.treatmentPlanId] = imgs);
        }
      },
      error: (error) => {
        this.toastService.show('حدث خطأ أثناء رفع الصورة', 'error');
        console.error('Error uploading image:', error);
      }
    });
  }
  
  // Upload attachment method
  uploadAttachment(dto: CreateAttachmentDto): void {
    this.attachmentService.create(dto).subscribe({
      next: (response) => {
        this.toastService.show('تم رفع المرفق بنجاح', 'success');
        if (dto.treatmentPlanId) {
          this.attachmentService.getByTreatmentPlanId(dto.treatmentPlanId)
            .subscribe(atts => this.planAttachments[dto.treatmentPlanId] = atts);
        }
      },
      error: (error) => {
        this.toastService.show('حدث خطأ أثناء رفع المرفق', 'error');
        console.error('Error uploading attachment:', error);
      }
    });
  }
  
  // Submit form for create or update
  isSubmitting = false; // Add this property to manage submit button state
  submitTreatmentPlan(): void {
    if (!this.treatmentPlanForm.valid || !this.selectedPatientId) {
      this.treatmentPlanForm.markAllAsTouched();
      return;
    }
    this.isSubmitting = true;
    const formValue = this.treatmentPlanForm.value;
    if (this.isEditMode && this.selectedPlan) {
      // Update logic remains similar, sending JSON for plan updates (files handled separately)
      const dto: UpdateTreatmentPlanDto = {
        patientId: this.selectedPlan.patientId,
        description: formValue.description,
        plannedDate: formValue.plannedDate,
        treatmentPlanType: formValue.treatmentType,
        estimatedCost: formValue.estimatedCost,
        isCompleted: formValue.isCompleted ?? false,
        treatmentImageIds: [],
        treatmentImages: [],
        attachments: []
      };
      this.treatmentPlanService.update(this.selectedPlan.id, dto).subscribe({
        next: () => {
          this.toastService.show('تم تحديث الخطة بنجاح', 'success');
          this.loadTreatmentPlans(this.selectedPlan!.patientId);
          this.showForm = false;
          this.treatmentPlanForm.reset();
          this.isSubmitting = false;
        },
        error: () => {
          this.toastService.show('حدث خطأ أثناء تحديث الخطة', 'error');
          this.showForm = false;
          this.isSubmitting = false;
        }
      });
    } else {
      if (this.selectedPatientId == null) {
        this.toastService.show('يرجى اختيار مريض أولاً', 'error');
        this.isSubmitting = false;
        return;
      }
      const dto: CreateTreatmentPlanDto = {
        patientId: this.selectedPatientId,
        description: formValue.description,
        plannedDate: formValue.plannedDate,
        treatmentPlanType: formValue.treatmentType,
        estimatedCost: formValue.estimatedCost,
        isCompleted: formValue.isCompleted ?? false,
        treatmentImages: [],
        attachments: []
      };
      this.treatmentPlanService.create(dto).subscribe({
        next: (createdPlan: any) => {
          const newPlanId = createdPlan.id || createdPlan.treatmentPlanId || createdPlan.planId;
          this.selectedPlan = { ...createdPlan, id: newPlanId };
          this.isEditMode = true;
          // Upload pending images
          for (let i = this.treatmentImages.length - 1; i >= 0; i--) {
            this.submitSingleImage(i);
          }
          // Upload pending attachments
          for (let i = this.attachments.length - 1; i >= 0; i--) {
            this.submitSingleAttachment(i);
          }
          this.showForm = false;
          this.isSubmitting = false;
          this.toastService.show('تم إضافة الخطة بنجاح', 'success');
          this.treatmentPlanService.getById(newPlanId).subscribe({
            next: (newPlan) => {
              this.treatmentPlans = [newPlan, ...this.treatmentPlans];
              this.treatmentImageService.getByTreatmentPlanId(newPlanId).subscribe(imgs => this.planImages[newPlanId] = imgs);
              this.attachmentService.getByTreatmentPlanId(newPlanId).subscribe(atts => this.planAttachments[newPlanId] = atts);
            }
          });
          this.treatmentPlanForm.reset();
          this.selectedPlan = null;
          this.isEditMode = false;
        },
        error: () => {
          this.toastService.show('حدث خطأ أثناء إضافة الخطة', 'error');
          this.showForm = false;
          this.isSubmitting = false;
        }
      });
    }
  }

  // Delete a treatment plan
  deleteTreatmentPlan(planId: number): void {
    if (confirm('هل أنت متأكد من حذف هذه الخطة؟')) {
      this.treatmentPlanService.delete(planId).subscribe({
        next: () => {
          this.toastService.show('تم حذف الخطة بنجاح', 'success');
          this.loadTreatmentPlans(this.selectedPatientId!);
        },
        error: () => {
          this.toastService.show('حدث خطأ أثناء حذف الخطة', 'error');
        }
      });
    }
  }

  // Toggle completion status of a treatment plan
  toggleCompletionStatus(planId: number, currentStatus: boolean): void {
    this.treatmentPlanService.toggleCompletionStatus(planId, !currentStatus).subscribe({
      next: () => {
        this.toastService.show('تم تحديث حالة الخطة بنجاح', 'success');
        this.loadTreatmentPlans(this.selectedPatientId!);
      },
      error: () => {
        this.toastService.show('حدث خطأ أثناء تحديث حالة الخطة', 'error');
      }
    });
  }

  // Image and attachment upload logic
  onImageFileChange(event: any): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length) {
      const file = input.files[0];
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.treatmentImages.push({
          id: 0,
          imageUrl: e.target.result,
          imageType: 'before', // or 'after', can be selected by user
          uploadDate: new Date().toISOString()
        });
      };
      reader.readAsDataURL(file);
      input.value = '';
    }
  }
  
  onAttachmentFileChange(event: any): void {
    const file = event.target.files[0];
    if (!file) return;
    this.attachmentFile = file;
    this.attachmentFileName = file.name;
    
    const reader = new FileReader();
    reader.onload = (e: any) => {
      this.attachments.push({
        id: 0,
        fileUrl: e.target.result,
        uploadDate: new Date().toISOString(),
        type: '' // User must pick from dropdown, not MIME type
      });
    };
    reader.readAsDataURL(file);
  }

  // Upload a single image for the current plan (new or edit)
  submitSingleImage(index: number): void {
    const img = this.treatmentImages[index];
    const planId = this.isEditMode && this.selectedPlan ? this.selectedPlan.id : null;
    if (!planId) {
      this.toastService.show('يجب حفظ الخطة أولاً قبل رفع الصور', 'error');
      return;
    }
    
    // Convert base64 to File object if we have a base64 string
    let imageFile: File | null = null;
    if (img.imageUrl && img.imageUrl.startsWith('data:')) {
      // Convert base64 to File
      const arr = img.imageUrl.split(',');
      const mimeMatch = arr[0].match(/:(.*?);/);
      const mime = mimeMatch ? mimeMatch[1] : 'application/octet-stream';
      const bstr = atob(arr[1]);
      let n = bstr.length;
      const u8arr = new Uint8Array(n);
      while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
      }
      imageFile = new File([u8arr], `image_${Date.now()}.${mime.split('/')[1]}`, { type: mime });
    }
    
    const dto: CreateTreatmentImageDto = {
      treatmentPlanId: planId,
      imageFile: imageFile || undefined,
      imageType: String(img.imageType ?? 'before'),
      uploadDate: new Date().toISOString()
    };
    
    this.treatmentImageService.create(dto).subscribe({
      next: () => {
        this.toastService.show('تم رفع الصورة بنجاح', 'success');
        this.treatmentImageService.getByTreatmentPlanId(planId).subscribe(imgs => this.planImages[planId] = imgs);
        this.treatmentImages.splice(index, 1);
      },
      error: (error) => {
        this.toastService.show('حدث خطأ أثناء رفع الصورة', 'error');
        console.error('Error uploading image:', error);
      }
    });
  }

  // Upload a single attachment for the current plan (new or edit)
  submitSingleAttachment(index: number): void {
    const att = this.attachments[index];
    const planId = this.isEditMode && this.selectedPlan ? this.selectedPlan.id : null;
    const validTypes = ['Scan', 'Xray', 'Prescription', 'Other'];
    if (!att.type || validTypes.indexOf(att.type) === -1) {
      this.toastService.show('يرجى اختيار نوع المرفق قبل الرفع', 'error');
      return;
    }
    if (!planId) {
      this.toastService.show('يجب حفظ الخطة أولاً قبل رفع المرفقات', 'error');
      return;
    }
    
    // Convert base64 to File object if we have a base64 string
    let file: File | null = null;
    if (att.fileUrl && att.fileUrl.startsWith('data:')) {
      // Convert base64 to File
      const arr = att.fileUrl.split(',');
      const mimeMatch = arr[0].match(/:(.*?);/);
      const mime = mimeMatch ? mimeMatch[1] : 'application/octet-stream';
      const bstr = atob(arr[1]);
      let n = bstr.length;
      const u8arr = new Uint8Array(n);
      while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
      }
      file = new File([u8arr], `attachment_${Date.now()}.${mime.split('/')[1]}`, { type: mime });
    }
    
    const dto: CreateAttachmentDto = {
      treatmentPlanId: planId,
      file: file as File,
      type: att.type, // This is from the dropdown, not the MIME type
      // Remove uploadDate since it's not part of CreateAttachmentDto
    };
    
    this.attachmentService.create(dto).subscribe({
      next: () => {
        this.toastService.show('تم رفع المرفق بنجاح', 'success');
        this.attachmentService.getByTreatmentPlanId(planId).subscribe(atts => this.planAttachments[planId] = atts);
        this.attachments.splice(index, 1);
      },
      error: (error) => {
        this.toastService.show('حدث خطأ أثناء رفع المرفق', 'error');
        console.error('Error uploading attachment:', error);
      }
    });
  }

  // Remove image/attachment from the form before submit
  removeImage(index: number): void {
    this.treatmentImages.splice(index, 1);
  }
  removeAttachment(index: number): void {
    this.attachments.splice(index, 1);
  }

  // Medical Questions Methods
  loadMedicalQuestions(patientId: number): void {
    this.medicalQuestionService.getByPatientId(patientId).subscribe(questions => {
      this.medicalQuestions = questions;
    });
  }

  showAddQuestionForm(): void {
    this.editingQuestionId = null;
    this.questionForm.reset({ answer: '' });
    this.showQuestionForm = true;
  }

  editQuestion(questionId: number): void {
    const question = this.medicalQuestions.find(q => q.id === questionId);
    if (question) {
      this.editingQuestionId = questionId;
      this.questionForm.patchValue({
        questionText: question.questionText,
        answer: question.answerText ?? ''
      });
      this.showQuestionForm = true;
    }
  }

  saveQuestion(): void {
    if (this.questionForm.valid && this.selectedPatientId) {
      const formData = this.questionForm.value;
      if (this.editingQuestionId) {
        // Update existing question
        const updateQuestionDto: UpdateMedicalQuestionDto = {
          id: this.editingQuestionId,
          questionText: formData.questionText,
          answerText: formData.answer || undefined,
          isAnswered: !!formData.answer,
          answeredAt: formData.answer ? new Date() : undefined
        };
        this.medicalQuestionService.update(updateQuestionDto).subscribe(() => {
          this.loadMedicalQuestions(this.selectedPatientId!);
          this.toastService.show('تم تحديث السؤال الطبي بنجاح', 'success');
        }, error => {
          this.toastService.show('خطأ في تحديث السؤال', 'error');
        });
      } else {
        // Create new question
        const createQuestionDto: CreateMedicalQuestionDto = {
          patientId: this.selectedPatientId,
          questionText: formData.questionText,
          answerText: formData.answer || undefined,
          answeredAt: formData.answer ? new Date() : undefined
        };
        this.medicalQuestionService.create(createQuestionDto).subscribe((response: any) => {
          this.loadMedicalQuestions(this.selectedPatientId!);
          this.toastService.show('تم إضافة السؤال الطبي بنجاح', 'success');
        }, error => {
          this.toastService.show('خطأ في إضافة السؤال', 'error');
        });
      }
      this.hideQuestionForm();
    }
  }

  

  deleteQuestion(questionId: number): void {
    if (confirm('هل أنت متأكد من حذف هذا السؤال؟')) {
      this.medicalQuestionService.delete(questionId).subscribe(() => {
        this.loadMedicalQuestions(this.selectedPatientId!);
        this.toastService.show('تم حذف السؤال الطبي بنجاح', 'success');
      }, error => {
        this.toastService.show('خطأ في حذف السؤال', 'error');
      });
    }
  }

  hideQuestionForm(): void {
    this.showQuestionForm = false;
    this.editingQuestionId = null;
    this.questionForm.reset();
  }

  // Teeth Status Methods
  initializeTeethStatus(): void {
    // Initialize all teeth as healthy using 1-32 numbering
    this.teethStatus = [];
    for (let i = 1; i <= 32; i++) {
      this.teethStatus.push({
        id: i,
        toothNumber: i, // 1-32 numbering
        status: TeethStatus.Healthy,
        lastUpdated: new Date()
      });
    }
  }

  alignTeethData(teethData: TeethDto[]): void {
    console.log('Aligning teeth data:', teethData);
    
    // Check if teethData is null, undefined, or not an array
    if (!teethData || !Array.isArray(teethData)) {
      console.log('No teeth data available or invalid data format');
      return;
    }
    
    console.log('Current teethStatus array before processing:', this.teethStatus.map(t => t.toothNumber));
    
    teethData.forEach(tooth => {
      // API uses 1-32 numbering, use directly without conversion
      console.log(`Processing tooth ${tooth.teethNumber}, status: ${tooth.status}`);
      
      const existingTooth = this.teethStatus.find(t => t.toothNumber === tooth.teethNumber);
      if (existingTooth) {
        console.log(`Updating existing tooth ${tooth.teethNumber}`);
        existingTooth.id = tooth.id;
        existingTooth.status = convertStringToTeethStatus(tooth.status);
        existingTooth.notes = tooth.description;
        existingTooth.lastUpdated = tooth.lastUpdated || new Date();
      } else {
        console.log(`Adding new tooth ${tooth.teethNumber} to teethStatus array`);
        this.teethStatus.push({
          id: tooth.id,
          toothNumber: tooth.teethNumber, // Use 1-32 directly
          status: convertStringToTeethStatus(tooth.status),
          notes: tooth.description,
          lastUpdated: tooth.lastUpdated || new Date()
        });
      }
    });
    console.log('Updated teeth status array after processing:', this.teethStatus.map(t => t.toothNumber));
    console.log('Final teeth status array:', this.teethStatus);
    this.cdr.detectChanges();
  }

  loadTeethStatus(patientId: number): void {
    if (!patientId) {
      return;
    }
    
    // First initialize all teeth with default status
    this.initializeTeethStatus();
    
    this.teethService.getAllByPatientId(patientId).subscribe({
      next: (teethData: TeethDto[]) => {
        console.log("Teeth Data",teethData)
        this.alignTeethData(teethData);
      },
      error: (error) => {
        this.toastService.show('حدث خطأ أثناء تحميل بيانات الأسنان', 'error');
        this.cdr.detectChanges();
      }
    });
  }



  // Reset all teeth status data
  resetTeethStatus(): void {
    this.teethStatus = [];
    this.selectedToothNumber = null;
    this.tempToothStatus = null;
    this.tempToothNotes = null;
  }
  
  // Get tooth notes safely
    getToothNotes(toothNumber: number | null): string {
      if (!toothNumber) return '';
      
      // If no patient is selected or teeth status is not loaded, return empty
      if (!this.selectedPatientId || !this.teethStatus || this.teethStatus.length === 0) {
        return '';
      }
      
      // toothNumber is already in 1-32 format from selectedToothNumber
      // Return temporary notes if editing this tooth
      if (this.selectedToothNumber === toothNumber && this.tempToothNotes !== null) {
        return this.tempToothNotes;
      }
      const tooth = this.teethStatus.find(t => t.toothNumber === toothNumber);
      return tooth?.notes || '';
    }

    // Get tooth last updated time safely
     getToothLastUpdated(toothNumber: number | null): Date | null {
       if (!toothNumber) return null;
       
       // toothNumber is already in 1-32 format from selectedToothNumber
       const tooth = this.teethStatus.find(t => t.toothNumber === toothNumber);
       return tooth?.lastUpdated || null;
       }

     // Get teeth status color
     getTeethStatusColor(status: TeethStatus): string {
       return getTeethStatusColor(status);
     }

     // Get teeth status label
  getTeethStatusLabel(status: TeethStatus): string {
    return getTeethStatusLabel(status);
  }

  // Convert 1-32 tooth number to FDI notation for HTML display
   toFDINotation(toothNumber: number): number {
     return this.teethMapping[toothNumber as keyof typeof this.teethMapping] || toothNumber;
   }

  // Convert FDI notation back to 1-32 numbering
  fromFDINotation(fdiNumber: number): number {
    // Find the 1-32 number that maps to this FDI number
    for (const [key, value] of Object.entries(this.teethMapping)) {
      if (value === fdiNumber) {
        return parseInt(key);
      }
    }
    return fdiNumber; // fallback
  }

   // Update tooth notes
  updateToothNotes(toothNumber: number, event: any): void {
    // toothNumber is already in 1-32 format from selectedToothNumber
    const notes = event.target.value;
    this.tempToothNotes = notes;
  }

  // Save individual tooth details
    saveToothDetails(toothNumber: number): void {
      if (!this.selectedPatientId) {
        this.toastService.show('يرجى اختيار مريض أولاً', 'error');
        return;
      }
      
      // toothNumber is already in 1-32 format from selectedToothNumber
      const tooth = this.teethStatus.find(t => t.toothNumber === toothNumber);
      if (!tooth) {
        this.toastService.show('لم يتم العثور على بيانات السن', 'error');
        return;
      }
  
      const updateDto: UpdateToothStatusDto = {
      status: this.tempToothStatus || tooth.status,
      description: this.tempToothNotes !== null ? this.tempToothNotes : (tooth.notes || '')
    };
  
      // Use 1-32 tooth number directly for API call (no conversion needed)
      
      this.teethService.updateToothStatus(this.selectedPatientId, toothNumber, updateDto).subscribe({
        next: (response) => {
          // Update local tooth status with the temporary status
          if (this.tempToothStatus !== null) {
            tooth.status = this.tempToothStatus;
          }
          // Update local tooth notes with the temporary notes
          if (this.tempToothNotes !== null) {
            tooth.notes = this.tempToothNotes;
          }
          tooth.lastUpdated = new Date();
          this.toastService.show('تم حفظ تفاصيل السن بنجاح', 'success');
          // Reload teeth status after successful update
          if (this.selectedPatient && this.selectedPatient.id) {
            this.loadTeethStatus(this.selectedPatient.id);
          }
          this.closeToothStatusModal();
        },
        error: (error) => {
          this.toastService.show('حدث خطأ أثناء حفظ تفاصيل السن', 'error');
        }
      });
     }



  // Remove all CRUD logic for treatment plans
  // Remove: showAddForm, showEditForm, hideForm, saveTreatmentPlan, deleteTreatmentPlan, togglePlanStatus, markFormGroupTouched, loadTreatmentPlans, and any DTO construction/service calls for treatment plans
  // Keep: UI state, patient selection, image preview, teeth status, and non-CRUD logic

  // --- Remove the following methods ---
  // showAddForm()
  // showEditForm(plan: TreatmentPlan)
  // hideForm()
  // saveTreatmentPlan()
  // deleteTreatmentPlan(planId: number)
  // togglePlanStatus(plan: TreatmentPlan)
  // markFormGroupTouched()
  // loadTreatmentPlans(patientId: number)

  // --- Remove any DTO construction and service calls for treatment plans ---
  // loadImagesAndAttachments(planId: number): void { // This line is removed
  //   // تحميل الصور
  //   this.treatmentImageService.getByTreatmentPlanId(planId).subscribe(images => {
  //     this.beforeImages = images.filter((img: any) => img.imageType === 'before');
  //     this.afterImages = images.filter((img: any) => img.imageType === 'after');
  //   });
  //   // تحميل المرفقات
  //   this.attachmentService.getByTreatmentPlanId(planId).subscribe(attachments => {
  //     this.patientAttachments = attachments;
  //   });
  // }

  getGenderArabic(gender: string): string {
    if (!gender) return 'غير محدد';
    const g = gender.toLowerCase();
    if (g === 'male') return 'ذكر';
    if (g === 'female') return 'أنثى';
    return 'غير محدد';
  }

  // Drag-and-drop and upload progress state
  isDragOverBefore = false;
  isDragOverAfter = false;
  isDragOverAttachment = false;
  uploadProgress: number[] = [];

  onDragOver(event: DragEvent, type: 'before' | 'after' | 'attachment') {
    event.preventDefault();
    if (type === 'before') this.isDragOverBefore = true;
    if (type === 'after') this.isDragOverAfter = true;
    if (type === 'attachment') this.isDragOverAttachment = true;
  }
  onDragLeave(event: DragEvent, type: 'before' | 'after' | 'attachment') {
    event.preventDefault();
    if (type === 'before') this.isDragOverBefore = false;
    if (type === 'after') this.isDragOverAfter = false;
    if (type === 'attachment') this.isDragOverAttachment = false;
    if (event.dataTransfer?.files) {
      this.handleFiles(event.dataTransfer.files, type);
    }
  }
  onFileSelect(event: Event, type: 'before' | 'after' | 'attachment') {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      this.handleFiles(input.files, type);
      input.value = '';
    }
  }
  handleFiles(files: FileList, type: 'before' | 'after' | 'attachment') {
    Array.from(files).forEach((file, idx) => {
      // Create a preview using FileReader
      const reader = new FileReader();
      reader.onload = (e: any) => {
        if (type === 'before' || type === 'after') {
          // For images, just create a preview
          if (type === 'before') {
            this.beforeImageFile = file;
            this.beforeImagePreview = e.target.result;
            
            // Upload if a plan is selected
            if (this.selectedPlan && this.selectedPlan.id) {
              const dto: CreateTreatmentImageDto = {
                treatmentPlanId: this.selectedPlan.id,
                imageFile: file,
                imageType: 'before',
                uploadDate: new Date().toISOString()
              };
              this.uploadTreatmentImage(dto);
            }
          } else {
            this.afterImageFile = file;
            this.afterImagePreview = e.target.result;
            
            // Upload if a plan is selected
            if (this.selectedPlan && this.selectedPlan.id) {
              const dto: CreateTreatmentImageDto = {
                treatmentPlanId: this.selectedPlan.id,
                imageFile: file,
                imageType: 'after',
                uploadDate: new Date().toISOString()
              };
              this.uploadTreatmentImage(dto);
            }
          }
        } else if (type === 'attachment' && this.selectedPlan && this.selectedPlan.id) {
          // For attachments, store the file and show upload progress
          if (!this.pendingAttachmentFile) {
            this.pendingAttachmentFile = {};
          }
          this.pendingAttachmentFile[this.selectedPlan.id] = file;
          this.pendingAttachmentType[this.selectedPlan.id] = 'Scan'; // Default value
          
          // Simulate upload progress (for demo)
          this.uploadProgress.push(0);
          this.simulateUploadProgress(this.uploadProgress.length - 1);
        }
      };
      reader.readAsDataURL(file);
    });
  }
  simulateUploadProgress(index: number) {
    let progress = 0;
    const interval = setInterval(() => {
      progress += 10;
      this.uploadProgress[index] = progress;
      if (progress >= 100) {
        clearInterval(interval);
      }
    }, 100);
  }

  onBeforeFileChange(event: any) {
    this.onBeforeImageSelected(event);
  }
  
  onAfterFileChange(event: any) {
    this.onAfterImageSelected(event);
  }

  // --- Expandable Card State ---
  expandedPlanId: number | null = null;
  planImages: { [planId: number]: TreatmentImageDto[] } = {};
  planAttachments: { [planId: number]: AttachmentDto[] } = {};
  expandedCards: { [planId: number]: boolean } = {};
  treatmentPlanImages: TreatmentImageDto[] = [];
  treatmentPlanAttachments: AttachmentDto[] = [];

  togglePlanDetails(planId: number) {
    this.expandedPlanId = this.expandedPlanId === planId ? null : planId;
    if (!this.planImages[planId]) {
      this.treatmentImageService.getByTreatmentPlanId(planId).subscribe(imgs => this.planImages[planId] = imgs);
    }
    if (!this.planAttachments[planId]) {
      this.attachmentService.getByTreatmentPlanId(planId).subscribe(atts => this.planAttachments[planId] = atts);
    }
  }
  
  // وظيفة لتبديل حالة البطاقة (مفتوحة/مغلقة)
  toggleCard(planId: number) {
    this.expandedCards[planId] = !this.expandedCards[planId];
  }
  
  // وظيفة للحصول على صور خطة العلاج حسب النوع
  getPlanImagesByType(planId: number, imageType: string): TreatmentImageDto[] {
    return this.treatmentPlanImages
      .filter(img => img.treatmentPlanId === planId && img.imageType === imageType);
  }
  
  // وظيفة للحصول على مرفقات خطة العلاج
  getPlanAttachments(planId: number): AttachmentDto[] {
    return this.treatmentPlanAttachments
      .filter(att => att.treatmentPlanId === planId);
  }
  
  // وظيفة للحصول على اسم الملف من URL
  getFileName(url: string | undefined): string {
    if (!url) return 'ملف';
    const parts = url.split('/');
    return parts[parts.length - 1];
  }
  
  // وظيفة للحصول على أيقونة المرفق بناءً على نوعه
  getAttachmentIcon(type: string | undefined): string {
    if (!type) return 'fa-file';
    
    switch (type.toLowerCase()) {
      case 'scan':
        return 'fa-x-ray';
      case 'xray':
        return 'fa-x-ray';
      case 'prescription':
        return 'fa-prescription';
      default:
        return 'fa-file';
    }
  }

  onCardImageUpload(event: any, planId: number, imageType: string) {
    const normalizedType: 'before' | 'after' = imageType.toLowerCase() === 'after' ? 'after' : 'before';
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length) {
      this.loadingService.show();
      const file = input.files[0];
      
      const dto: CreateTreatmentImageDto = {
        treatmentPlanId: planId,
        imageFile: file,
        imageType: normalizedType,
        uploadDate: new Date().toISOString()
      };
      
      this.treatmentImageService.create(dto).subscribe({
        next: () => {
          this.treatmentImageService.getByTreatmentPlanId(planId).subscribe(imgs => this.planImages[planId] = imgs);
          this.toastService.show('تم رفع الصورة بنجاح', 'success');
          this.loadingService.hide();
        },
        error: (error) => {
          this.loadingService.hide();
          this.toastService.show('حدث خطأ أثناء رفع الصورة', 'error');
          console.error('Error uploading image:', error);
        }
      });
      input.value = '';
    }
  }

  // Track pending attachment file and type per plan
  pendingAttachmentFile: { [planId: number]: File | null } = {};
  pendingAttachmentType: { [planId: number]: string | null } = {};

  // Track pending image type per plan
  pendingImageType: { [planId: number]: string | null } = {};

  // Track attachment menu visibility per plan
  showAttachmentMenu: { [planId: number]: boolean } = {};

  toggleAttachmentMenu(planId: number): void {
    this.showAttachmentMenu[planId] = !this.showAttachmentMenu[planId];
  }

  uploadImage(planId: number): void {
    const input = document.getElementById(`imageUpload_${planId}`) as HTMLInputElement;
    if (input) {
      input.click();
    }
  }

  // Handle file selection for a specific plan card
  onCardAttachmentFileChange(event: any, planId: number): void {
    const file = event.target.files[0];
    if (file) {
      if (!this.pendingAttachmentFile) {
        this.pendingAttachmentFile = {};
      }
      this.pendingAttachmentFile[planId] = file;
      this.pendingAttachmentType[planId] = 'Scan'; // القيمة الافتراضية
    }
  }

  // Upload the selected attachment for a specific plan card
  uploadCardAttachment(planId: number): void {
    if (!this.pendingAttachmentFile || !this.pendingAttachmentFile[planId] || !this.pendingAttachmentType || !this.pendingAttachmentType[planId]) {
      this.toastService.show('الرجاء اختيار ملف ونوع المرفق', 'error');
      return;
    }
    
    this.loadingService.show();
    
    const dto: CreateAttachmentDto = {
      treatmentPlanId: planId,
      file: this.pendingAttachmentFile[planId],
      type: this.pendingAttachmentType[planId]
    };
    
    this.attachmentService.create(dto).subscribe({
      next: (response) => {
        this.loadingService.hide();
        this.toastService.show('تم رفع المرفق بنجاح', 'success');
        this.attachmentService.getByTreatmentPlanId(planId).subscribe(atts => this.planAttachments[planId] = atts);
        this.pendingAttachmentFile[planId] = null;
        this.pendingAttachmentType[planId] = null;
      },
      error: (error) => {
        this.loadingService.hide();
        this.toastService.show('حدث خطأ أثناء رفع المرفق', 'error');
        console.error('Error uploading attachment:', error);
      }
    });
  }
}