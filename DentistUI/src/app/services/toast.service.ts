import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ToastService {
  toast$ = new Subject<{ message: string, type: 'success' | 'error' }>();

  show(message: string, type: 'success' | 'error' = 'success') {
    this.toast$.next({ message, type });
  }
} 