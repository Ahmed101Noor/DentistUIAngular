import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, forkJoin } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { 
  InventoryActivityDto, 
  DailyActivitySummaryDto, 
  ActivitySummaryByType, 
  ActivitySummaryByItem, 
  ItemStockInfo,
  AnalyticsFilters 
} from '../models/inventory.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class InventoryActivityService {
  private baseUrl = `${environment.apiUrl}/InventoryActivities`;
  private itemsUrl = `${environment.apiUrl}/items`;

  constructor(private http: HttpClient) { }

  // Get activity summary by type (Add, Consume, Create)
  getActivitySummaryByType(filters?: AnalyticsFilters): Observable<ActivitySummaryByType> {
    let params = new HttpParams();
    if (filters?.startDate) {
      params = params.set('start', filters.startDate);
    }
    if (filters?.endDate) {
      params = params.set('end', filters.endDate);
    }
    
    return this.http.get<ActivitySummaryByType>(`${this.baseUrl}/summary/type`, { params });
  }

  // Get daily activity summary
  getDailyActivitySummary(startDate: string, endDate: string): Observable<DailyActivitySummaryDto[]> {
    const params = new HttpParams()
      .set('start', startDate)
      .set('end', endDate);
    
    return this.http.get<DailyActivitySummaryDto[]>(`${this.baseUrl}/summary/daily`, { params });
  }

  // Get total added for specific item
  getTotalAdded(itemId: number, filters?: AnalyticsFilters): Observable<{itemId: number, totalAdded: number}> {
    let params = new HttpParams();
    if (filters?.startDate) {
      params = params.set('start', filters.startDate);
    }
    if (filters?.endDate) {
      params = params.set('end', filters.endDate);
    }
    
    return this.http.get<{itemId: number, totalAdded: number}>(`${this.baseUrl}/total-added/${itemId}`, { params });
  }

  // Get total consumed for specific item
  getTotalConsumed(itemId: number, filters?: AnalyticsFilters): Observable<{itemId: number, totalConsumed: number}> {
    let params = new HttpParams();
    if (filters?.startDate) {
      params = params.set('start', filters.startDate);
    }
    if (filters?.endDate) {
      params = params.set('end', filters.endDate);
    }
    
    return this.http.get<{itemId: number, totalConsumed: number}>(`${this.baseUrl}/total-consumed/${itemId}`, { params });
  }

  // Get current stock for specific item
  getCurrentStock(itemId: number): Observable<{itemId: number, currentStock: number}> {
    return this.http.get<{itemId: number, currentStock: number}>(`${this.baseUrl}/current-stock/${itemId}`);
  }

  // Get activities by date range
  getActivitiesByDateRange(startDate: string, endDate: string): Observable<InventoryActivityDto[]> {
    const params = new HttpParams()
      .set('start', startDate)
      .set('end', endDate);
    
    return this.http.get<InventoryActivityDto[]>(`${this.baseUrl}/by-date-range`, { params });
  }

  // Helper method to get comprehensive item stock info
  getItemStockInfo(itemId: number, filters?: AnalyticsFilters): Observable<ItemStockInfo> {
    return new Observable(observer => {
      // Make parallel requests for all stock information
      const totalAdded$ = this.getTotalAdded(itemId, filters);
      const totalConsumed$ = this.getTotalConsumed(itemId, filters);
      const currentStock$ = this.getCurrentStock(itemId);

      // Combine the results
      Promise.all([
        totalAdded$.toPromise(),
        totalConsumed$.toPromise(),
        currentStock$.toPromise()
      ]).then(([addedResult, consumedResult, stockResult]) => {
        const stockInfo: ItemStockInfo = {
          itemId: itemId,
          totalAdded: addedResult?.totalAdded || 0,
          totalConsumed: consumedResult?.totalConsumed || 0,
          currentStock: stockResult?.currentStock || 0
        };
        observer.next(stockInfo);
        observer.complete();
      }).catch(error => {
        observer.error(error);
      });
    });
  }

  // Get activity summary for dashboard/overview
  getActivityOverview(days: number = 30): Observable<{
    summaryByType: ActivitySummaryByType,
    dailySummary: DailyActivitySummaryDto[],
    totalActivities: number
  }> {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - days);

    const filters: AnalyticsFilters = {
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0]
    };

    return new Observable(observer => {
      Promise.all([
        this.getActivitySummaryByType(filters).toPromise(),
        this.getDailyActivitySummary(filters.startDate!, filters.endDate!).toPromise()
      ]).then(([summaryByType, dailySummary]) => {
        const totalActivities = Object.values(summaryByType || {}).reduce((sum, count) => sum + count, 0);
        
        observer.next({
          summaryByType: summaryByType || {},
          dailySummary: dailySummary || [],
          totalActivities
        });
        observer.complete();
      }).catch(error => {
        observer.error(error);
      });
    });
  }

  // Track a new inventory activity
  trackActivity(activity: {
    itemId: number;
    type: string;
    quantity: number;
    notes?: string;
  }): Observable<InventoryActivityDto> {
    const createDto = {
      itemId: activity.itemId,
      type: activity.type,
      quantity: activity.quantity,
      notes: activity.notes
    };
    return this.http.post<InventoryActivityDto>(this.baseUrl, createDto);
  }

  // ===== NEW ADVANCED ANALYTICS ENDPOINTS =====

  // Get inventory statistics from Items API
  getInventoryStats(): Observable<any> {
    return this.http.get<any>(`${this.itemsUrl}/stats`);
  }

  // Get low stock items from Items API
  getLowStockItems(): Observable<any[]> {
    return this.http.get<any[]>(`${this.itemsUrl}/low-stock`);
  }

  // Get inventory report from Items API
  getInventoryReport(): Observable<any> {
    return this.http.get<any>(`${this.itemsUrl}/reports`);
  }

  // Search items with filters from Items API
  searchItems(filters: any): Observable<any> {
    return this.http.post<any>(`${this.itemsUrl}/search`, filters);
  }

  // Get specific item details from Items API
  getItemDetails(itemId: number): Observable<any> {
    return this.http.get<any>(`${this.itemsUrl}/${itemId}`);
  }

  // Get comprehensive analytics combining multiple endpoints
  getComprehensiveAnalytics(startDate?: string, endDate?: string): Observable<any> {
    const filters: AnalyticsFilters = {};
    if (startDate) filters.startDate = startDate;
    if (endDate) filters.endDate = endDate;
    
    return forkJoin({
      activitySummary: this.getActivitySummaryByType(filters),
      dailySummary: this.getDailyActivitySummary(
        startDate || this.getDateDaysAgo(30), 
        endDate || this.getTodayDate()
      ),
      inventoryStats: this.getInventoryStats(),
      lowStockItems: this.getLowStockItems(),
      inventoryReport: this.getInventoryReport()
    });
  }

  // Get item performance analytics
  getItemPerformanceAnalytics(itemId: number, startDate?: string, endDate?: string): Observable<any> {
    const filters: AnalyticsFilters = {};
    if (startDate) filters.startDate = startDate;
    if (endDate) filters.endDate = endDate;
    
    return forkJoin({
      itemDetails: this.getItemDetails(itemId),
      totalAdded: this.getTotalAdded(itemId, filters),
      totalConsumed: this.getTotalConsumed(itemId, filters),
      currentStock: this.getCurrentStock(itemId)
    });
  }

  // Get top performing items analytics
  getTopPerformingItems(limit: number = 10, startDate?: string, endDate?: string): Observable<any> {
    return this.getActivitiesByDateRange(
      startDate || this.getDateDaysAgo(30), 
      endDate || this.getTodayDate()
    ).pipe(
      map(activities => {
        // Group activities by item and calculate metrics
        const itemMetrics = activities.reduce((acc: any, activity: any) => {
          const itemId = activity.itemId;
          if (!acc[itemId]) {
            acc[itemId] = {
              itemId,
              itemName: activity.itemName,
              totalActivities: 0,
              totalAdded: 0,
              totalConsumed: 0,
              netChange: 0
            };
          }
          
          acc[itemId].totalActivities++;
          if (activity.type === 'Add' || activity.type === 'Create') {
            acc[itemId].totalAdded += activity.quantity;
          } else if (activity.type === 'Consume') {
            acc[itemId].totalConsumed += activity.quantity;
          }
          acc[itemId].netChange = acc[itemId].totalAdded - acc[itemId].totalConsumed;
          
          return acc;
        }, {});
        
        // Convert to array and sort by total activities
        return Object.values(itemMetrics)
          .sort((a: any, b: any) => b.totalActivities - a.totalActivities)
          .slice(0, limit);
      })
    );
  }

  // Get activity trends analytics
  getActivityTrends(days: number = 30): Observable<any> {
    const endDate = this.getTodayDate();
    const startDate = this.getDateDaysAgo(days);
    
    return this.getDailyActivitySummary(startDate, endDate).pipe(
      map(dailyData => {
        // Calculate trends and growth rates
        const trends = {
          totalDays: days,
          averageDaily: {
            creates: 0,
            adds: 0,
            consumes: 0
          },
          growthRates: {
            creates: 0,
            adds: 0,
            consumes: 0
          },
          peakDays: {
            creates: null,
            adds: null,
            consumes: null
          }
        };
        
        if (dailyData && dailyData.length > 0) {
          // Calculate averages
          const totals = dailyData.reduce((acc: any, day: any) => {
            acc.creates += day.totalCreates || 0;
            acc.adds += day.totalAdds || 0;
            acc.consumes += day.totalConsumes || 0;
            return acc;
          }, { creates: 0, adds: 0, consumes: 0 });
          
          trends.averageDaily.creates = totals.creates / dailyData.length;
          trends.averageDaily.adds = totals.adds / dailyData.length;
          trends.averageDaily.consumes = totals.consumes / dailyData.length;
          
          // Find peak days
          trends.peakDays.creates = dailyData.reduce((max: any, day: any) => 
            (day.totalCreates || 0) > (max?.totalCreates || 0) ? day : max, null);
          trends.peakDays.adds = dailyData.reduce((max: any, day: any) => 
            (day.totalAdds || 0) > (max?.totalAdds || 0) ? day : max, null);
          trends.peakDays.consumes = dailyData.reduce((max: any, day: any) => 
            (day.totalConsumes || 0) > (max?.totalConsumes || 0) ? day : max, null);
        }
        
        return trends;
      })
    );
  }

  // Get stock level analytics
  getStockLevelAnalytics(): Observable<any> {
    return forkJoin({
      inventoryStats: this.getInventoryStats(),
      lowStockItems: this.getLowStockItems(),
      inventoryReport: this.getInventoryReport()
    }).pipe(
      map(({ inventoryStats, lowStockItems, inventoryReport }) => {
        return {
          totalItems: inventoryStats?.totalItems || 0,
          totalValue: inventoryStats?.totalValue || 0,
          lowStockCount: lowStockItems?.length || 0,
          outOfStockCount: inventoryStats?.outOfStockCount || 0,
          averageStockLevel: inventoryStats?.averageStockLevel || 0,
          lowStockItems: lowStockItems || [],
          categoryBreakdown: inventoryReport?.categoryBreakdown || [],
          stockDistribution: {
            healthy: (inventoryStats?.totalItems || 0) - (lowStockItems?.length || 0) - (inventoryStats?.outOfStockCount || 0),
            lowStock: lowStockItems?.length || 0,
            outOfStock: inventoryStats?.outOfStockCount || 0
          }
        };
      })
    );
  }

  // Get consumption patterns analytics
  getConsumptionPatterns(days: number = 30): Observable<any> {
    const endDate = this.getTodayDate();
    const startDate = this.getDateDaysAgo(days);
    
    return this.getActivitiesByDateRange(startDate, endDate).pipe(
      map(activities => {
        const consumeActivities = activities.filter(a => a.type === 'Consume');
        
        // Group by day of week
        const dayOfWeekPattern = consumeActivities.reduce((acc: any, activity: any) => {
          const dayOfWeek = new Date(activity.activityDate).getDay();
          const dayName = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'][dayOfWeek];
          
          if (!acc[dayName]) {
            acc[dayName] = { count: 0, quantity: 0 };
          }
          acc[dayName].count++;
          acc[dayName].quantity += activity.quantity;
          
          return acc;
        }, {});
        
        // Group by hour of day
        const hourlyPattern = consumeActivities.reduce((acc: any, activity: any) => {
          const hour = new Date(activity.activityDate).getHours();
          
          if (!acc[hour]) {
            acc[hour] = { count: 0, quantity: 0 };
          }
          acc[hour].count++;
          acc[hour].quantity += activity.quantity;
          
          return acc;
        }, {});
        
        return {
          totalConsumptions: consumeActivities.length,
          totalQuantityConsumed: consumeActivities.reduce((sum, a) => sum + a.quantity, 0),
          averageConsumptionPerDay: consumeActivities.length / days,
          dayOfWeekPattern,
          hourlyPattern,
          peakConsumptionDay: Object.entries(dayOfWeekPattern)
            .sort(([,a]: any, [,b]: any) => b.quantity - a.quantity)[0]?.[0] || 'لا يوجد',
          peakConsumptionHour: Object.entries(hourlyPattern)
            .sort(([,a]: any, [,b]: any) => b.quantity - a.quantity)[0]?.[0] || 'لا يوجد'
        };
      })
    );
  }

  // Helper method to get date days ago
  private getDateDaysAgo(days: number): string {
    const date = new Date();
    date.setDate(date.getDate() - days);
    return date.toISOString().split('T')[0];
  }

  // Helper method to get today's date
  private getTodayDate(): string {
    return new Date().toISOString().split('T')[0];
  }

  // ===== REPORTS SPECIFIC ENDPOINTS =====

  // Get activity summary by type for reports
  getActivitySummaryByTypeForReports(startDate?: string, endDate?: string): Observable<any> {
    let params = new HttpParams();
    if (startDate) params = params.set('start', startDate);
    if (endDate) params = params.set('end', endDate);
    

    
    return this.http.get<any>(`${this.baseUrl}/summary/type`, { params }).pipe(
      tap(data => {

        
        // Transform API response to match expected format
        if (data && (data.Add !== undefined || data.Consume !== undefined || data.Create !== undefined)) {
          data.totalAdd = data.Add || 0;
          data.totalConsume = data.Consume || 0;
          data.totalCreate = data.Create || 0;

        }
        
        // Check if data is empty or null

        
        // Check if all values are zero
        const allZero = (data?.totalAdd || 0) === 0 && 
                       (data?.totalConsume || 0) === 0 && 
                       (data?.totalCreate || 0) === 0;

      }),
      tap({
        error: (error) => {}
      })
    );
  }

  // Get daily activity summary for reports
  getDailyActivitySummaryForReports(startDate: string, endDate: string): Observable<any[]> {
    const params = new HttpParams()
      .set('start', startDate)
      .set('end', endDate);
    
    return this.http.get<any[]>(`${this.baseUrl}/summary/daily`, { params });
  }

  // Get activities by date range for reports
  getActivitiesByDateRangeForReports(startDate: string, endDate: string): Observable<any[]> {
    const params = new HttpParams()
      .set('start', startDate)
      .set('end', endDate);
    
    return this.http.get<any[]>(`${this.baseUrl}/by-date-range`, { params });
  }

  // Get total added for specific item for reports
  getTotalAddedForReports(itemId: number, startDate?: string, endDate?: string): Observable<any> {
    let params = new HttpParams();
    if (startDate) params = params.set('start', startDate);
    if (endDate) params = params.set('end', endDate);
    
    return this.http.get<any>(`${this.baseUrl}/total-added/${itemId}`, { params });
  }

  // Get total consumed for specific item for reports
  getTotalConsumedForReports(itemId: number, startDate?: string, endDate?: string): Observable<any> {
    let params = new HttpParams();
    if (startDate) params = params.set('start', startDate);
    if (endDate) params = params.set('end', endDate);
    
    return this.http.get<any>(`${this.baseUrl}/total-consumed/${itemId}`, { params });
  }

  // Get current stock for specific item for reports
  getCurrentStockForReports(itemId: number): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/current-stock/${itemId}`);
  }

  // Get comprehensive reports data combining multiple endpoints
  getComprehensiveReportsData(startDate?: string, endDate?: string): Observable<any> {
    const defaultEndDate = this.getTodayDate();
    const defaultStartDate = this.getDateDaysAgo(30);
    
    const actualStartDate = startDate || defaultStartDate;
    const actualEndDate = endDate || defaultEndDate;

    return forkJoin({
      activitySummaryByType: this.getActivitySummaryByTypeForReports(actualStartDate, actualEndDate),
      dailyActivitySummary: this.getDailyActivitySummaryForReports(actualStartDate, actualEndDate),
      activitiesByDateRange: this.getActivitiesByDateRangeForReports(actualStartDate, actualEndDate),
      inventoryStats: this.getInventoryStats(),
      lowStockItems: this.getLowStockItems(),
      inventoryReport: this.getInventoryReport()
    });
  }

  // Get item performance report
  getItemPerformanceReport(itemId: number, startDate?: string, endDate?: string): Observable<any> {
    return forkJoin({
      itemDetails: this.getItemDetails(itemId),
      totalAdded: this.getTotalAddedForReports(itemId, startDate, endDate),
      totalConsumed: this.getTotalConsumedForReports(itemId, startDate, endDate),
      currentStock: this.getCurrentStockForReports(itemId)
    });
  }

  // Get activity trends report
  getActivityTrendsReport(days: number = 30): Observable<any> {
    const endDate = this.getTodayDate();
    const startDate = this.getDateDaysAgo(days);
    
    return this.getDailyActivitySummaryForReports(startDate, endDate).pipe(
      map(dailyData => {
        const trends = {
          totalDays: days,
          averageDaily: { creates: 0, adds: 0, consumes: 0 },
          totalActivities: { creates: 0, adds: 0, consumes: 0 },
          peakDays: { creates: null, adds: null, consumes: null },
          growthRate: { creates: 0, adds: 0, consumes: 0 }
        };
        
        if (dailyData && dailyData.length > 0) {
          const totals = dailyData.reduce((acc: any, day: any) => {
            acc.creates += day.totalCreate || 0;
            acc.adds += day.totalAdd || 0;
            acc.consumes += day.totalConsume || 0;
            return acc;
          }, { creates: 0, adds: 0, consumes: 0 });
          
          trends.totalActivities = totals;
          trends.averageDaily.creates = totals.creates / dailyData.length;
          trends.averageDaily.adds = totals.adds / dailyData.length;
          trends.averageDaily.consumes = totals.consumes / dailyData.length;
          
          trends.peakDays.creates = dailyData.reduce((max: any, day: any) => 
            (day.totalCreate || 0) > (max?.totalCreate || 0) ? day : max, null);
          trends.peakDays.adds = dailyData.reduce((max: any, day: any) => 
            (day.totalAdd || 0) > (max?.totalAdd || 0) ? day : max, null);
          trends.peakDays.consumes = dailyData.reduce((max: any, day: any) => 
            (day.totalConsume || 0) > (max?.totalConsume || 0) ? day : max, null);
        }
        
        return trends;
      })
    );
  }

  // Get monthly comparison report
  getMonthlyComparisonReport(endDate?: string): Observable<any> {
    const actualEndDate = endDate || this.getTodayDate();
    const currentDate = new Date(actualEndDate);
    const currentMonthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).toISOString().split('T')[0];
    const currentMonthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).toISOString().split('T')[0];
    
    const previousMonthStart = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1).toISOString().split('T')[0];
    const previousMonthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth(), 0).toISOString().split('T')[0];

    return forkJoin({
      currentMonth: this.getActivitySummaryByTypeForReports(currentMonthStart, currentMonthEnd),
      previousMonth: this.getActivitySummaryByTypeForReports(previousMonthStart, previousMonthEnd)
    }).pipe(
      map(({ currentMonth, previousMonth }) => {
        const comparison = {
          currentMonth: currentMonth || {},
          previousMonth: previousMonth || {},
          growthRates: {} as any
        };
        
        // Calculate growth rates
        Object.keys(currentMonth || {}).forEach(key => {
          const current = currentMonth[key] || 0;
          const previous = previousMonth[key] || 0;
          comparison.growthRates[key] = previous > 0 ? ((current - previous) / previous) * 100 : 0;
        });
        
        return comparison;
      })
    );
  }

  // Get detailed item activities report
  getDetailedItemActivitiesReport(startDate?: string, endDate?: string): Observable<any[]> {
    const actualStartDate = startDate || this.getDateDaysAgo(30);
    const actualEndDate = endDate || this.getTodayDate();
    
    return this.getActivitiesByDateRangeForReports(actualStartDate, actualEndDate).pipe(
      map(activities => {
        // Group activities by item
        const itemActivities = activities.reduce((acc: any, activity: any) => {
          const itemId = activity.itemId;
          if (!acc[itemId]) {
            acc[itemId] = {
              itemId: itemId,
              itemName: activity.itemName || `خامة ${itemId}`,
              itemCode: activity.itemCode || '',
              unit: activity.unit || '',
              categoryName: activity.categoryName || 'غير محدد',
              totalActivities: 0,
              totalAdded: 0,
              totalConsumed: 0,
              totalCreated: 0,
              netChange: 0,
              activities: []
            };
          }
          
          acc[itemId].totalActivities++;
          acc[itemId].activities.push({
            date: activity.activityDate,
            type: activity.type,
            quantity: activity.quantity,
            notes: activity.notes
          });
          
          const quantity = activity.quantity || 0;
          const activityType = activity.type?.toLowerCase() || '';
          
          // تصنيف مرن لأنواع الأنشطة
          if (activityType === 'add' || activityType === 'إضافة' || activityType === 'اضافة') {
            acc[itemId].totalAdded += quantity;
          } else if (activityType === 'consume' || activityType === 'استهلاك' || activityType === 'استهلك') {
            acc[itemId].totalConsumed += quantity;
          } else if (activityType === 'create' || activityType === 'إنشاء' || activityType === 'انشاء') {
            acc[itemId].totalCreated += quantity;
          } else if (activityType === 'adjust' || activityType === 'adjustment' || activityType === 'تعديل') {
            // التعديل يمكن أن يكون إيجابي أو سلبي
            if (quantity > 0) {
              acc[itemId].totalAdded += quantity;
            } else {
              acc[itemId].totalConsumed += Math.abs(quantity);
            }
          }
          
          acc[itemId].netChange = (acc[itemId].totalAdded + acc[itemId].totalCreated) - acc[itemId].totalConsumed;
          
          return acc;
        }, {});
        
        // Convert to array and sort by total activities
        return Object.values(itemActivities)
          .sort((a: any, b: any) => b.totalActivities - a.totalActivities);
      })
    );
  }
}