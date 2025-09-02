import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LoadingService } from '../../services/loading.service';

@Component({
  selector: 'app-medical-history',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './medical-history.component.html',
  styleUrls: ['./medical-history.component.css']
})
export class MedicalHistoryComponent implements OnInit {
  // Placeholder for medical history functionality
  // This would be expanded based on requirements

  constructor(private loadingService: LoadingService) {}

  ngOnInit(): void {
    this.loadingService.showForDuration(1000);
  }
} 