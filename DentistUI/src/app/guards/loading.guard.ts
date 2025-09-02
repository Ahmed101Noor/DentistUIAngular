import { Injectable } from '@angular/core';
import { CanActivate, CanDeactivate, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { LoadingService } from '../services/loading.service';

@Injectable({
  providedIn: 'root'
})
export class LoadingGuard implements CanActivate, CanDeactivate<any> {
  
  constructor(private loadingService: LoadingService) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    this.loadingService.showForDuration(800); // Show loading for 800ms during navigation
    return true;
  }

  canDeactivate(component: any, currentRoute: ActivatedRouteSnapshot, currentState: RouterStateSnapshot, nextState?: RouterStateSnapshot): boolean {
    this.loadingService.showForDuration(500); // Show loading for 500ms when leaving
    return true;
  }
} 