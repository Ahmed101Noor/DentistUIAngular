import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { 
  PaymentTransactionCreateDto, 
  PaymentTransactionReadDto 
} from '../models/payment.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class PaymentTransactionService {
  private apiUrl = `${environment.apiUrl}/PaymentTransaction`;

  constructor(private http: HttpClient) {}

  // GET: api/PaymentTransaction/payment/{paymentId}
  getByPaymentId(paymentId: number): Observable<PaymentTransactionReadDto[]> {
    return this.http.get<PaymentTransactionReadDto[]>(`${this.apiUrl}/payment/${paymentId}`);
  }

  // GET: api/PaymentTransaction/{id}
  getById(id: number): Observable<PaymentTransactionReadDto> {
    return this.http.get<PaymentTransactionReadDto>(`${this.apiUrl}/${id}`);
  }

  // POST: api/PaymentTransaction
  create(transaction: PaymentTransactionCreateDto): Observable<PaymentTransactionReadDto> {
    return this.http.post<PaymentTransactionReadDto>(this.apiUrl, transaction);
  }

  // DELETE: api/PaymentTransaction/{id}
  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  // Helper method to calculate total paid amount for a payment
  calculateTotalPaid(transactions: PaymentTransactionReadDto[]): number {
    return transactions.reduce((sum, transaction) => sum + transaction.amount, 0);
  }

  // Helper method to get transactions by payment method
  getTransactionsByMethod(transactions: PaymentTransactionReadDto[], method: string): PaymentTransactionReadDto[] {
    return transactions.filter(t => t.method === method);
  }

  // Helper method to get transactions within date range
  getTransactionsByDateRange(transactions: PaymentTransactionReadDto[], startDate: string, endDate: string): PaymentTransactionReadDto[] {
    return transactions.filter(t => {
      const transactionDate = new Date(t.paymentDate);
      const start = new Date(startDate);
      const end = new Date(endDate);
      return transactionDate >= start && transactionDate <= end;
    });
  }
}