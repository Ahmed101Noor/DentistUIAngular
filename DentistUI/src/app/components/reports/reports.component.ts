import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LoadingService } from '../../services/loading.service';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './reports.component.html',
  styleUrls: ['./reports.component.css']
})
export class ReportsComponent implements OnInit {
  // Placeholder for reports functionality
  // This would be expanded based on requirements

  constructor(private loadingService: LoadingService) {}

  ngOnInit(): void {
    this.loadingService.showForDuration(1000);
  }
} 