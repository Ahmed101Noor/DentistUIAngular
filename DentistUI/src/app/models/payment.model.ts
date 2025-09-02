// Enums matching backend
export enum PaymentStatus {
  Paid = 'Paid',
  Partial = 'Partial',
  Unpaid = 'Unpaid'
}

export enum PaymentMethod {
  Cash = 'Cash',
  Card = 'Card',
  BankTransfer = 'BankTransfer',
  Installment = 'Installment',
  Insurance = 'Insurance'
}

export enum DiscountType {
  Percentage = 'Percentage',
  Fixed = 'Fixed',
  None = 'None'
}



export enum PaymentFor {
  TreatmentPlan = 'TreatmentPlan',
  Appointment = 'Appointment'
}

// Payment Transaction DTOs
export interface PaymentTransactionCreateDto {
  paymentId: number;
  amount: number;
  paymentDate: string; // ISO string
  method: PaymentMethod;
  notes?: string;
}

export interface PaymentTransactionReadDto {
  id: number;
  paymentId: number;
  amount: number;
  paymentDate: string; // ISO string
  method: PaymentMethod;
  notes?: string;
}

// Payment DTOs
export interface PaymentCreateDto {
  patientId: number;
  totalAmount: number;
  discount?: number;
  discountType?: DiscountType;
  paymentFor: PaymentFor;
  notes?: string;
  appointmentId?: number;
  treatmentPlanId?: number;
  initialTransaction?: PaymentTransactionCreateDto;
}

export interface PaymentReadDto {
  id: number;
  patientId: number;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  discount: number;
  discountType: DiscountType;
  paymentStatus: PaymentStatus;
  paymentDate: string; // ISO string
  notes?: string;
  appointmentId?: number;
  dentalServiceId?: number;
  treatmentPlanId?: number;
  paymentFor: PaymentFor;
  transactions: PaymentTransactionReadDto[];
}

export interface PaymentUpdateDto {
  totalAmount: number;
  discount: number;
  discountType: DiscountType;
  paymentDate: string;
  notes?: string;
  paymentStatus: PaymentStatus;
}

// Helper interfaces for UI
export interface PaymentFilters {
  patientId?: number;
  paymentStatus?: PaymentStatus;
  paymentMethod?: PaymentMethod;
  dateFrom?: string;
  dateTo?: string;
  searchTerm?: string;
}

export interface PaymentStats {
  totalPayments: number;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  pendingPayments: number;
}

// Report DTOs matching backend
export interface PaymentSummaryReportDto {
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  discounts: number;
  collectionRate: number;
}

export interface PaymentsByPatientReportDto {
  patientId: number;
  patientName: string;
  paymentsCount: number;
  totalAmount: number;
  paidAmount: number;
  discount: number;
  remaining: number;
}

export interface TransactionReportDto {
  paymentDate: string;
  amount: number;
  method: PaymentMethod;
  notes?: string;
}

export interface RevenueByPaymentMethodDto {
  method: PaymentMethod;
  totalRevenue: number;
  percentage: number;
}

export interface PaymentStatusReportDto {
  status: string;
  count: number;
  percentage: number;
}

export interface OutstandingPaymentReportDto {
  patientId: number;
  patientName: string;
  totalAmount: number;
  paidAmount: number;
  remaining: number;
  paymentDate: string;
}