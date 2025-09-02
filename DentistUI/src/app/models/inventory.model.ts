export interface InventoryItem {
  id: number;
  name: string;
  code: string;
  manufacturer: string;
  currentStock: number;
  unit: string;
  unitPrice: number;
  minStockLevel: number;
  maxStockLevel: number;
  status: string;
  lastUpdated: string;
  description?: string;
  location?: string;
  expiryDate?: string;
  categoryId: number;
  categoryName: string;
  totalValue: number;
}

export interface InventoryCategory {
  id: number;
  name: string;
  code: string;
  itemCount: number;
  totalValue: number;
}



export interface InventoryStats {
  totalItems: number;
  lowStockItems: number;
  totalValue: number;
  monthlyGrowth?: number;
  valueGrowth?: number;
}

export interface InventoryFilters {
  searchTerm?: string;
  categoryId?: number;
  status?: string;
  pageNumber: number;
  pageSize: number;
  sortBy?: string;
  sortDirection?: string;
}

export interface InventoryResponse {
  items: InventoryItem[];
  totalCount: number;
}

export interface AddInventoryItemDto {
  name: string;
  code: string;
  manufacturer: string;
  currentStock: number;
  unit: string;
  unitPrice: number;
  minStockLevel: number;
  maxStockLevel: number;
  description?: string;
  location?: string;
  expiryDate?: string;
  categoryId: number;
}

export interface UpdateInventoryItemDto {
  name: string;
  code: string;
  manufacturer: string;
  currentStock?: number;
  unit: string;
  unitPrice: number;
  minStockLevel: number;
  maxStockLevel: number;
  description?: string;
  location?: string;
  expiryDate?: string;
  notes?: string;
  categoryId: number;
}


  


export interface LowStockAlert {
  item: InventoryItem;
  requiredQuantity: number;
  estimatedCost: number;
  urgency: 'high' | 'medium' | 'low';
}

export interface InventoryReport {
  totalItems: number;
  totalValue: number;
  lowStockCount: number;
  outOfStockCount: number;
  monthlyConsumption: number;
  topCategories: CategorySummary[];
  recentActivities: InventoryActivity[];
}

export interface CategorySummary {
  categoryId: number;
  categoryName: string;
  itemCount: number;
  totalValue: number;
}

export interface CreateCategoryDto {
  name: string;
  code: string;
}

export interface UpdateCategoryDto {
  name: string;
  code: string;
}

export interface InventoryActivity {
  id: number;
  type: string;
  quantity: number;
  timestamp: string;
  notes?: string;
  itemId: number;
  itemName: string;
}

// Inventory Activity DTOs to match backend
export interface InventoryActivityDto {
  id: number;
  type: string;
  quantity: number;
  timestamp: string;
  notes?: string;
  itemId: number;
  itemName: string;
}

export interface DailyActivitySummaryDto {
  date: string;
  totalCreate: number;
  totalAdd: number;
  totalConsume: number;
}

// Analytics interfaces
export interface ActivitySummaryByType {
  [key: string]: number; // e.g., { "Add": 150, "Consume": 75, "Create": 25 }
}

export interface ActivitySummaryByItem {
  [key: string]: number; // e.g., { "Dental Floss": 50, "Toothbrush": 30 }
}

export interface ItemStockInfo {
  itemId: number;
  totalAdded: number;
  totalConsumed: number;
  currentStock: number;
}

// Chart data interfaces
export interface ChartDataPoint {
  label: string;
  value: number;
  color?: string;
}

export interface TimeSeriesDataPoint {
  date: string;
  create: number;
  add: number;
  consume: number;
}

// Analytics filters
export interface AnalyticsFilters {
  startDate?: string;
  endDate?: string;
  itemId?: number;
}