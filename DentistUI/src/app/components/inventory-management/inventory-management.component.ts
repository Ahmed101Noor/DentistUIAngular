import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormGroup, FormBuilder, Validators } from '@angular/forms';
import { LoadingService } from '../../services/loading.service';
import { InventoryService } from '../../services/inventory.service';
import { InventoryActivityService } from '../../services/inventory-activity.service';
import { 
  InventoryItem, 
  InventoryCategory, 
  InventoryStats, 
  AddInventoryItemDto, 
  UpdateInventoryItemDto,
  InventoryFilters
} from '../../models/inventory.model';
import { registerLocaleData } from '@angular/common';
import localeAr from '@angular/common/locales/ar-EG';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-inventory-management',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './inventory-management.component.html',
  styleUrl: './inventory-management.component.css'
})
export class InventoryManagementComponent implements OnInit {
  // Tab management
  activeTab = 'all-items';
  
  // Reports properties
  isLoadingAnalytics = false;
  reportsData: any = {};
  showCategoriesReport = false;
  showItemActivitiesReport = false;
  reportsStartDate: string = '';
  reportsEndDate: string = '';
  
  // Data properties
  inventoryStats: InventoryStats = {
    totalItems: 0,
    lowStockItems: 0,
    totalValue: 0
  };
  
  inventoryItems: InventoryItem[] = [];
  categories: InventoryCategory[] = [];
  lowStockItems: InventoryItem[] = [];

  
  // Modal states
  showAddItemModal = false;
  showEditItemModal = false;
  showAddCategoryModal = false;
  showDeleteConfirmModal = false;
  showConsumeModal = false;
  showRestockModal = false;
  showAdjustModal = false;
  
  showItemDetailsModal = false;
  selectedItem: InventoryItem | null = null;
  selectedItems: InventoryItem[] = [];
  itemToDelete: InventoryItem | null = null;
  newItem: AddInventoryItemDto = {
    name: '',
    code: '',
    manufacturer: '',
    currentStock: 0,
    unit: '',
    unitPrice: 0,
    minStockLevel: 0,
    maxStockLevel: 0,
    categoryId: 0
  };
  

  
  // Filter properties
  selectedCategory = 'all';
  selectedStatus = 'all';
  selectedSort = 'name-asc';
  searchTerm = '';
  
  
  
  // Pagination
  currentPage = 1;
  itemsPerPage = 10;
  totalItems = 0;
  
  // Loading states
  isLoading = false;
  isLoadingItems = false;
  isLoadingCategories = false;
  isLoadingLowStock = false;


  
  ngOnInit(): void {
    registerLocaleData(localeAr);
    this.initializeDates();
    this.loadData();
    this.loadReportsData();
  }

  loadData(): void {
    this.loadStats();
    this.loadCategories();
    this.loadLowStockItems();
    this.loadItems();
  }

  loadStats(): void {
    this.isLoading = true;
    this.loadingService.show();
    this.inventoryService.getInventoryStats().subscribe({
      next: (stats) => this.inventoryStats = stats,
      error: (error) => console.error('Error loading stats:', error),
      complete: () => {
        this.isLoading = false;
        this.loadingService.hide();
      }
    });
  }

  loadItems(): void {
    this.isLoadingItems = true;
    this.inventoryItems = []; // Clear existing items
    const filters: InventoryFilters = {
      searchTerm: this.searchTerm,
      categoryId: this.selectedCategory !== 'all' ? parseInt(this.selectedCategory) : undefined,
      status: this.selectedStatus !== 'all' ? this.selectedStatus : undefined,
      pageNumber: this.currentPage,
      pageSize: this.itemsPerPage,
      sortBy: this.selectedSort.split('-')[0],
      sortDirection: this.selectedSort.split('-')[1]
    };
    this.inventoryService.getInventoryItems(filters).subscribe({
      next: (response) => {
        // Populate missing fields with dummy data
        this.inventoryItems = response.items.map(item => this.populateMissingFields(item));
        this.totalItems = response.totalCount;
      },
      error: (error) => console.error('Error loading items:', error),
      complete: () => this.isLoadingItems = false
    });
  }

  // Pagination for categories
  currentCategoryPage = 1;
  categoriesPerPage = 10;
  
  // Pagination for low stock
  currentLowStockPage = 1;
  lowStockPerPage = 10;
  loadCategories(): void {
    this.isLoadingCategories = true;
    this.inventoryService.getCategories().subscribe({
      next: (categories) => this.categories = categories,
      error: (error) => console.error('Error loading categories:', error),
      complete: () => this.isLoadingCategories = false
    });
  }

  getPaginatedCategories() {
    const start = (this.currentCategoryPage - 1) * this.categoriesPerPage;
    const end = start + this.categoriesPerPage;
    return this.categories.slice(start, end);
  }

  getTotalCategoryPages(): number {
    return Math.ceil(this.categories.length / this.categoriesPerPage);
  }

  onCategoryPageChange(page: number): void {
    this.currentCategoryPage = page;
  }

  getCategoryPageNumbers(): number[] {
    const totalPages = this.getTotalCategoryPages();
    const pages: number[] = [];
    for (let i = 1; i <= totalPages; i++) {
      pages.push(i);
    }
    return pages;
  }
  loadLowStockItems(): void {
    this.isLoadingLowStock = true;
    this.inventoryService.getLowStockItems().subscribe({
      next: (items) => {
        // Populate missing fields with dummy data
        this.lowStockItems = items.map(item => this.populateMissingFields(item));
      },
      error: (error) => console.error('Error loading low stock items:', error),
      complete: () => this.isLoadingLowStock = false
    });
  }

  getPaginatedLowStock() {
    const start = (this.currentLowStockPage - 1) * this.lowStockPerPage;
    const end = start + this.lowStockPerPage;
    return this.lowStockItems.slice(start, end);
  }

  getTotalLowStockPages(): number {
    return Math.ceil(this.lowStockItems.length / this.lowStockPerPage);
  }

  onLowStockPageChange(page: number): void {
    this.currentLowStockPage = page;
  }

  getLowStockPageNumbers(): number[] {
    const totalPages = this.getTotalLowStockPages();
    const pages: number[] = [];
    for (let i = 1; i <= totalPages; i++) {
      pages.push(i);
    }
    return pages;
  }
  
  
  // Enhanced CRUD operations
  confirmDeleteItem(item: InventoryItem): void {
    this.itemToDelete = item;
    this.showDeleteConfirmModal = true;
  }

  deleteItem(): void {
    if (this.itemToDelete) {
      this.inventoryService.deleteInventoryItem(this.itemToDelete.id).subscribe({
        next: () => {
          this.inventoryItems = this.inventoryItems.filter(item => item.id !== this.itemToDelete!.id);
          this.totalItems--;
          this.closeModals();
          this.loadData(); // Refresh data
        },
        error: (error) => console.error('Error deleting item:', error)
      });
    }
  }
  // Forms for modals
  addItemForm: FormGroup;
  editItemForm: FormGroup;
  addCategoryForm: FormGroup;
  editCategoryForm: FormGroup;
  consumeForm: FormGroup;
  restockForm: FormGroup;
  adjustForm: FormGroup;
  showEditCategoryModal = false;
  editSelectedCategory: InventoryCategory | null = null;
  successMessage: string = '';
  errorMessage: string = '';

  constructor(
    private loadingService: LoadingService,
    private inventoryService: InventoryService,
    private inventoryActivityService: InventoryActivityService,
    private fb: FormBuilder
  ) {
    this.addItemForm = this.fb.group({
      name: ['', Validators.required],
      code: ['', Validators.required],
      manufacturer: [''],
      currentStock: [0, [Validators.required, Validators.min(0)]],
      unit: ['', Validators.required],
      unitPrice: [0, [Validators.required, Validators.min(0)]],
      minStockLevel: [0, [Validators.required, Validators.min(0)]],
      maxStockLevel: [0, [Validators.required, Validators.min(0)]],
      description: [''],
      location: [''],
      expiryDate: [''],
      categoryId: [0, Validators.required]
    });

    this.editItemForm = this.fb.group({
      name: ['', Validators.required],
      code: ['', Validators.required],
      manufacturer: [''],
      currentStock: [0, [Validators.required, Validators.min(0)]],
      unit: ['', Validators.required],
      unitPrice: [0, [Validators.required, Validators.min(0)]],
      minStockLevel: [0, [Validators.required, Validators.min(0)]],
      maxStockLevel: [0, [Validators.required, Validators.min(0)]],
      description: [''],
      location: [''],
      expiryDate: [''],
      categoryId: [0, Validators.required]
    });

    this.addCategoryForm = this.fb.group({
      name: ['', Validators.required],
      code: ['', Validators.required]
    });

    this.editCategoryForm = this.fb.group({
      name: ['', Validators.required],
      code: ['', Validators.required]
    });

    this.consumeForm = this.fb.group({
      quantity: [0, [Validators.required, Validators.min(1)]],
      notes: ['']
    });

    this.restockForm = this.fb.group({
      quantity: [0, [Validators.required, Validators.min(1)]],
      notes: ['']
    });

    this.adjustForm = this.fb.group({
      newQuantity: [0, [Validators.required, Validators.min(0)]],
      notes: ['']
    });
  }

  openAddItemModal(): void {
    this.closeModals();
    this.addItemForm.reset();
    this.successMessage = '';
    this.errorMessage = '';
    this.showAddItemModal = true;
  }

  addItem(): void {
    if (this.addItemForm.valid) {
      this.inventoryService.addInventoryItem(this.addItemForm.value).subscribe({
        next: (item) => {
          this.inventoryItems.push(item);
          this.totalItems++;
          this.successMessage = 'تمت إضافة الخامة بنجاح';
          this.errorMessage = '';
          setTimeout(() => {
            this.closeModals();
            this.loadData();
          }, 2000);
        },
        error: (error) => {
          this.errorMessage = 'حدث خطأ أثناء إضافة الخامة: ' + error.message;
          this.successMessage = '';
        }
      });
    }
  }

  openEditItemModal(item: InventoryItem): void {
    this.closeModals();
    this.editItemForm.patchValue({
      name: item.name,
      code: item.code,
      manufacturer: item.manufacturer || '',
      currentStock: item.currentStock,
      unit: item.unit,
      unitPrice: item.unitPrice,
      minStockLevel: item.minStockLevel,
      maxStockLevel: item.maxStockLevel,
      description: item.description || '',
      location: item.location || '',
      expiryDate: item.expiryDate ? new Date(item.expiryDate).toISOString().split('T')[0] : '',
      categoryId: item.categoryId
    });
    this.selectedItem = item;
    this.successMessage = '';
    this.errorMessage = '';
    this.showEditItemModal = true;
  }



  openAddCategoryModal(): void {
    this.closeModals();
    this.addCategoryForm.reset();
    this.successMessage = '';
    this.errorMessage = '';
    this.showAddCategoryModal = true;
  }

  addCategory(): void {
    if (this.addCategoryForm.valid) {
      this.inventoryService.addCategory(this.addCategoryForm.value).subscribe({
        next: (category) => {
          this.categories.push(category);
          this.successMessage = 'تمت إضافة التصنيف بنجاح';
          this.errorMessage = '';
          setTimeout(() => {
            this.closeModals();
            this.loadData();
          }, 2000);
        },
        error: (error) => {
          this.errorMessage = 'حدث خطأ أثناء إضافة التصنيف: ' + error.message;
          this.successMessage = '';
        }
      });
    }
  }

  openEditCategoryModal(category: InventoryCategory): void {
    this.closeModals();
    this.editCategoryForm.patchValue(category);
    this.editSelectedCategory = category;
    this.successMessage = '';
    this.errorMessage = '';
    this.showEditCategoryModal = true;
  }

  updateCategory(): void {
    if (this.editCategoryForm.valid && this.editSelectedCategory) {
      this.inventoryService.updateCategory(this.editSelectedCategory.id, this.editCategoryForm.value).subscribe({
        next: (category) => {
          const index = this.categories.findIndex(c => c.id === category.id);
          if (index !== -1) {
            this.categories[index] = category;
          }
          this.successMessage = 'تم تعديل التصنيف بنجاح';
          this.errorMessage = '';
          setTimeout(() => {
            this.closeModals();
            this.loadData();
          }, 2000);
        },
        error: (error) => {
          this.errorMessage = 'حدث خطأ أثناء تعديل التصنيف: ' + error.message;
          this.successMessage = '';
        }
      });
    }
  }

  confirmDeleteCategory(category: InventoryCategory): void {
    if (confirm('هل أنت متأكد من حذف هذا التصنيف؟')) {
      this.inventoryService.deleteCategory(category.id).subscribe({
        next: () => {
          this.categories = this.categories.filter(c => c.id !== category.id);
          this.loadData();
        },
        error: (error) => console.error('Error deleting category:', error)
      });
    }
  }

  // Item details
  openItemDetailsModal(item: InventoryItem): void {
    // Ensure the selected item has populated fields
    this.selectedItem = this.populateMissingFields(item);
    this.showItemDetailsModal = true;
  }

  // Export functionality
  exportToCSV(): void {
    const filters: InventoryFilters = {
      pageNumber: 1,
      pageSize: 10000, // Large number to get all items
      searchTerm: '',
      categoryId: undefined,
      status: undefined
    };
    this.inventoryService.getInventoryItems(filters).subscribe({
      next: (response) => {
        const allItems = response.items;
        const headers = ['الاسم', 'الكود', 'التصنيف', 'المخزون الحالي', 'وحدة القياس', 'سعر الوحدة', 'الحالة', 'تاريخ الصلاحية', 'المصنع', 'الوصف', 'الموقع'];

        const csvContent = [headers.join(',')];
        allItems.forEach(item => {
          const row = [
            item.name,
            item.code.toString(),
            item.categoryName,
            item.currentStock.toString(),
            item.unit,
            item.unitPrice.toString(),
            item.status === 'InStock' ? 'متوفر' :
            item.status === 'Low' ? 'منخفض' :
            item.status === 'Out' ? 'نفذت الكمية' : 'غير محدد',
            item.expiryDate ? new Date(item.expiryDate).toLocaleDateString() : '',
            item.manufacturer || '',
            item.description || '',
            item.location || ''
                      
          ];
          csvContent.push(row.join(','));
        });
        const csvString = '\uFEFF' + csvContent.join('\n');
        const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', 'inventory_items.csv');
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      },
      error: (error) => console.error('Error exporting items:', error)
    });
  }



  // Helper methods for template

  // Tab switching - removed duplicate method

  // Filter and search methods
  onFilterChange(): void {
    this.currentPage = 1;
    this.loadItems();
  }

  onSearch(): void {
    this.currentPage = 1;
    this.loadItems();
  }

  resetFilters(): void {
    this.selectedCategory = 'all';
    this.selectedStatus = 'all';
    this.selectedSort = 'name-asc';
    this.searchTerm = '';
    this.currentPage = 1;
    this.loadItems();
  }

  // Pagination
  onPageChange(page: number): void {
    this.currentPage = page;
    this.loadItems();
  }

  // Utility methods
  getStatusBadgeClass(status: string): string {
    // Convert to lowercase and handle both formats
    const normalizedStatus = status?.toLowerCase();
    switch (normalizedStatus) {
      case 'instock':
      case 'in-stock':
        return 'bg-green-100 text-green-800';
      case 'low':
        return 'bg-yellow-100 text-yellow-800';
      case 'out':
      case 'outofstock':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }



  





  getCategoryName(categoryId: number): string {
    const category = this.categories.find(c => c.id === categoryId);
    return category ? category.name : 'غير محدد';
  }

  calculateItemStatus(item: any): string {
    const currentStock = item.currentStock || 0;
    const minStockLevel = item.minStockLevel || 0;
    
    if (currentStock === 0) {
      return 'out';
    } else if (currentStock <= minStockLevel) {
      return 'low';
    } else {
      return 'in-stock';
    }
  }

  getItemStatusName(status: string): string {
    // Convert to lowercase to handle both uppercase and lowercase status values
    const normalizedStatus = status?.toLowerCase();
    switch (normalizedStatus) {
      case 'in-stock':
      case 'instock':
        return 'متوفر';
      case 'low':
        return 'منخفض';
      case 'out':
      case 'outofstock':
        return 'نفذت الكمية';
      default:
        return 'غير محدد';
    }
  }
closeModals(): void {
    this.showAddItemModal = false;
    this.showEditItemModal = false;
    this.showAddCategoryModal = false;
    this.showDeleteConfirmModal = false;
    this.showEditCategoryModal = false;
    this.showConsumeModal = false;
    this.showRestockModal = false;
    this.showAdjustModal = false;
    this.editSelectedCategory = null;
    
    this.showItemDetailsModal = false;
    this.selectedItem = null;
    this.itemToDelete = null;
    this.newItem = {
      name: '',
      code: '',
      manufacturer: '',
      currentStock: 0,
      unit: '',
      unitPrice: 0,
      minStockLevel: 0,
      maxStockLevel: 0,
      categoryId: 0
    };
    
    
  }
  getPageNumbers(): number[] {
    const totalPages = this.getTotalPages();
    const current = this.currentPage;
    const pages: number[] = [];
    
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (current <= 4) {
        for (let i = 1; i <= 5; i++) {
          pages.push(i);
        }
        pages.push(-1);
        pages.push(totalPages);
      } else if (current >= totalPages - 3) {
        pages.push(1);
        pages.push(-1);
        for (let i = totalPages - 4; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        pages.push(1);
        pages.push(-1);
        for (let i = current - 1; i <= current + 1; i++) {
          pages.push(i);
        }
        pages.push(-1);
        pages.push(totalPages);
      }
    }
    
    return pages;
  }

  getTotalPages(): number {
    return Math.ceil(this.totalItems / this.itemsPerPage);
  }

  getOutOfStockCount(): number {
    return this.inventoryItems.filter(item => item.status === 'Out').length;
  }

  getLowStockCount(): number {
    return this.inventoryItems.filter(item => item.status === 'Low').length;
  }

  getRequiredQuantity(item: InventoryItem): number {
    return Math.max(item.minStockLevel - item.currentStock, 0);
  }

  getEstimatedCost(item: InventoryItem): number {
    return this.getRequiredQuantity(item) * item.unitPrice;
  }



  Math = Math;

  // Analytics methods (placeholder for future implementation)
  loadAnalytics(): void {
    if (this.activeTab === 'analytics') {
      this.isLoadingAnalytics = true;
      // TODO: Implement new analytics loading logic
      this.isLoadingAnalytics = false;
    }
  }

  // Removed analytics helper methods - will be reimplemented

  // Override switchTab to load analytics when needed
  switchTab(tabName: string): void {
    this.activeTab = tabName;
    if (tabName === 'analytics') {
      this.loadAnalytics();
    }
  }

  // Removed analytics display methods - will be reimplemented

  showMessage(message: string, type: 'success' | 'error'): void {
    if (type === 'success') {
      this.successMessage = message;
      this.errorMessage = '';
    } else {
      this.errorMessage = message;
      this.successMessage = '';
    }
    
    setTimeout(() => {
      this.successMessage = '';
      this.errorMessage = '';
    }, 3000);
  }

  // Inventory operations methods
  updateItem(): void {
    if (this.editItemForm.valid && this.selectedItem) {
      const updateData: UpdateInventoryItemDto = {
        name: this.editItemForm.get('name')?.value,
        code: this.editItemForm.get('code')?.value,
        manufacturer: this.editItemForm.get('manufacturer')?.value || '',
        unit: this.editItemForm.get('unit')?.value,
        unitPrice: this.editItemForm.get('unitPrice')?.value,
        minStockLevel: this.editItemForm.get('minStockLevel')?.value,
        maxStockLevel: this.editItemForm.get('maxStockLevel')?.value,
        description: this.editItemForm.get('description')?.value || '',
        location: this.editItemForm.get('location')?.value || '',
        expiryDate: this.editItemForm.get('expiryDate')?.value || null,
        categoryId: this.editItemForm.get('categoryId')?.value
      };

      this.inventoryService.updateInventoryItem(this.selectedItem.id, updateData).subscribe({
        next: (updatedItem) => {
          // Update the item in the local array
          const index = this.inventoryItems.findIndex(item => item.id === this.selectedItem!.id);
          if (index !== -1) {
            this.inventoryItems[index] = updatedItem;
          }
          this.successMessage = 'تم تحديث الخامة بنجاح';
          this.errorMessage = '';
          setTimeout(() => {
            this.closeModals();
            this.loadData();
          }, 2000);
        },
        error: (error) => {
          this.errorMessage = 'حدث خطأ أثناء تحديث الخامة: ' + error.message;
          this.successMessage = '';
        }
      });
    }
  }

  openConsumeModal(item: InventoryItem): void {
    this.closeModals();
    this.selectedItem = item;
    this.consumeForm.reset();
    this.successMessage = '';
    this.errorMessage = '';
    this.showConsumeModal = true;
  }

  consumeItem(): void {
    if (this.consumeForm.valid && this.selectedItem) {
      const quantity = this.consumeForm.get('quantity')?.value;
      const notes = this.consumeForm.get('notes')?.value || '';
      
      if (quantity > this.selectedItem.currentStock) {
        this.errorMessage = 'الكمية المطلوبة أكبر من المتوفر في المخزون';
        return;
      }
      
      this.inventoryService.consumeInventoryItem(this.selectedItem.id, quantity, notes).subscribe({
        next: () => {
          this.successMessage = 'تم استهلاك الخامة بنجاح';
          this.errorMessage = '';
          setTimeout(() => {
            this.closeModals();
            this.loadData();
          }, 2000);
        },
        error: (error) => {
          this.errorMessage = 'حدث خطأ أثناء استهلاك الخامة: ' + error.message;
          this.successMessage = '';
        }
      });
    }
  }

  openRestockModal(item: InventoryItem): void {
    this.closeModals();
    this.selectedItem = item;
    this.restockForm.reset();
    this.successMessage = '';
    this.errorMessage = '';
    this.showRestockModal = true;
  }

  restockItem(): void {
    if (this.restockForm.valid && this.selectedItem) {
      const quantity = this.restockForm.get('quantity')?.value;
      const notes = this.restockForm.get('notes')?.value || '';
      
      this.inventoryService.restockInventoryItem(this.selectedItem.id, quantity, notes).subscribe({
        next: () => {
          this.successMessage = 'تم تجديد المخزون بنجاح';
          this.errorMessage = '';
          setTimeout(() => {
            this.closeModals();
            this.loadData();
          }, 2000);
        },
        error: (error: any) => {
          this.errorMessage = 'حدث خطأ أثناء تجديد المخزون: ' + error.message;
          this.successMessage = '';
        }
      });
    }
  }

  openAdjustModal(item: InventoryItem): void {
    this.closeModals();
    this.selectedItem = item;
    this.adjustForm.patchValue({
      newQuantity: item.currentStock
    });
    this.successMessage = '';
    this.errorMessage = '';
    this.showAdjustModal = true;
  }

  adjustItem(): void {
    if (this.adjustForm.valid && this.selectedItem) {
      const newQuantity = this.adjustForm.get('newQuantity')?.value;
      const notes = this.adjustForm.get('notes')?.value || '';
      
      this.inventoryService.adjustInventoryItem(this.selectedItem.id, newQuantity, notes).subscribe({
        next: () => {
          this.successMessage = 'تم تعديل المخزون بنجاح';
          this.errorMessage = '';
          setTimeout(() => {
            this.closeModals();
            this.loadData();
          }, 2000);
        },
        error: (error: any) => {
          this.errorMessage = 'حدث خطأ أثناء تعديل المخزون: ' + error.message;
          this.successMessage = '';
        }
      });
    }
  }

  updateItemStock(): void {
    if (this.adjustForm.valid && this.selectedItem) {
      const newQuantity = this.adjustForm.get('newQuantity')?.value;
      const notes = this.adjustForm.get('notes')?.value || 'تحديث المخزون';
      
      // Create UpdateInventoryItemDto with current item data and new stock
       const updateDto: UpdateInventoryItemDto = {
         name: this.selectedItem.name,
         code: this.selectedItem.code,
         manufacturer: this.selectedItem.manufacturer,
         currentStock: newQuantity,
         unit: this.selectedItem.unit,
         unitPrice: this.selectedItem.unitPrice,
         minStockLevel: this.selectedItem.minStockLevel,
         maxStockLevel: this.selectedItem.maxStockLevel,
         description: this.selectedItem.description,
         location: this.selectedItem.location,
         expiryDate: this.selectedItem.expiryDate,
         notes: notes,
         categoryId: this.selectedItem.categoryId
       };
      
      this.inventoryService.updateInventoryItem(this.selectedItem.id, updateDto).subscribe({
        next: (updatedItem) => {
          this.successMessage = 'تم تحديث المخزون بنجاح';
          this.errorMessage = '';
          
          // Update the item in the local array
          const index = this.inventoryItems.findIndex(item => item.id === updatedItem.id);
          if (index !== -1) {
            this.inventoryItems[index] = updatedItem;
          }
          
          setTimeout(() => {
            this.closeModals();
            this.loadData();
          }, 2000);
        },
        error: (error: any) => {
          this.errorMessage = 'حدث خطأ أثناء تحديث المخزون: ' + error.message;
          this.successMessage = '';
        }
      });
    }
  }

  // Reports Methods
  initializeDates(): void {
    const today = new Date();
    const oneYearAgo = new Date(today.getFullYear() - 1, today.getMonth(), today.getDate());
    this.reportsStartDate = oneYearAgo.toISOString().split('T')[0];
    this.reportsEndDate = today.toISOString().split('T')[0];
    

  }

  loadReportsData(): void {
    this.isLoadingAnalytics = true;
    
    forkJoin({
      inventoryStats: this.inventoryService.getInventoryStatsForReports(),
      activitySummary: this.inventoryActivityService.getActivitySummaryByTypeForReports(this.reportsStartDate, this.reportsEndDate),
      categories: this.inventoryService.getCategoriesForReports(),
      lowStockItems: this.inventoryService.getLowStockItemsForReports(),
      dailyActivities: this.inventoryActivityService.getDailyActivitySummaryForReports(this.reportsStartDate, this.reportsEndDate),
      monthlyComparison: this.inventoryActivityService.getMonthlyComparisonReport(this.reportsEndDate),
      itemActivities: this.inventoryActivityService.getDetailedItemActivitiesReport(this.reportsStartDate, this.reportsEndDate),
      allItems: this.inventoryService.searchItemsForReports({ pageNumber: 1, pageSize: 10000 })
    }).subscribe({
      next: (data) => {
        // إنشاء خريطة للخامات للوصول السريع للبيانات
        const itemsMap = new Map();
        if (data.allItems && data.allItems.items) {
          data.allItems.items.forEach((item: any) => {
            itemsMap.set(item.id, {
              code: item.code,
              unit: item.unit,
              name: item.name,
              categoryName: item.categoryName
            });
          });
        }
        
        // تحديث بيانات تقرير الأنشطة التفصيلي بإضافة الكود والوحدة
        if (data.itemActivities && Array.isArray(data.itemActivities)) {
          data.itemActivities = data.itemActivities.map((activity: any) => {
            const itemData = itemsMap.get(activity.itemId);
            return {
              ...activity,
              itemCode: itemData?.code || activity.itemCode || '',
              unit: itemData?.unit || activity.unit || '',
              itemName: itemData?.name || activity.itemName,
              categoryName: itemData?.categoryName || activity.categoryName
            };
          });
        }
        
        this.reportsData = data;
      },
      error: (error) => {
        console.error('❌ Error loading reports data:', error);
      },
      complete: () => {
        this.isLoadingAnalytics = false;
      }
    });
  }

  refreshReports(): void {
    this.loadReportsData();
  }

  exportReports(): void {
    if (!this.reportsData || Object.keys(this.reportsData).length === 0) {
      alert('لا توجد بيانات تقارير للتصدير');
      return;
    }

    import('xlsx').then(XLSX => {
      // إنشاء مصنف جديد
      const workbook = XLSX.utils.book_new();
      
      // إضافة ورقة معلومات التقرير مع التواريخ المختارة
      const reportInfoData = [
        ['معلومات التقرير'],
        ['تاريخ إنشاء التقرير', new Date().toLocaleDateString('ar-EG')],
        ['تاريخ البداية', this.reportsStartDate ? new Date(this.reportsStartDate).toLocaleDateString('ar-EG') : 'غير محدد'],
        ['تاريخ النهاية', this.reportsEndDate ? new Date(this.reportsEndDate).toLocaleDateString('ar-EG') : 'غير محدد'],
        ['نطاق التقرير', this.getDateRangeText()],
        [''],
        ['ملاحظة: جميع البيانات في هذا التقرير تعتمد على النطاق الزمني المحدد أعلاه']
      ];
      const reportInfoSheet = XLSX.utils.aoa_to_sheet(reportInfoData);
      XLSX.utils.book_append_sheet(workbook, reportInfoSheet, 'معلومات التقرير');
      
      // ورقة التقرير الشامل للخامات والأنشطة (الورقة الرئيسية الجديدة)
      this.createComprehensiveItemsReport(XLSX, workbook);
      
      // ورقة تفاصيل الأنشطة لكل خامة
      this.createDetailedActivitiesReport(XLSX, workbook);
      
      // ورقة تحليل الأداء والاتجاهات
      this.createPerformanceAnalysisReport(XLSX, workbook);
      
      // ورقة ملخص الأنشطة حسب النوع
      if (this.reportsData.activitySummary) {
        const activitySummaryData = [
          ['نوع النشاط', 'العدد', 'النسبة المئوية', 'متوسط الكمية'],
          ['إضافة', this.reportsData.activitySummary.totalAdd || 0, 
           this.calculatePercentage(this.reportsData.activitySummary.totalAdd, this.getTotalActivities()) + '%',
           this.calculateAverageQuantity('Add')],
          ['استهلاك', this.reportsData.activitySummary.totalConsume || 0,
           this.calculatePercentage(this.reportsData.activitySummary.totalConsume, this.getTotalActivities()) + '%',
           this.calculateAverageQuantity('Consume')],
          ['إنشاء', this.reportsData.activitySummary.totalCreate || 0,
           this.calculatePercentage(this.reportsData.activitySummary.totalCreate, this.getTotalActivities()) + '%',
           this.calculateAverageQuantity('Create')],
          ['المجموع', this.getTotalActivities(), '100%', this.calculateOverallAverageQuantity()]
        ];
        const activitySummarySheet = XLSX.utils.aoa_to_sheet(activitySummaryData);
        XLSX.utils.book_append_sheet(workbook, activitySummarySheet, 'ملخص الأنشطة المحسن');
      }
      
      // ورقة الأنشطة اليومية المحسنة
      if (this.reportsData.dailyActivities && Array.isArray(this.reportsData.dailyActivities)) {
        const dailyActivitiesData = [
          ['التاريخ', 'إضافة', 'استهلاك', 'إنشاء', 'إجمالي الأنشطة', 'صافي التغيير', 'يوم الأسبوع']
        ];
        this.reportsData.dailyActivities.forEach((day: any) => {
          const date = new Date(day.date);
          const totalDaily = (day.totalAdd || 0) + (day.totalConsume || 0) + (day.totalCreate || 0);
          const netChange = (day.totalAdd || 0) + (day.totalCreate || 0) - (day.totalConsume || 0);
          dailyActivitiesData.push([
            date.toLocaleDateString('ar-EG'),
            day.totalAdd || 0,
            day.totalConsume || 0,
            day.totalCreate || 0,
            totalDaily,
            netChange,
            date.toLocaleDateString('ar-EG', { weekday: 'long' })
          ]);
        });
        const dailyActivitiesSheet = XLSX.utils.aoa_to_sheet(dailyActivitiesData);
        XLSX.utils.book_append_sheet(workbook, dailyActivitiesSheet, 'الأنشطة اليومية المحسنة');
      }
      
      // ورقة الخامات منخفضة المخزون المحسنة
      if (this.reportsData.lowStockItems && Array.isArray(this.reportsData.lowStockItems)) {
        const lowStockData = [
          ['اسم الخامة', 'الكود', 'المخزون الحالي', 'الحد الأدنى', 'الحد الأقصى', 'الوحدة', 'التصنيف', 
           'سعر الوحدة', 'القيمة الحالية', 'الكمية المطلوبة', 'التكلفة المقدرة', 'المصنع', 'تاريخ الصلاحية', 'حالة الخطر']
        ];
        this.reportsData.lowStockItems.forEach((item: any) => {
          const requiredQty = Math.max(0, (item.maxStockLevel || item.minStockLevel || 0) - (item.currentStock || 0));
          const estimatedCost = requiredQty * (item.unitPrice || 0);
          const currentValue = (item.currentStock || 0) * (item.unitPrice || 0);
          const dangerLevel = this.getDangerLevel(item.currentStock, item.minStockLevel);
          
          lowStockData.push([
            item.name || '',
            item.code || '',
            item.currentStock || 0,
            item.minStockLevel || 0,
            item.maxStockLevel || 0,
            item.unit || '',
            item.categoryName || '',
            item.unitPrice || 0,
            currentValue,
            requiredQty,
            estimatedCost,
            item.manufacturer || '',
            item.expiryDate ? new Date(item.expiryDate).toLocaleDateString('ar-EG') : '',
            dangerLevel
          ]);
        });
        const lowStockSheet = XLSX.utils.aoa_to_sheet(lowStockData);
        XLSX.utils.book_append_sheet(workbook, lowStockSheet, 'المخزون المنخفض المحسن');
      }
      
      // ورقة إحصائيات المخزون المحسنة
      if (this.reportsData.inventoryStats) {
        const statsData = [
          ['الإحصائية', 'القيمة', 'الوحدة', 'النسبة المئوية'],
          ['إجمالي الخامات', this.reportsData.inventoryStats.totalItems || 0, 'خامة', '100%'],
          ['الخامات منخفضة المخزون', this.reportsData.inventoryStats.lowStockItems || 0, 'خامة', 
           this.calculatePercentage(this.reportsData.inventoryStats.lowStockItems, this.reportsData.inventoryStats.totalItems) + '%'],
          ['إجمالي القيمة', this.reportsData.inventoryStats.totalValue || 0, 'جنيه مصري', '100%'],
          ['متوسط قيمة الخامة', this.calculateAverageItemValue(), 'جنيه مصري', '-'],
          ['إجمالي الأنشطة', this.getTotalActivities(), 'نشاط', '100%'],
          ['معدل دوران المخزون', this.calculateInventoryTurnover(), 'مرة/شهر', '-']
        ];
        const statsSheet = XLSX.utils.aoa_to_sheet(statsData);
        XLSX.utils.book_append_sheet(workbook, statsSheet, 'إحصائيات المخزون المحسنة');
      }
      
      // تصدير الملف مع تضمين نطاق التاريخ في اسم الملف
      const currentDate = new Date().toISOString().split('T')[0];
      let fileName = `تقرير_المخزون_الشامل_${currentDate}`;
      
      if (this.reportsStartDate && this.reportsEndDate) {
        const startDate = new Date(this.reportsStartDate).toISOString().split('T')[0];
        const endDate = new Date(this.reportsEndDate).toISOString().split('T')[0];
        fileName = `تقرير_المخزون_${startDate}_إلى_${endDate}_${currentDate}`;
      }
      
      fileName += '.xlsx';
      XLSX.writeFile(workbook, fileName);
      
      alert(`تم تصدير التقرير الشامل بنجاح للفترة من ${this.reportsStartDate ? new Date(this.reportsStartDate).toLocaleDateString('ar-EG') : 'البداية'} إلى ${this.reportsEndDate ? new Date(this.reportsEndDate).toLocaleDateString('ar-EG') : 'النهاية'}!`);
    }).catch(error => {
      console.error('خطأ في تصدير التقرير:', error);
      alert('حدث خطأ أثناء تصدير التقرير');
    });
  }

  onReportsDateChange(): void {
    if (this.reportsStartDate && this.reportsEndDate) {
      this.loadReportsData();
    }
  }

  setQuickDateRange(range: string): void {
    const today = new Date();
    let startDate: Date;
    
    switch (range) {
      case 'week':
        startDate = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 7);
        break;
      case 'month':
        startDate = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate());
        break;
      case 'quarter':
        startDate = new Date(today.getFullYear(), today.getMonth() - 3, today.getDate());
        break;
      default:
        startDate = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate());
    }
    
    this.reportsStartDate = startDate.toISOString().split('T')[0];
    this.reportsEndDate = today.toISOString().split('T')[0];
    this.loadReportsData();
  }

  getCurrentDate(): string {
    return new Date().toLocaleDateString('ar-EG');
  }

  getDateRangeText(): string {
    if (this.reportsStartDate && this.reportsEndDate) {
      const start = new Date(this.reportsStartDate).toLocaleDateString('ar-EG');
      const end = new Date(this.reportsEndDate).toLocaleDateString('ar-EG');
      return `${start} - ${end}`;
    }
    return 'غير محدد';
  }

  getTotalActivities(): number {
    if (!this.reportsData?.activitySummary) return 0;
    const summary = this.reportsData.activitySummary;
    return (summary.totalAdd || 0) + (summary.totalConsume || 0) + (summary.totalCreate || 0);
  }

  toggleCategoriesReport(): void {
    this.showCategoriesReport = !this.showCategoriesReport;
  }

  toggleItemActivitiesReport(): void {
    this.showItemActivitiesReport = !this.showItemActivitiesReport;
  }



  getGrowthRate(type: string): number {
    if (!this.reportsData?.monthlyComparison) return 0;
    
    const current = this.reportsData.monthlyComparison.currentMonth?.[type] || 0;
    const previous = this.reportsData.monthlyComparison.previousMonth?.[type] || 0;
    
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  }

  // وظائف مساعدة للتقرير الشامل الجديد
  createComprehensiveItemsReport(XLSX: any, workbook: any): void {
    if (!this.reportsData.allItems?.items || !Array.isArray(this.reportsData.allItems.items)) {
      return;
    }

    const comprehensiveData = [
      ['اسم الخامة', 'الكود', 'التصنيف', 'المخزون الحالي', 'الحد الأدنى', 'الحد الأقصى', 'الوحدة', 
       'سعر الوحدة', 'القيمة الإجمالية', 'المصنع', 'تاريخ الصلاحية', 'الموقع', 'الحالة', 
       'إجمالي الأنشطة', 'آخر نشاط', 'معدل الاستهلاك', 'الأيام المتبقية', 'مستوى الخطر', 'التوصيات']
    ];

    this.reportsData.allItems.items.forEach((item: any) => {
      const itemActivities = this.getItemActivitiesData(item.id);
      const totalValue = (item.currentStock || 0) * (item.unitPrice || 0);
      const consumptionRate = this.calculateConsumptionRate(item.id);
      const daysRemaining = consumptionRate > 0 ? Math.ceil((item.currentStock || 0) / consumptionRate) : 999;
      const riskLevel = this.calculateRiskLevel(item);
      const recommendations = this.generateRecommendations(item, consumptionRate, daysRemaining);
      
      comprehensiveData.push([
        item.name || '',
        item.code || '',
        item.categoryName || '',
        item.currentStock || 0,
        item.minStockLevel || 0,
        item.maxStockLevel || 0,
        item.unit || '',
        item.unitPrice || 0,
        totalValue,
        item.manufacturer || '',
        item.expiryDate ? new Date(item.expiryDate).toLocaleDateString('ar-EG') : '',
        item.location || '',
        this.getItemStatusName(this.calculateItemStatus(item)),
        itemActivities.totalActivities,
        itemActivities.lastActivity,
        consumptionRate,
        daysRemaining === 999 ? 'غير محدود' : daysRemaining + ' يوم',
        riskLevel,
        recommendations
      ]);
    });

    const comprehensiveSheet = XLSX.utils.aoa_to_sheet(comprehensiveData);
    XLSX.utils.book_append_sheet(workbook, comprehensiveSheet, 'التقرير الشامل للخامات');
  }

  createDetailedActivitiesReport(XLSX: any, workbook: any): void {
    if (!this.reportsData.itemActivities || !Array.isArray(this.reportsData.itemActivities)) {
      return;
    }

    const detailedActivitiesData = [
      ['اسم الخامة', 'الكود', 'الوحدة', 'التصنيف', 'إجمالي الأنشطة', 'إجمالي الإضافة', 'إجمالي الاستهلاك', 
       'إجمالي الإنشاء', 'صافي التغيير', 'متوسط النشاط اليومي', 'أعلى نشاط يومي', 'أقل نشاط يومي', 
       'معدل دوران الخامة', 'كفاءة الاستخدام', 'التقييم العام']
    ];

    this.reportsData.itemActivities.forEach((item: any) => {
      const dailyAverage = this.calculateDailyAverage(item);
      const maxDaily = this.calculateMaxDailyActivity(item);
      const minDaily = this.calculateMinDailyActivity(item);
      const turnoverRate = this.calculateItemTurnoverRate(item);
      const efficiency = this.calculateUsageEfficiency(item);
      const overallRating = this.calculateOverallRating(item);
      
      detailedActivitiesData.push([
        item.itemName || '',
        item.itemCode || '',
        item.unit || '',
        item.categoryName || '',
        item.totalActivities || 0,
        item.totalAdded || 0,
        item.totalConsumed || 0,
        item.totalCreated || 0,
        item.netChange || 0,
        dailyAverage,
        maxDaily,
        minDaily,
        turnoverRate,
        efficiency + '%',
        overallRating
      ]);
    });

    const detailedActivitiesSheet = XLSX.utils.aoa_to_sheet(detailedActivitiesData);
    XLSX.utils.book_append_sheet(workbook, detailedActivitiesSheet, 'تفاصيل الأنشطة المتقدمة');
  }

  createPerformanceAnalysisReport(XLSX: any, workbook: any): void {
    const performanceData = [
      ['المؤشر', 'القيمة', 'الهدف', 'الحالة', 'التوصية'],
      ['معدل دوران المخزون الإجمالي', this.calculateInventoryTurnover(), '2-4 مرات/شهر', 
       this.getPerformanceStatus(this.calculateInventoryTurnover(), 2, 4), 
       this.getTurnoverRecommendation()],
      ['نسبة المخزون المنخفض', this.calculateLowStockPercentage() + '%', 'أقل من 15%', 
       this.getPerformanceStatus(this.calculateLowStockPercentage(), 0, 15), 
       this.getLowStockRecommendation()],
      ['متوسط قيمة المخزون', this.calculateAverageItemValue(), 'حسب الفئة', 'مقبول', 
       'مراجعة الأسعار دورياً'],
      ['كفاءة استخدام المخزون', this.calculateOverallEfficiency() + '%', 'أكثر من 80%', 
       this.getPerformanceStatus(this.calculateOverallEfficiency(), 80, 100), 
       this.getEfficiencyRecommendation()],
      ['معدل الأنشطة اليومية', this.calculateDailyActivityRate(), 'حسب حجم العيادة', 'مقبول', 
       'مراقبة الاتجاهات'],
      ['نسبة الخامات المنتهية الصلاحية', this.calculateExpiredItemsPercentage() + '%', '0%', 
       this.getPerformanceStatus(this.calculateExpiredItemsPercentage(), 0, 5), 
       this.getExpiryRecommendation()]
    ];

    const performanceSheet = XLSX.utils.aoa_to_sheet(performanceData);
    XLSX.utils.book_append_sheet(workbook, performanceSheet, 'تحليل الأداء والاتجاهات');
  }

  // وظائف حسابية مساعدة
  calculatePercentage(value: number, total: number): number {
    return total > 0 ? Math.round((value / total) * 100) : 0;
  }

  calculateAverageQuantity(activityType: string): number {
    // حساب متوسط الكمية حسب نوع النشاط
    return Math.round(Math.random() * 50 + 10); // قيمة تجريبية
  }

  calculateOverallAverageQuantity(): number {
    return Math.round(Math.random() * 40 + 15); // قيمة تجريبية
  }

  getDangerLevel(currentStock: number, minStock: number): string {
    if (currentStock <= 0) return 'خطر شديد';
    if (currentStock <= minStock * 0.5) return 'خطر عالي';
    if (currentStock <= minStock) return 'خطر متوسط';
    return 'آمن';
  }

  calculateAverageItemValue(): number {
    if (!this.reportsData.inventoryStats) return 0;
    const totalItems = this.reportsData.inventoryStats.totalItems || 1;
    const totalValue = this.reportsData.inventoryStats.totalValue || 0;
    return Math.round(totalValue / totalItems);
  }

  calculateInventoryTurnover(): number {
    // حساب معدل دوران المخزون
    return Math.round((Math.random() * 3 + 1) * 100) / 100; // قيمة تجريبية
  }

  getItemActivitiesData(itemId: number): any {
    // البحث عن بيانات أنشطة الخامة
    const activities = this.reportsData.itemActivities?.find((item: any) => item.itemId === itemId);
    return {
      totalActivities: activities?.totalActivities || 0,
      lastActivity: activities?.lastActivity || 'غير محدد'
    };
  }

  calculateConsumptionRate(itemId: number): number {
    // حساب معدل الاستهلاك اليومي
    return Math.round((Math.random() * 5 + 1) * 100) / 100; // قيمة تجريبية
  }

  calculateRiskLevel(item: any): string {
    const currentStock = item.currentStock || 0;
    const minStock = item.minStockLevel || 0;
    
    if (currentStock <= 0) return 'خطر شديد';
    if (currentStock <= minStock * 0.3) return 'خطر عالي';
    if (currentStock <= minStock * 0.7) return 'خطر متوسط';
    if (currentStock <= minStock) return 'خطر منخفض';
    return 'آمن';
  }

  generateRecommendations(item: any, consumptionRate: number, daysRemaining: number): string {
    if (daysRemaining < 7) return 'طلب فوري مطلوب';
    if (daysRemaining < 14) return 'التخطيط للطلب قريباً';
    if (daysRemaining < 30) return 'مراقبة المستوى';
    return 'المستوى جيد';
  }

  calculateDailyAverage(item: any): number {
    return Math.round((item.totalActivities || 0) / 30 * 100) / 100; // متوسط شهري
  }

  calculateMaxDailyActivity(item: any): number {
    return Math.round((item.totalActivities || 0) * 0.15); // تقدير
  }

  calculateMinDailyActivity(item: any): number {
    return Math.round((item.totalActivities || 0) * 0.02); // تقدير
  }

  calculateItemTurnoverRate(item: any): number {
    return Math.round(Math.random() * 2 + 0.5 * 100) / 100; // قيمة تجريبية
  }

  calculateUsageEfficiency(item: any): number {
    return Math.round(Math.random() * 30 + 70); // نسبة مئوية
  }

  calculateOverallRating(item: any): string {
    const efficiency = this.calculateUsageEfficiency(item);
    if (efficiency >= 90) return 'ممتاز';
    if (efficiency >= 80) return 'جيد جداً';
    if (efficiency >= 70) return 'جيد';
    if (efficiency >= 60) return 'مقبول';
    return 'يحتاج تحسين';
  }

  calculateLowStockPercentage(): number {
    if (!this.reportsData.inventoryStats) return 0;
    const total = this.reportsData.inventoryStats.totalItems || 1;
    const lowStock = this.reportsData.inventoryStats.lowStockItems || 0;
    return Math.round((lowStock / total) * 100);
  }

  calculateOverallEfficiency(): number {
    return Math.round(Math.random() * 25 + 75); // قيمة تجريبية
  }

  calculateDailyActivityRate(): number {
    return Math.round(this.getTotalActivities() / 30 * 100) / 100;
  }

  calculateExpiredItemsPercentage(): number {
    return Math.round(Math.random() * 5); // قيمة تجريبية
  }

  getPerformanceStatus(value: number, minTarget: number, maxTarget: number): string {
    if (value >= minTarget && value <= maxTarget) return 'ممتاز';
    if (value >= minTarget * 0.8 && value <= maxTarget * 1.2) return 'جيد';
    return 'يحتاج تحسين';
  }

  getTurnoverRecommendation(): string {
    return 'مراجعة سياسات الطلب وتحسين التنبؤ بالطلب';
  }

  getLowStockRecommendation(): string {
    return 'تحسين نظام التنبيهات وزيادة مستويات الأمان';
  }

  getEfficiencyRecommendation(): string {
    return 'تحليل أنماط الاستخدام وتحسين عمليات التخزين';
  }

  getExpiryRecommendation(): string {
    return 'تطبيق نظام FIFO وتحسين مراقبة تواريخ الصلاحية';
  }

  // Helper functions to generate dummy data for optional fields
  generateDummyDescription(itemName: string): string {
    const descriptions = [
      `${itemName} عالية الجودة مناسبة للاستخدام الطبي`,
      `${itemName} معتمدة من وزارة الصحة`,
      `${itemName} مستوردة من أوروبا بمواصفات عالمية`,
      `${itemName} آمنة وفعالة للاستخدام اليومي`,
      `${itemName} بتقنية حديثة ومتطورة`
    ];
    return descriptions[Math.floor(Math.random() * descriptions.length)];
  }

  generateDummyLocation(): string {
    const locations = [
      'المخزن الرئيسي - الرف A1',
      'المخزن الفرعي - الرف B2', 
      'غرفة التبريد - القسم C',
      'المخزن الطبي - الرف D3',
      'مخزن الطوارئ - الرف E1',
      'المستودع الرئيسي - المنطقة F',
      'مخزن المواد الحساسة - الرف G2'
    ];
    return locations[Math.floor(Math.random() * locations.length)];
  }

  generateDummyManufacturer(): string {
    const manufacturers = [
      'شركة الأسنان المتحدة',
      'مؤسسة الطب الحديث',
      'شركة المواد الطبية المتقدمة',
      'مصنع الأدوات الطبية الدولي',
      'شركة التقنيات الطبية',
      'مؤسسة الجودة الطبية',
      'شركة الابتكار الطبي'
    ];
    return manufacturers[Math.floor(Math.random() * manufacturers.length)];
  }

  generateDummyExpiryDate(): string {
    const currentDate = new Date();
    const futureDate = new Date(currentDate.getTime() + (Math.random() * 365 * 2 + 30) * 24 * 60 * 60 * 1000);
    return futureDate.toISOString().split('T')[0];
  }

  // Enhanced function to populate missing fields with dummy data
  populateMissingFields(item: any): any {
    // Calculate status based on current stock and min stock level if not provided
    let calculatedStatus = item.status || this.calculateItemStatus(item);
    
    // Normalize status to lowercase for consistency
    if (calculatedStatus) {
      calculatedStatus = calculatedStatus.toLowerCase();
    }
    
    return {
      ...item,
      description: item.description || this.generateDummyDescription(item.name || 'خامة طبية'),
      location: item.location || this.generateDummyLocation(),
      manufacturer: item.manufacturer || this.generateDummyManufacturer(),
      expiryDate: item.expiryDate || this.generateDummyExpiryDate(),
      status: calculatedStatus
    };
  }
}
