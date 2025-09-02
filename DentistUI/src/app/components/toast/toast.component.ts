import { Component, OnInit } from '@angular/core';
import { ToastService } from '../../services/toast.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div *ngIf="show" [ngClass]="toastClass" class="fixed bottom-4 right-4 z-50 px-4 py-2 rounded shadow-lg transition-all">
      {{ message }}
    </div>
  `,
  styles: [`
    .toast-success { background: #d1fae5; color: #065f46; }
    .toast-error { background: #fee2e2; color: #991b1b; }
  `]
})
export class ToastComponent implements OnInit {
  show = false;
  message = '';
  toastClass = 'toast-success';

  constructor(private toastService: ToastService) {}

  ngOnInit() {
    this.toastService.toast$.subscribe(({ message, type }) => {
      this.message = message;
      this.toastClass = type === 'success' ? 'toast-success' : 'toast-error';
      this.show = true;
      setTimeout(() => this.show = false, 5000);
    });
  }
} 