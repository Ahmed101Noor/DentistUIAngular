import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class LoadingService {
  private isLoadingSubject = new BehaviorSubject<boolean>(false);
  public isLoading$ = this.isLoadingSubject.asObservable();

  show(): void {
    this.isLoadingSubject.next(true);
  }

  hide(): void {
    this.isLoadingSubject.next(false);
  }

  // Method to show loading for a specific duration
  showForDuration(duration: number = 100): void {
    this.show();
    setTimeout(() => {
      this.hide();
    }, duration);
  }

  showLoading(): void {
    this.show();
  }

  hideLoading(): void {
    this.hide();
  }
}