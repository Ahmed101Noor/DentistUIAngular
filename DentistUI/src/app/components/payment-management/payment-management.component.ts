import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { PaymentService } from '../../services/payment.service';
import { PaymentTransactionService } from '../../services/payment-transaction.service';
import { PatientService } from '../../services/patient.service';
import { TreatmentPlanService } from '../../services/treatment-plan.service';
import { AppointmentService } from '../../services/appointment.service';
import { Patient } from '../../models/patient.model';
import { TreatmentPlanDto } from '../../models/treatment-plan.model';
import { AppointmentDto } from '../../models/appointment.model';
import * as XLSX from 'xlsx';
import {
  PaymentReadDto,
  PaymentCreateDto,
  PaymentUpdateDto,
  PaymentTransactionReadDto,
  PaymentTransactionCreateDto,
  PaymentStatus,
  PaymentMethod,
  DiscountType,
  PaymentFor,
  PaymentFilters,
  PaymentStats,
  PaymentSummaryReportDto,
  PaymentsByPatientReportDto,
  TransactionReportDto,
  RevenueByPaymentMethodDto,
  PaymentStatusReportDto,
  OutstandingPaymentReportDto
} from '../../models/payment.model';

@Component({
  selector: 'app-payment-management',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './payment-management.component.html',
  styleUrls: ['./payment-management.component.css']
})
export class PaymentManagementComponent implements OnInit {
  // Enums for template access
  PaymentStatus = PaymentStatus;
  PaymentMethod = PaymentMethod;
  DiscountType = DiscountType;
  PaymentFor = PaymentFor;

  // Data arrays
  payments: PaymentReadDto[] = [];
  filteredPayments: PaymentReadDto[] = [];
  patients: Patient[] = [];
  treatmentPlans: TreatmentPlanDto[] = [];
  filteredTreatmentPlans: TreatmentPlanDto[] = [];
  appointments: AppointmentDto[] = [];
  filteredAppointments: AppointmentDto[] = [];
  paymentStats: PaymentStats = {
    totalPayments: 0,
    totalAmount: 0,
    paidAmount: 0,
    remainingAmount: 0,
    pendingPayments: 0
  };

  // Forms
  paymentForm!: FormGroup;
  transactionForm!: FormGroup;
  editPaymentForm!: FormGroup;

  // UI state
  showPaymentModal = false;
  showTransactionModal = false;
  showEditPaymentModal = false;
  showPaymentDetailsModal = false;
  showReportsModal = false;
  showStatsCards = true;
  selectedPayment: PaymentReadDto | null = null;
  selectedPaymentTransactions: PaymentTransactionReadDto[] = [];
  isLoading = false;

  // Advanced patient search properties
  patientSearchTerm: string = '';
  selectedPatient: Patient | null = null;
  filteredPatients: Patient[] = [];
  showPatientDropdown: boolean = false;
  
  // Reports data
  paymentSummary: PaymentSummaryReportDto | null = null;
  paymentsByPatients: PaymentsByPatientReportDto[] = [];
  transactionsReport: TransactionReportDto[] = [];
  revenueByMethod: RevenueByPaymentMethodDto[] = [];
  paymentStatusReport: PaymentStatusReportDto[] = [];
  outstandingPayments: OutstandingPaymentReportDto[] = [];
  reportDateFrom = '';
  reportDateTo = '';

  // Pagination
  currentPage = 1;
  itemsPerPage = 10;
  totalPages = 1;
  pages: number[] = [];

  // Filters
  filters: PaymentFilters = {};
  searchTerm = '';
  statusFilter = '';
  methodFilter = '';
  patientFilter = '';
  dateFromFilter = '';
  dateToFilter = '';

  // Messages
  message = { text: '', type: 'success' as 'success' | 'error' };
  transactionMessage = { text: '', type: 'success' as 'success' | 'error' };

  // Advanced features
  showAdvancedFilters = false;
  showBulkActions = false;
  selectedPayments: Set<number> = new Set();
  bulkActionType = '';
  showExportModal = false;
  exportFormat = 'excel';
  showAnalyticsModal = false;
  analyticsData: any = null;
  analyticsPeriod = 'monthly';
  
  // Statistics period tracking
  statsDateRange = {
    from: '',
    to: '',
    description: 'جميع البيانات'
  };

  constructor(
    private fb: FormBuilder,
    private paymentService: PaymentService,
    private transactionService: PaymentTransactionService,
    private patientService: PatientService,
    private treatmentPlanService: TreatmentPlanService,
    private appointmentService: AppointmentService
  ) {
    this.initializeForms();
  }

  ngOnInit(): void {
    this.initializeForms();
    this.loadPayments();
    this.loadPatients();
  }

  private initializeForms(): void {
    this.paymentForm = this.fb.group({
      patientId: ['', Validators.required],
      totalAmount: [0, [Validators.required, Validators.min(0.01)]],
      discount: [0, [Validators.min(0)]],
      discountType: [DiscountType.None],
      paymentFor: [PaymentFor.TreatmentPlan, Validators.required],
      notes: [''],
      appointmentId: [''],
      treatmentPlanId: [''],
      // Initial transaction fields
      includeInitialTransaction: [false],
      initialAmount: [0, [Validators.min(0.01)]],
      initialMethod: [PaymentMethod.Cash],
      initialNotes: ['']
    });

    this.transactionForm = this.fb.group({
      amount: [0, [Validators.required, Validators.min(0.01)]],
      paymentDate: [new Date().toISOString().split('T')[0], Validators.required],
      method: [PaymentMethod.Cash, Validators.required],
      notes: ['']
    });

    this.editPaymentForm = this.fb.group({
      totalAmount: [0, [Validators.required, Validators.min(0.01)]],
      discount: [0, [Validators.min(0)]],
      discountType: [DiscountType.None],
      notes: [''],
      appointmentId: [''],
      treatmentPlanId: ['']
    });

    // Watch for discount type changes in payment form
    this.paymentForm.get('discountType')?.valueChanges.subscribe(value => {
      if (value === DiscountType.None) {
        this.paymentForm.get('discount')?.setValue(0);
        this.paymentForm.get('discount')?.disable();
      } else {
        this.paymentForm.get('discount')?.enable();
      }
    });

    // Watch for discount type changes in edit payment form
    this.editPaymentForm.get('discountType')?.valueChanges.subscribe(value => {
      if (value === DiscountType.None) {
        this.editPaymentForm.get('discount')?.setValue(0);
        this.editPaymentForm.get('discount')?.disable();
      } else {
        this.editPaymentForm.get('discount')?.enable();
      }
    });
  }

  // Data loading methods
  loadPayments(): void {
    this.isLoading = true;
    this.message = { text: '', type: 'success' };
    
    this.paymentService.getAll().subscribe({
      next: (payments) => {
        if (payments && Array.isArray(payments)) {
          this.payments = payments;
          this.applyFilters();
          this.calculateStats();
          this.message = { text: `تم تحميل ${payments.length} مدفوعة بنجاح`, type: 'success' };
        } else {
          this.payments = [];
          this.message = { text: 'لا توجد مدفوعات متاحة', type: 'error' };
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading payments:', error);
        this.payments = [];
        this.filteredPayments = [];
        
        let errorMessage = 'خطأ في تحميل المدفوعات';
        if (error.status === 0) {
          errorMessage = 'لا يمكن الاتصال بالخادم. تأكد من تشغيل الخادم الخلفي';
        } else if (error.status === 404) {
          errorMessage = 'خدمة المدفوعات غير متاحة';
        } else if (error.status === 500) {
          errorMessage = 'خطأ في الخادم الداخلي';
        } else if (error.error?.message) {
          errorMessage = error.error.message;
        }
        
        this.message = { text: errorMessage, type: 'error' };
        this.isLoading = false;
      }
    });
  }

  loadPatients(): void {
    console.log('Loading patients in payment-management...');
    this.patientService.getAll().subscribe({
      next: (patients) => {
        console.log('Patients loaded successfully:', patients);
        if (patients && Array.isArray(patients)) {
          this.patients = patients;
          this.filteredPatients = patients;
          console.log('filteredPatients initialized:', this.filteredPatients);
        } else {
          console.log('No patients found, initializing empty arrays');
          this.patients = [];
          this.filteredPatients = [];
          console.warn('No patients data received or invalid format');
        }
      },
      error: (error) => {
        console.error('Error loading patients:', error);
        this.patients = [];
        
        let errorMessage = 'خطأ في تحميل المرضى';
        if (error.status === 0) {
          errorMessage = 'لا يمكن الاتصال بخدمة المرضى';
        } else if (error.status === 404) {
          errorMessage = 'خدمة المرضى غير متاحة';
        } else if (error.error?.message) {
          errorMessage = error.error.message;
        }
        
        this.message = { text: errorMessage, type: 'error' };
      }
    });
  }

  loadTreatmentPlans(patientId: number): void {
    if (patientId) {
      // Load only incomplete treatment plans for payment creation
      this.treatmentPlanService.getIncompletePlansByPatientId(patientId).subscribe({
        next: (plans) => {
          if (plans && Array.isArray(plans)) {
            this.treatmentPlans = plans;
            this.filteredTreatmentPlans = plans;
          } else {
            this.treatmentPlans = [];
            this.filteredTreatmentPlans = [];
          }
        },
        error: (error) => {
          console.error('Error loading incomplete treatment plans:', error);
          this.treatmentPlans = [];
          this.filteredTreatmentPlans = [];
          
          // Don't show error message for treatment plans as it's not critical
          if (error.status !== 404) {
            console.warn('خطأ في تحميل خطط العلاج الغير مكتملة للمريض:', patientId);
          }
        }
      });
    } else {
      this.treatmentPlans = [];
      this.filteredTreatmentPlans = [];
    }
  }

  loadAppointments(patientId: number): void {
    if (patientId) {
      // Load only pending appointments for payment creation
      this.appointmentService.getPendingByPatientId(patientId).subscribe({
        next: (appointments) => {
          if (appointments && Array.isArray(appointments)) {
            this.appointments = appointments;
            this.filteredAppointments = appointments;
          } else {
            this.appointments = [];
            this.filteredAppointments = [];
          }
        },
        error: (error) => {
          console.error('Error loading pending appointments:', error);
          this.appointments = [];
          this.filteredAppointments = [];
          
          // Don't show error message for appointments as it's not critical
          if (error.status !== 404) {
            console.warn('خطأ في تحميل المواعيد المعلقة للمريض:', patientId);
          }
        }
      });
    } else {
      this.appointments = [];
      this.filteredAppointments = [];
    }
  }

  onPatientChange(): void {
    const selectedPatientId = this.paymentForm.get('patientId')?.value;
    if (selectedPatientId) {
      this.loadTreatmentPlans(selectedPatientId);
      this.loadAppointments(selectedPatientId);
      // Reset treatment plan and appointment selection when patient changes
      this.paymentForm.patchValue({ 
        treatmentPlanId: '',
        appointmentId: '',
        totalAmount: 0
      });
    } else {
      this.treatmentPlans = [];
      this.filteredTreatmentPlans = [];
      this.appointments = [];
      this.filteredAppointments = [];
      this.paymentForm.patchValue({ totalAmount: 0 });
    }
  }

  onPaymentForChange(): void {
    // Reset selections and amount when payment type changes
    this.paymentForm.patchValue({
      treatmentPlanId: '',
      appointmentId: '',
      totalAmount: 0
    });
  }

  onTreatmentPlanChange(): void {
    const selectedTreatmentPlanId = this.paymentForm.get('treatmentPlanId')?.value;
    if (selectedTreatmentPlanId) {
      const selectedPlan = this.filteredTreatmentPlans.find(plan => plan.id == selectedTreatmentPlanId);
      if (selectedPlan && selectedPlan.estimatedCost) {
        this.paymentForm.patchValue({
          totalAmount: selectedPlan.estimatedCost
        });
      }
    } else {
      this.paymentForm.patchValue({ totalAmount: 0 });
    }
  }

  onAppointmentChange(): void {
    const selectedAppointmentId = this.paymentForm.get('appointmentId')?.value;
    if (selectedAppointmentId) {
      const selectedAppointment = this.filteredAppointments.find(appointment => appointment.id == selectedAppointmentId);
      if (selectedAppointment) {
        // Calculate total price based on services
        this.calculateAppointmentPrice(selectedAppointment);
      }
    } else {
      this.paymentForm.patchValue({ totalAmount: 0 });
    }
  }

  private calculateAppointmentPrice(appointment: any): void {
    if (appointment.serviceNames && appointment.serviceNames.length > 0) {
      // Load services to get prices
      this.appointmentService.getServices().subscribe({
        next: (services) => {
          let totalPrice = 0;
          appointment.serviceNames.forEach((serviceName: string) => {
            const service = services.find(s => s.name === serviceName);
            if (service && service.defaultPrice) {
              totalPrice += service.defaultPrice;
            }
          });
          this.paymentForm.patchValue({
            totalAmount: totalPrice
          });
        },
        error: (error) => {
          console.error('Error loading services for price calculation:', error);
          this.paymentForm.patchValue({ totalAmount: 0 });
        }
      });
    } else {
      this.paymentForm.patchValue({ totalAmount: 0 });
    }
  }

  get isTotalAmountReadonly(): boolean {
    const paymentFor = this.paymentForm.get('paymentFor')?.value;
    return paymentFor === PaymentFor.TreatmentPlan || paymentFor === PaymentFor.Appointment;
  }

  loadPaymentTransactions(paymentId: number): void {
    this.transactionService.getByPaymentId(paymentId).subscribe({
      next: (transactions) => {
        this.selectedPaymentTransactions = transactions;
      },
      error: (error) => {
        console.error('Error loading transactions:', error);
        this.transactionMessage = { text: 'خطأ في تحميل معاملات الدفع', type: 'error' };
      }
    });
  }

  // Payment CRUD operations
  createPayment(): void {
    if (this.paymentForm.valid) {
      this.isLoading = true;
      const formValue = this.paymentForm.value;
      
      const paymentData: PaymentCreateDto = {
        patientId: parseInt(formValue.patientId),
        totalAmount: formValue.totalAmount,
        discount: formValue.discount || 0,
        discountType: formValue.discountType,
        paymentFor: formValue.paymentFor,
        notes: formValue.notes,
        appointmentId: formValue.appointmentId ? parseInt(formValue.appointmentId) : undefined,
        treatmentPlanId: formValue.treatmentPlanId ? parseInt(formValue.treatmentPlanId) : undefined
      };

      // Add initial transaction if requested
      if (formValue.includeInitialTransaction && formValue.initialAmount > 0) {
        paymentData.initialTransaction = {
          paymentId: 0, // Will be set by backend
          amount: formValue.initialAmount,
          paymentDate: new Date().toISOString(),
          method: formValue.initialMethod,
          notes: formValue.initialNotes
        };
      }

      this.paymentService.create(paymentData).subscribe({
        next: (payment) => {
          this.message = { text: 'تم إنشاء الدفعة بنجاح', type: 'success' };
          this.closePaymentModal();
          this.loadPayments();
          this.isLoading = false;
          
          // Clear success message after 3 seconds
          setTimeout(() => {
            this.message = { text: '', type: 'success' };
          }, 3000);
        },
        error: (error) => {
          console.error('Error creating payment:', error);
          this.message = { text: 'خطأ في إنشاء الدفعة', type: 'error' };
          this.isLoading = false;
          
          // Clear error message after 3 seconds
          setTimeout(() => {
            this.message = { text: '', type: 'success' };
          }, 3000);
        }
      });
    }
  }

  updatePayment(): void {
    if (this.editPaymentForm.valid && this.selectedPayment) {
      this.isLoading = true;
      const formValue = this.editPaymentForm.value;
      
      const updateData: PaymentUpdateDto = {
        totalAmount: formValue.totalAmount,
        discount: formValue.discount || 0,
        discountType: formValue.discountType,
        paymentDate: formValue.paymentDate || this.selectedPayment.paymentDate,
        paymentStatus: formValue.paymentStatus || this.selectedPayment.paymentStatus,
        notes: formValue.notes
      };

      this.paymentService.update(this.selectedPayment.id, updateData).subscribe({
        next: () => {
          this.message = { text: 'تم تحديث الدفعة بنجاح', type: 'success' };
          this.closeEditPaymentModal();
          this.loadPayments();
          this.isLoading = false;
          
          // Clear success message after 3 seconds
          setTimeout(() => {
            this.message = { text: '', type: 'success' };
          }, 3000);
        },
        error: (error) => {
          console.error('Error updating payment:', error);
          this.message = { text: 'خطأ في تحديث الدفعة', type: 'error' };
          this.isLoading = false;
          
          // Clear error message after 3 seconds
          setTimeout(() => {
            this.message = { text: '', type: 'success' };
          }, 3000);
        }
      });
    }
  }

  deletePayment(payment: PaymentReadDto): void {
    if (confirm('هل أنت متأكد من حذف هذه الدفعة؟')) {
      this.isLoading = true;
      this.paymentService.delete(payment.id).subscribe({
        next: () => {
          this.message = { text: 'تم حذف الدفعة بنجاح', type: 'success' };
          this.loadPayments();
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error deleting payment:', error);
          this.message = { text: 'خطأ في حذف الدفعة', type: 'error' };
          this.isLoading = false;
        }
      });
    }
  }

  // Transaction operations
  addTransaction(): void {
    if (this.transactionForm.valid && this.selectedPayment) {
      this.isLoading = true;
      const formValue = this.transactionForm.value;
      
      const transactionData: PaymentTransactionCreateDto = {
        paymentId: this.selectedPayment.id,
        amount: formValue.amount,
        paymentDate: new Date(formValue.paymentDate).toISOString(),
        method: formValue.method,
        notes: formValue.notes
      };

      this.transactionService.create(transactionData).subscribe({
        next: (transaction) => {
          this.transactionMessage = { text: 'تم إضافة المعاملة بنجاح', type: 'success' };
          this.loadPaymentTransactions(this.selectedPayment!.id);
          this.loadPayments(); // Refresh to update payment status
          this.transactionForm.reset({
            amount: 0,
            paymentDate: new Date().toISOString().split('T')[0],
            method: PaymentMethod.Cash,
            notes: ''
          });
          this.isLoading = false;
          
          // Clear success message after 3 seconds
          setTimeout(() => {
            this.transactionMessage = { text: '', type: 'success' };
          }, 3000);
        },
        error: (error) => {
          console.error('Error adding transaction:', error);
          this.transactionMessage = { text: 'خطأ في إضافة المعاملة', type: 'error' };
          this.isLoading = false;
          
          // Clear error message after 3 seconds
          setTimeout(() => {
            this.transactionMessage = { text: '', type: 'success' };
          }, 3000);
        }
      });
    }
  }

  deleteTransaction(transaction: PaymentTransactionReadDto): void {
    if (confirm('هل أنت متأكد من حذف هذه المعاملة؟')) {
      this.isLoading = true;
      this.transactionService.delete(transaction.id).subscribe({
        next: () => {
          this.transactionMessage = { text: 'تم حذف المعاملة بنجاح', type: 'success' };
          this.loadPaymentTransactions(this.selectedPayment!.id);
          this.loadPayments(); // Refresh to update payment status
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error deleting transaction:', error);
          this.transactionMessage = { text: 'خطأ في حذف المعاملة', type: 'error' };
          this.isLoading = false;
        }
      });
    }
  }

  // Modal operations
  openPaymentModal(): void {
    this.showPaymentModal = true;
    this.message = { text: '', type: 'success' };
    // Ensure patients are loaded
    if (this.patients.length === 0) {
      this.loadPatients();
    }
    this.paymentForm.reset({
      patientId: '',
      totalAmount: 0,
      discount: 0,
      discountType: DiscountType.None,
      paymentFor: PaymentFor.TreatmentPlan,
      notes: '',
      appointmentId: '',
      treatmentPlanId: '',
      includeInitialTransaction: false,
      initialAmount: 0,
      initialMethod: PaymentMethod.Cash,
      initialNotes: ''
    });
    // Explicitly disable discount field when discount type is None
    this.paymentForm.get('discount')?.disable();
  }

  closePaymentModal(): void {
    this.showPaymentModal = false;
    this.message = { text: '', type: 'success' };
  }

  openEditPaymentModal(payment: PaymentReadDto): void {
    this.selectedPayment = payment;
    this.showEditPaymentModal = true;
    this.message = { text: '', type: 'success' };
    
    this.editPaymentForm.patchValue({
      totalAmount: payment.totalAmount,
      discount: payment.discount,
      discountType: payment.discountType,
      notes: payment.notes,
      appointmentId: payment.appointmentId || '',
      treatmentPlanId: payment.treatmentPlanId || ''
    });
    
    // Enable/disable discount field based on discount type
    if (payment.discountType === DiscountType.None) {
      this.editPaymentForm.get('discount')?.disable();
    } else {
      this.editPaymentForm.get('discount')?.enable();
    }
  }

  closeEditPaymentModal(): void {
    this.showEditPaymentModal = false;
    this.selectedPayment = null;
    this.message = { text: '', type: 'success' };
  }

  openPaymentDetailsModal(payment: PaymentReadDto): void {
    this.selectedPayment = payment;
    this.showPaymentDetailsModal = true;
    this.loadPaymentTransactions(payment.id);
  }

  closePaymentDetailsModal(): void {
    this.showPaymentDetailsModal = false;
    this.selectedPayment = null;
    this.selectedPaymentTransactions = [];
  }

  openTransactionModal(payment: PaymentReadDto): void {
    this.selectedPayment = payment;
    this.showTransactionModal = true;
    this.transactionMessage = { text: '', type: 'success' };
    this.transactionForm.reset({
      amount: 0,
      paymentDate: new Date().toISOString().split('T')[0],
      method: PaymentMethod.Cash,
      notes: ''
    });
  }

  closeTransactionModal(): void {
    this.showTransactionModal = false;
    this.selectedPayment = null;
    this.transactionMessage = { text: '', type: 'success' };
  }

  // Filtering and search
  applyFilters(): void {
    this.filteredPayments = this.payments.filter(payment => {
      const matchesSearch = !this.searchTerm || 
        this.getPatientName(payment.patientId).toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        payment.notes?.toLowerCase().includes(this.searchTerm.toLowerCase());
      
      const matchesStatus = !this.statusFilter || payment.paymentStatus === this.statusFilter;
      const matchesPatient = !this.patientFilter || payment.patientId.toString() === this.patientFilter;
      
      const matchesDateFrom = !this.dateFromFilter || 
        new Date(payment.paymentDate) >= new Date(this.dateFromFilter);
      const matchesDateTo = !this.dateToFilter || 
        new Date(payment.paymentDate) <= new Date(this.dateToFilter + 'T23:59:59.999Z'); // Include end of day

      return matchesSearch && matchesStatus && matchesPatient && matchesDateFrom && matchesDateTo;
    });

    this.updatePagination();
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.statusFilter = '';
    this.methodFilter = '';
    this.patientFilter = '';
    this.dateFromFilter = '';
    this.dateToFilter = '';
    this.applyFilters();
  }

  // Pagination
  updatePagination(): void {
    this.totalPages = Math.ceil(this.filteredPayments.length / this.itemsPerPage);
    this.pages = Array.from({ length: this.totalPages }, (_, i) => i + 1);
    
    if (this.currentPage > this.totalPages) {
      this.currentPage = 1;
    }
  }

  get paginatedPayments(): PaymentReadDto[] {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    return this.filteredPayments.slice(startIndex, endIndex);
  }

  onPageChange(page: number): void {
    this.currentPage = page;
  }

  // Statistics
  calculateStats(): void {
    // Update stats date range description
    this.updateStatsDateRange();
    
    if (!this.filteredPayments || this.filteredPayments.length === 0) {
      this.paymentStats = {
        totalPayments: 0,
        totalAmount: 0,
        paidAmount: 0,
        remainingAmount: 0,
        pendingPayments: 0
      };
      return;
    }

    this.paymentStats = {
      totalPayments: this.filteredPayments.length,
      totalAmount: this.filteredPayments.reduce((sum, p) => sum + (p.totalAmount || 0), 0),
      paidAmount: this.filteredPayments.reduce((sum, p) => sum + (p.paidAmount || 0), 0),
      remainingAmount: this.filteredPayments.reduce((sum, p) => sum + (p.remainingAmount || 0), 0),
      pendingPayments: this.filteredPayments.filter(p => p.paymentStatus !== PaymentStatus.Paid).length
    };
  }

  private updateStatsDateRange(): void {
    this.statsDateRange.from = this.dateFromFilter;
    this.statsDateRange.to = this.dateToFilter;
    
    if (this.dateFromFilter && this.dateToFilter) {
      this.statsDateRange.description = `من ${this.formatDate(this.dateFromFilter)} إلى ${this.formatDate(this.dateToFilter)}`;
    } else if (this.dateFromFilter) {
      this.statsDateRange.description = `من ${this.formatDate(this.dateFromFilter)} حتى الآن`;
    } else if (this.dateToFilter) {
      this.statsDateRange.description = `حتى ${this.formatDate(this.dateToFilter)}`;
    } else {
      this.statsDateRange.description = 'جميع البيانات';
    }
  }

  // Quick date range filters for statistics
  setQuickDateRange(period: string): void {
    const today = new Date();
    const formatDate = (date: Date) => date.toISOString().split('T')[0];
    
    switch (period) {
      case 'today':
        this.dateFromFilter = formatDate(today);
        this.dateToFilter = formatDate(today);
        break;
      case 'thisWeek':
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay());
        this.dateFromFilter = formatDate(startOfWeek);
        this.dateToFilter = formatDate(today);
        break;
      case 'thisMonth':
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        this.dateFromFilter = formatDate(startOfMonth);
        this.dateToFilter = formatDate(today);
        break;
      case 'last30Days':
        const thirtyDaysAgo = new Date(today);
        thirtyDaysAgo.setDate(today.getDate() - 29); // Changed from -30 to -29 to include today
        this.dateFromFilter = formatDate(thirtyDaysAgo);
        this.dateToFilter = formatDate(today);
        break;
      case 'last90Days':
        const ninetyDaysAgo = new Date(today);
        ninetyDaysAgo.setDate(today.getDate() - 89); // Changed from -90 to -89 to include today
        this.dateFromFilter = formatDate(ninetyDaysAgo);
        this.dateToFilter = formatDate(today);
        break;
      case 'thisYear':
        const startOfYear = new Date(today.getFullYear(), 0, 1);
        this.dateFromFilter = formatDate(startOfYear);
        this.dateToFilter = formatDate(today);
        break;
      default:
        this.clearFilters();
        return;
    }
    
    this.applyFilters();
  }

  // Helper methods
  getPatientName(patientId: number): string {
    const patient = this.patients.find(p => p.id === patientId);
    if (!patient) {
      return 'غير معروف';
    }
    
    // إذا كان fullName متاحاً ولا يساوي فارغ، استخدمه
    if (patient.fullName && patient.fullName.trim() !== '') {
      return patient.fullName;
    }
    
    // وإلا قم ببناء الاسم من firstName و lastName
    const firstName = patient.firstName || '';
    const lastName = patient.lastName || '';
    const middleName = patient.middleName || '';
    
    return `${firstName} ${middleName} ${lastName}`.trim() || 'غير معروف';
  }

  getPaymentStatusBadgeClass(status: PaymentStatus): string {
    switch (status) {
      case PaymentStatus.Paid:
        return 'bg-green-100 text-green-800';
      case PaymentStatus.Partial:
        return 'bg-yellow-100 text-yellow-800';
      case PaymentStatus.Unpaid:
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  getPaymentStatusName(status: PaymentStatus): string {
    switch (status) {
      case PaymentStatus.Paid:
        return 'مدفوع';
      case PaymentStatus.Partial:
        return 'مدفوع جزئياً';
      case PaymentStatus.Unpaid:
        return 'معلق';
      default:
        return 'غير محدد';
    }
  }

  getPaymentMethodName(method: PaymentMethod): string {
    switch (method) {
      case PaymentMethod.Cash:
        return 'نقدي';
      case PaymentMethod.Card:
        return 'بطاقة ائتمان';
      case PaymentMethod.BankTransfer:
        return 'تحويل بنكي';
      case PaymentMethod.Installment:
        return 'تقسيط';
      case PaymentMethod.Insurance:
        return 'تأمين';
      default:
        return 'غير محدد';
    }
  }

  getDiscountTypeName(type: DiscountType): string {
    switch (type) {
      case DiscountType.Percentage:
        return 'نسبة مئوية';
      case DiscountType.Fixed:
        return 'مبلغ ثابت';
      case DiscountType.None:
        return 'بدون خصم';
      default:
        return 'غير محدد';
    }
  }

  formatCurrency(amount: number | null | undefined): string {
    if (amount === null || amount === undefined || isNaN(amount)) {
      return '0.00 ج.م';
    }
    return `${amount.toFixed(2)} ج.م`;
  }

  formatDate(dateString: string | null | undefined): string {
    if (!dateString) {
      return 'غير محدد';
    }
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return 'تاريخ غير صحيح';
      }
      return date.toLocaleDateString('ar-EG');
    } catch (error) {
      return 'تاريخ غير صحيح';
    }
  }

  // Helper method for template Math operations
  getMinValue(a: number, b: number): number {
    return Math.min(a, b);
  }

  // Reports methods
  openReportsModal(): void {
    this.showReportsModal = true;
    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    this.reportDateFrom = firstDayOfMonth.toISOString().split('T')[0];
    this.reportDateTo = today.toISOString().split('T')[0];
    this.loadAllReports();
  }

  closeReportsModal(): void {
    this.showReportsModal = false;
    this.clearReportsData();
  }

  loadAllReports(): void {
    if (!this.reportDateFrom || !this.reportDateTo) return;
    
    this.isLoading = true;
    
    // Load payment summary
    this.paymentService.getPaymentSummary(this.reportDateFrom, this.reportDateTo)
      .subscribe({
        next: (data) => this.paymentSummary = data,
        error: (error) => console.error('Error loading payment summary:', error)
      });

    // Load payments by patients
    this.paymentService.getPaymentsByPatients(this.reportDateFrom, this.reportDateTo)
      .subscribe({
        next: (data) => this.paymentsByPatients = data,
        error: (error) => console.error('Error loading payments by patients:', error)
      });

    // Load transactions report
    this.paymentService.getTransactionsReport(this.reportDateFrom, this.reportDateTo)
      .subscribe({
        next: (data) => this.transactionsReport = data,
        error: (error) => console.error('Error loading transactions report:', error)
      });

    // Load revenue by payment method
    this.paymentService.getRevenueByPaymentMethod(this.reportDateFrom, this.reportDateTo)
      .subscribe({
        next: (data) => this.revenueByMethod = data,
        error: (error) => console.error('Error loading revenue by method:', error)
      });

    // Load payment status report
    this.paymentService.getPaymentStatusReport(this.reportDateFrom, this.reportDateTo)
      .subscribe({
        next: (data) => this.paymentStatusReport = data,
        error: (error) => console.error('Error loading payment status report:', error)
      });

    // Load outstanding payments
    this.paymentService.getOutstandingPayments(this.reportDateFrom, this.reportDateTo)
      .subscribe({
        next: (data) => {
          this.outstandingPayments = data;
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error loading outstanding payments:', error);
          this.isLoading = false;
        }
      });
  }

  clearReportsData(): void {
    this.paymentSummary = null;
    this.paymentsByPatients = [];
    this.transactionsReport = [];
    this.revenueByMethod = [];
    this.paymentStatusReport = [];
    this.outstandingPayments = [];
  }

  exportReports(): void {
    if (this.isLoading) return;
    
    // Create a new workbook
    const workbook = XLSX.utils.book_new();
    
    // Sheet 1: Summary Report
    if (this.paymentSummary) {
      const summaryData = [
        ['ملخص التقارير المالية'],
        ['الفترة من', this.reportDateFrom || 'غير محدد', 'إلى', this.reportDateTo || 'غير محدد'],
        [''],
        ['البيان', 'القيمة'],
        ['إجمالي المبلغ', this.paymentSummary.totalAmount.toString()],
        ['المبلغ المدفوع', this.paymentSummary.paidAmount.toString()],
        ['المبلغ المتبقي', this.paymentSummary.remainingAmount.toString()],
        ['الخصومات', this.paymentSummary.discounts.toString()],
        ['معدل التحصيل (%)', this.paymentSummary.collectionRate.toString()]
      ];
      const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(workbook, summarySheet, 'الملخص المالي');
    }
    
    // Sheet 2: Revenue by Payment Method
    if (this.revenueByMethod && this.revenueByMethod.length > 0) {
      const revenueData = [
        ['الإيرادات حسب طريقة الدفع'],
        [''],
        ['طريقة الدفع', 'إجمالي الإيرادات', 'النسبة المئوية']
      ];
      this.revenueByMethod.forEach(item => {
        revenueData.push([item.method, item.totalRevenue.toString(), item.percentage.toString() + '%']);
      });
      const revenueSheet = XLSX.utils.aoa_to_sheet(revenueData);
      XLSX.utils.book_append_sheet(workbook, revenueSheet, 'الإيرادات حسب الطريقة');
    }
    
    // Sheet 3: Payment Status Report
    if (this.paymentStatusReport && this.paymentStatusReport.length > 0) {
      const statusData = [
        ['تقرير حالة الدفعات'],
        [''],
        ['الحالة', 'العدد', 'النسبة المئوية']
      ];
      this.paymentStatusReport.forEach(item => {
        statusData.push([item.status, item.count.toString(), item.percentage.toString() + '%']);
      });
      const statusSheet = XLSX.utils.aoa_to_sheet(statusData);
      XLSX.utils.book_append_sheet(workbook, statusSheet, 'حالة الدفعات');
    }
    
    // Sheet 4: Outstanding Payments
    if (this.outstandingPayments && this.outstandingPayments.length > 0) {
      const outstandingData = [
        ['الدفعات المعلقة'],
        [''],
        ['اسم المريض', 'إجمالي المبلغ', 'المبلغ المدفوع', 'المبلغ المتبقي', 'تاريخ الدفع']
      ];
      this.outstandingPayments.forEach(item => {
        outstandingData.push([
          item.patientName,
          item.totalAmount.toString(),
          item.paidAmount.toString(),
          item.remaining.toString(),
          new Date(item.paymentDate).toLocaleDateString('ar-EG')
        ]);
      });
      const outstandingSheet = XLSX.utils.aoa_to_sheet(outstandingData);
      XLSX.utils.book_append_sheet(workbook, outstandingSheet, 'الدفعات المعلقة');
    }
    
    // Sheet 5: Payments by Patients
    if (this.paymentsByPatients && this.paymentsByPatients.length > 0) {
      const patientsData = [
        ['الدفعات حسب المرضى'],
        [''],
        ['اسم المريض', 'عدد الدفعات', 'إجمالي المبلغ', 'المبلغ المدفوع', 'الخصم', 'المتبقي']
      ];
      this.paymentsByPatients.forEach(item => {
        patientsData.push([
          item.patientName,
          item.paymentsCount.toString(),
          item.totalAmount.toString(),
          item.paidAmount.toString(),
          item.discount.toString(),
          item.remaining.toString()
        ]);
      });
      const patientsSheet = XLSX.utils.aoa_to_sheet(patientsData);
      XLSX.utils.book_append_sheet(workbook, patientsSheet, 'الدفعات حسب المرضى');
    }
    
    // Sheet 6: Transactions Report
    if (this.transactionsReport && this.transactionsReport.length > 0) {
      const transactionsData = [
        ['تقرير المعاملات'],
        [''],
        ['تاريخ الدفع', 'المبلغ', 'طريقة الدفع', 'الملاحظات']
      ];
      this.transactionsReport.forEach(item => {
        transactionsData.push([
          new Date(item.paymentDate).toLocaleDateString('ar-EG'),
          item.amount.toString(),
          item.method,
          item.notes || ''
        ]);
      });
      const transactionsSheet = XLSX.utils.aoa_to_sheet(transactionsData);
      XLSX.utils.book_append_sheet(workbook, transactionsSheet, 'تقرير المعاملات');
    }
    
    // Generate Excel file and download
    const dateStr = new Date().toISOString().split('T')[0];
    const fileName = `payment_reports_${dateStr}.xlsx`;
    XLSX.writeFile(workbook, fileName);
    
    // Show success message
    this.message = { text: 'تم تصدير التقارير كملف Excel بنجاح', type: 'success' };
    
    // Auto-hide message after 3 seconds
    setTimeout(() => {
      this.message = { text: '', type: 'success' };
    }, 3000);
  }



  getPaymentForName(paymentFor: PaymentFor): string {
    switch (paymentFor) {
      case PaymentFor.Appointment:
        return 'موعد';
      case PaymentFor.TreatmentPlan:
        return 'خطة علاج';
      default:
        return 'غير محدد';
    }
  }

  // Advanced Features Methods
  
  toggleAdvancedFilters(): void {
    this.showAdvancedFilters = !this.showAdvancedFilters;
  }

  toggleStatsCards(): void {
    this.showStatsCards = !this.showStatsCards;
  }

  toggleBulkActions(): void {
    this.showBulkActions = !this.showBulkActions;
    if (!this.showBulkActions) {
      this.selectedPayments.clear();
    }
  }

  togglePaymentSelection(paymentId: number): void {
    if (this.selectedPayments.has(paymentId)) {
      this.selectedPayments.delete(paymentId);
    } else {
      this.selectedPayments.add(paymentId);
    }
  }

  selectAllPayments(): void {
    if (this.selectedPayments.size === this.filteredPayments.length) {
      this.selectedPayments.clear();
    } else {
      this.filteredPayments.forEach(payment => {
        this.selectedPayments.add(payment.id);
      });
    }
  }

  executeBulkAction(): void {
    if (this.selectedPayments.size === 0 || !this.bulkActionType) {
      return;
    }

    const paymentIds = Array.from(this.selectedPayments);
    
    switch (this.bulkActionType) {
      case 'delete':
        this.bulkDeletePayments(paymentIds);
        break;
      case 'export':
        this.bulkExportPayments(paymentIds);
        break;
    }
  }



  private bulkDeletePayments(paymentIds: number[]): void {
    if (confirm(`هل أنت متأكد من حذف ${paymentIds.length} دفعة؟`)) {
      this.isLoading = true;
      // Sequential deletion - could be optimized with bulk delete API
      const deletePromises = paymentIds.map(id => 
        this.paymentService.delete(id).toPromise()
      );
      
      Promise.all(deletePromises).then(() => {
        this.message = { text: `تم حذف ${paymentIds.length} دفعة بنجاح`, type: 'success' };
        this.loadPayments();
        this.selectedPayments.clear();
        this.isLoading = false;
      }).catch(error => {
        console.error('Error bulk deleting payments:', error);
        this.message = { text: 'خطأ في حذف الدفعات', type: 'error' };
        this.isLoading = false;
      });
    }
  }

  private bulkExportPayments(paymentIds: number[]): void {
    this.showExportModal = true;
  }

  // Export functionality
  openExportModal(): void {
    this.showExportModal = true;
  }

  closeExportModal(): void {
    this.showExportModal = false;
  }

  exportPayments(): void {
    const filters = {
      ...this.filters,
      paymentIds: this.selectedPayments.size > 0 ? Array.from(this.selectedPayments) : undefined
    };

    this.paymentService.exportPayments(this.exportFormat as 'excel' | 'pdf' | 'csv', filters).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `payments_export.${this.exportFormat}`;
        link.click();
        window.URL.revokeObjectURL(url);
        
        // Show success message and close modal
        this.message = { text: 'تم تصدير البيانات بنجاح', type: 'success' };
        this.closeExportModal();
        
        // Clear success message after 3 seconds
        setTimeout(() => {
          this.message = { text: '', type: 'success' };
        }, 3000);
      },
      error: (error) => {
        console.error('Error exporting payments:', error);
        this.message = { text: 'خطأ في تصدير البيانات', type: 'error' };
        
        // Clear error message after 3 seconds
        setTimeout(() => {
          this.message = { text: '', type: 'success' };
        }, 3000);
      }
    });
  }

  // Analytics functionality
  openAnalyticsModal(): void {
    this.showAnalyticsModal = true;
    this.loadAnalytics();
  }

  closeAnalyticsModal(): void {
    this.showAnalyticsModal = false;
    this.analyticsData = null;
  }

  loadAnalytics(): void {
    this.isLoading = true;
    this.paymentService.getPaymentAnalytics(
      this.analyticsPeriod as 'daily' | 'weekly' | 'monthly' | 'yearly',
      this.reportDateFrom,
      this.reportDateTo
    ).subscribe({
      next: (data) => {
        this.analyticsData = data;
        this.message = { text: 'تم تحميل التحليلات بنجاح', type: 'success' };
        this.isLoading = false;
        
        // Clear success message after 3 seconds
        setTimeout(() => {
          this.message = { text: '', type: 'success' };
        }, 3000);
      },
      error: (error) => {
        console.error('Error loading analytics:', error);
        this.message = { text: 'خطأ في تحميل التحليلات', type: 'error' };
        this.isLoading = false;
        
        // Clear error message after 3 seconds
        setTimeout(() => {
          this.message = { text: '', type: 'success' };
        }, 3000);
      }
    });
  }

  // Advanced filtering
  applyAdvancedFilters(): void {
    const advancedFilters = {
      patientId: this.patientFilter ? parseInt(this.patientFilter) : undefined,
      paymentStatus: this.statusFilter || undefined,
      paymentMethod: this.methodFilter ? this.methodFilter as PaymentMethod : undefined,
      startDate: this.dateFromFilter || undefined,
      endDate: this.dateToFilter || undefined,
      minAmount: undefined, // Could be added to form
      maxAmount: undefined, // Could be added to form
      hasOutstanding: undefined // Could be added to form
    };

    this.paymentService.getPaymentsWithAdvancedFilters(advancedFilters).subscribe({
      next: (payments) => {
        this.payments = payments;
        this.filteredPayments = payments;
        this.calculateStats();
        this.updatePagination();
      },
      error: (error) => {
        console.error('Error applying advanced filters:', error);
        this.message = { text: 'خطأ في تطبيق المرشحات', type: 'error' };
      }
    });
  }

  // Payment validation
  validatePaymentAmount(amount: number, patientId: number): void {
    this.paymentService.validatePaymentAmount(amount, patientId).subscribe({
      next: (result) => {
        if (!result.isValid) {
          this.message = { text: result.message || 'مبلغ الدفع غير صحيح', type: 'error' };
        }
      },
      error: (error) => {
        console.error('Error validating payment amount:', error);
      }
    });
  }



  // Utility methods
  get hasSelectedPayments(): boolean {
    return this.selectedPayments.size > 0;
  }

  get allPaymentsSelected(): boolean {
    return this.selectedPayments.size === this.filteredPayments.length && this.filteredPayments.length > 0;
  }

  isPaymentSelected(paymentId: number): boolean {
    return this.selectedPayments.has(paymentId);
  }

  // Advanced patient search methods
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
    this.patientSearchTerm = patient.fullName;
    this.showPatientDropdown = false;
    this.filteredPatients = this.patients;
    this.paymentForm.patchValue({ patientId: patient.id });
    this.onPatientChange(); // Trigger existing patient change logic
  }

  clearPatientSelection(): void {
    this.selectedPatient = null;
    this.patientSearchTerm = '';
    this.showPatientDropdown = false;
    this.filteredPatients = this.patients;
    this.paymentForm.patchValue({ patientId: '' });
  }

  onPatientInputBlur(): void {
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
}