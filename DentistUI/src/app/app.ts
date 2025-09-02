import { Component, OnInit } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { LoadingService } from './services/loading.service';
import { LoadingSpinnerComponent } from './components/loading-spinner/loading-spinner.component';
import { ToastComponent } from './components/toast/toast.component';
import { LOCALE_ID } from '@angular/core';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, LoadingSpinnerComponent, ToastComponent],
  templateUrl: './app.html',
  styleUrl: './app.css',
  providers: [
    { provide: LOCALE_ID, useValue: 'ar' }
  ]
})
export class App implements OnInit {
  title = 'DentistUI';
  isLoading = false;

  constructor(private loadingService: LoadingService) {}

  ngOnInit(): void {
    this.loadingService.isLoading$.subscribe(
      loading => this.isLoading = loading
    );
  }
}
