import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { 
  PaymentCreateDto, 
  PaymentReadDto, 
  PaymentUpdateDto, 
  PaymentTransactionCreateDto, 
  PaymentTransactionReadDto,
  PaymentFilters,
  PaymentStats,
  PaymentSummaryReportDto,
  PaymentsByPatientReportDto,
  TransactionReportDto,
  RevenueByPaymentMethodDto,
  PaymentStatusReportDto,
  OutstandingPaymentReportDto,
  PaymentMethod,
  PaymentFor
} from '../models/payment.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class PaymentService {
  private apiUrl = `${environment.apiUrl}/payments`;

  constructor(private http: HttpClient) {}

  // GET: api/payments
  getAll(patientId?: number): Observable<PaymentReadDto[]> {
    let params = new HttpParams();
    if (patientId) {
      params = params.set('patientId', patientId.toString());
    }
    return this.http.get<PaymentReadDto[]>(this.apiUrl, { params });
  }

  // GET: api/payments/{id}
  getById(id: number): Observable<PaymentReadDto> {
    return this.http.get<PaymentReadDto>(`${this.apiUrl}/${id}`);
  }

  // POST: api/payments
  create(payment: PaymentCreateDto): Observable<PaymentReadDto> {
    return this.http.post<PaymentReadDto>(this.apiUrl, payment);
  }

  // PUT: api/payments/{id}
  update(id: number, payment: PaymentUpdateDto): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/${id}`, payment);
  }

  // DELETE: api/payments/{id}
  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  // POST: api/payments/{paymentId}/transactions
  addTransaction(paymentId: number, transaction: PaymentTransactionCreateDto): Observable<PaymentTransactionReadDto> {
    return this.http.post<PaymentTransactionReadDto>(`${this.apiUrl}/${paymentId}/transactions`, transaction);
  }

  // GET: api/payments/{paymentId}/remaining
  getRemainingAmount(paymentId: number): Observable<number> {
    return this.http.get<number>(`${this.apiUrl}/${paymentId}/remaining`);
  }

  // POST: api/payments/{paymentId}/complete
  completePayment(paymentId: number): Observable<string> {
    return this.http.post<string>(`${this.apiUrl}/${paymentId}/complete`, {});
  }

  // Helper methods for filtering and searching
  getFilteredPayments(filters: PaymentFilters): Observable<PaymentReadDto[]> {
    let params = new HttpParams();
    
    if (filters.patientId) {
      params = params.set('patientId', filters.patientId.toString());
    }
    if (filters.paymentStatus) {
      params = params.set('paymentStatus', filters.paymentStatus);
    }
    if (filters.paymentMethod) {
      params = params.set('paymentMethod', filters.paymentMethod);
    }
    if (filters.dateFrom) {
      params = params.set('dateFrom', filters.dateFrom);
    }
    if (filters.dateTo) {
      params = params.set('dateTo', filters.dateTo);
    }
    if (filters.searchTerm) {
      params = params.set('searchTerm', filters.searchTerm);
    }

    return this.http.get<PaymentReadDto[]>(this.apiUrl, { params });
  }

  // Calculate payment statistics
  calculateStats(payments: PaymentReadDto[]): PaymentStats {
    return {
      totalPayments: payments.length,
      totalAmount: payments.reduce((sum, p) => sum + p.totalAmount, 0),
      paidAmount: payments.reduce((sum, p) => sum + p.paidAmount, 0),
      remainingAmount: payments.reduce((sum, p) => sum + p.remainingAmount, 0),
      pendingPayments: payments.filter(p => p.remainingAmount > 0).length
    };
  }

  // Report methods matching backend
  getPaymentSummary(startDate: string, endDate: string): Observable<PaymentSummaryReportDto> {
    let params = new HttpParams()
      .set('startDate', startDate)
      .set('endDate', endDate);
    return this.http.get<PaymentSummaryReportDto>(`${this.apiUrl}/payment-summary`, { params });
  }

  getPaymentsByPatients(startDate: string, endDate: string): Observable<PaymentsByPatientReportDto[]> {
    let params = new HttpParams()
      .set('startDate', startDate)
      .set('endDate', endDate);
    return this.http.get<PaymentsByPatientReportDto[]>(`${this.apiUrl}/payments-by-patients`, { params });
  }

  getTransactionsReport(startDate?: string, endDate?: string, method?: PaymentMethod): Observable<TransactionReportDto[]> {
    let params = new HttpParams();
    if (startDate) params = params.set('startDate', startDate);
    if (endDate) params = params.set('endDate', endDate);
    if (method) params = params.set('method', method);
    return this.http.get<TransactionReportDto[]>(`${this.apiUrl}/transactions`, { params });
  }

  getRevenueByPaymentMethod(startDate?: string, endDate?: string): Observable<RevenueByPaymentMethodDto[]> {
    let params = new HttpParams();
    if (startDate) params = params.set('startDate', startDate);
    if (endDate) params = params.set('endDate', endDate);
    return this.http.get<RevenueByPaymentMethodDto[]>(`${this.apiUrl}/revenue-by-method`, { params });
  }

  getPaymentStatusReport(startDate?: string, endDate?: string): Observable<PaymentStatusReportDto[]> {
    let params = new HttpParams();
    if (startDate) params = params.set('startDate', startDate);
    if (endDate) params = params.set('endDate', endDate);
    return this.http.get<PaymentStatusReportDto[]>(`${this.apiUrl}/payment-status`, { params });
  }

  getOutstandingPayments(startDate?: string, endDate?: string): Observable<OutstandingPaymentReportDto[]> {
    let params = new HttpParams();
    if (startDate) params = params.set('startDate', startDate);
    if (endDate) params = params.set('endDate', endDate);
    return this.http.get<OutstandingPaymentReportDto[]>(`${this.apiUrl}/outstanding-payments`, { params });
  }

  // Additional utility methods for better payment management
  
  // Get payments with advanced filtering (frontend only - not backend endpoint)
  getPaymentsWithAdvancedFilters(filters: {
    patientId?: number;
    paymentStatus?: string;
    paymentMethod?: PaymentMethod;
    startDate?: string;
    endDate?: string;
    minAmount?: number;
    maxAmount?: number;
    hasOutstanding?: boolean;
  }): Observable<PaymentReadDto[]> {
    // Since backend only supports patientId filter, we'll filter on frontend
    return this.getAll(filters.patientId);
  }

  // Note: The following methods are frontend utilities not backed by specific endpoints
  // They can be implemented when backend supports them
  
  // Bulk operations (not implemented in backend yet)
  bulkUpdatePaymentStatus(paymentIds: number[], status: string): Observable<boolean> {
    // This would need backend implementation
    throw new Error('Bulk operations not implemented in backend yet');
  }

  // Payment validation helpers (not implemented in backend yet)
  validatePaymentAmount(amount: number, patientId: number): Observable<{isValid: boolean, message?: string}> {
    // This would need backend implementation
    throw new Error('Payment validation not implemented in backend yet');
  }

  // Export payments to different formats (not implemented in backend yet)
  exportPayments(format: 'excel' | 'pdf' | 'csv', filters?: any): Observable<Blob> {
    // This would need backend implementation
    throw new Error('Export functionality not implemented in backend yet');
  }

  // Get payment analytics (not implemented in backend yet)
  getPaymentAnalytics(period: 'daily' | 'weekly' | 'monthly' | 'yearly', startDate?: string, endDate?: string): Observable<any> {
    // This would need backend implementation
    throw new Error('Analytics not implemented in backend yet');
  }
}