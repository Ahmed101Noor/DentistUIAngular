import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { InventoryItem, InventoryCategory, InventoryStats, AddInventoryItemDto, UpdateInventoryItemDto, InventoryFilters, InventoryResponse, InventoryReport } from '../models/inventory.model';
import { environment } from '../../environments/environment';
import { InventoryActivityService } from './inventory-activity.service';

@Injectable({
  providedIn: 'root'
})
export class InventoryService {
  private itemsUrl = `${environment.apiUrl}/items`;
  private categoriesUrl = `${environment.apiUrl}/categories`;

  constructor(
    private http: HttpClient,
    private activityService: InventoryActivityService
  ) { }

  getInventoryStats(): Observable<InventoryStats> {
    return this.http.get<InventoryStats>(`${this.itemsUrl}/stats`);
  }

  getInventoryItems(filters: InventoryFilters): Observable<InventoryResponse> {
    return this.http.post<InventoryResponse>(`${this.itemsUrl}/search`, filters);
  }

  getCategories(): Observable<InventoryCategory[]> {
    return this.http.get<InventoryCategory[]>(this.categoriesUrl);
  }

  addInventoryItem(item: AddInventoryItemDto): Observable<InventoryItem> {
    return this.http.post<InventoryItem>(this.itemsUrl, item);
  }

  updateInventoryItem(id: number, item: UpdateInventoryItemDto): Observable<InventoryItem> {
    return this.http.put<InventoryItem>(`${this.itemsUrl}/${id}`, item);
  }

  deleteInventoryItem(id: number): Observable<void> {
    return this.http.delete<void>(`${this.itemsUrl}/${id}`);
  }

  getLowStockItems(): Observable<InventoryItem[]> {
    return this.http.get<InventoryItem[]>(`${this.itemsUrl}/low-stock`);
  }

  getInventoryReport(): Observable<InventoryReport> {
    return this.http.get<InventoryReport>(`${this.itemsUrl}/reports`);
  }

  searchItems(query: string): Observable<InventoryItem[]> {
    return this.http.post<InventoryItem[]>(`${this.itemsUrl}/search`, { searchTerm: query });
  }

  // Category methods
  addCategory(category: { name: string; code: string }): Observable<InventoryCategory> {
    return this.http.post<InventoryCategory>(this.categoriesUrl, category);
  }

  updateCategory(id: number, category: { name: string; code: string }): Observable<InventoryCategory> {
    return this.http.put<InventoryCategory>(`${this.categoriesUrl}/${id}`, category);
  }

  deleteCategory(id: number): Observable<void> {
    return this.http.delete<void>(`${this.categoriesUrl}/${id}`);
  }

  // Inventory Activity Methods
  consumeInventoryItem(itemId: number, quantity: number, notes?: string): Observable<InventoryItem> {
    const consumeData = { quantity, notes: notes || 'استهلاك خامة' };
    return this.http.post<InventoryItem>(`${this.itemsUrl}/${itemId}/consume`, consumeData);
  }

  // Restock inventory item using dedicated endpoint
  restockInventoryItem(itemId: number, quantity: number, notes?: string): Observable<InventoryItem> {
    const restockData = { quantity, notes: notes || 'إعادة تخزين' };
    return this.http.post<InventoryItem>(`${this.itemsUrl}/${itemId}/restock`, restockData);
  }

  // Adjust inventory item stock
  adjustInventoryItem(itemId: number, newQuantity: number, notes?: string): Observable<InventoryItem> {
    const adjustData = { newQuantity, notes: notes || 'تعديل المخزون' };
    return this.http.post<InventoryItem>(`${this.itemsUrl}/${itemId}/adjust`, adjustData);
  }

  // ===== REPORTS ENDPOINTS =====
  
  // Get comprehensive inventory report
  getComprehensiveInventoryReport(): Observable<any> {
    return this.http.get<any>(`${this.itemsUrl}/reports`);
  }

  // Get inventory statistics for reports
  getInventoryStatsForReports(): Observable<any> {
    return this.http.get<any>(`${this.itemsUrl}/stats`);
  }

  // Get low stock items for reports
  getLowStockItemsForReports(): Observable<any[]> {
    return this.http.get<any[]>(`${this.itemsUrl}/low-stock`);
  }

  // Get item details for reports
  getItemForReports(id: number): Observable<any> {
    return this.http.get<any>(`${this.itemsUrl}/${id}`);
  }

  // Search items with advanced filters for reports
  searchItemsForReports(filters: any): Observable<any> {
    return this.http.post<any>(`${this.itemsUrl}/search`, filters);
  }

  // Get categories with item counts and values for reports
  getCategoriesForReports(): Observable<any[]> {
    return this.http.get<any[]>(this.categoriesUrl);
  }

  // Get category details for reports
  getCategoryForReports(id: number): Observable<any> {
    return this.http.get<any>(`${this.categoriesUrl}/${id}`);
  }
}