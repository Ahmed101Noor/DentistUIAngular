# نظام إدارة المخزون والخامات - البيانات الوهمية

## نظرة عامة

تم إضافة صفحة إدارة المخزون والخامات إلى النظام مع بيانات وهمية شاملة لتوضيح الواجهة والمنطق البرمجي. تحتوي الصفحة على أربعة أقسام رئيسية:

1. **كل الخامات** - عرض جميع المواد المخزنة
2. **التصنيفات** - تصنيف المواد حسب النوع
3. **الخامات المنخفضة** - المواد التي تحتاج إلى طلب
4. **طلبات التوريد** - إدارة طلبات الشراء

## البيانات الوهمية المضافة

### 1. إحصائيات لوحة التحكم

```typescript
inventoryStats: InventoryStats = {
  totalItems: 156,        // إجمالي الخامات
  lowStockItems: 12,      // الخامات المنخفضة
  totalValue: 45000,      // قيمة المخزون بالجنيه
  pendingOrders: 5,       // طلبات قيد الانتظار
  monthlyGrowth: 8,       // النمو الشهري
  valueGrowth: 12         // نمو القيمة
};
```

### 2. قائمة الخامات (8 مواد مختلفة)

#### أمثلة على البيانات:

**حشوة أملغم فضية:**
- الكود: `AM-001`
- التصنيف: مواد حشو
- المخزون الحالي: 45 علبة
- السعر: 120 ج.م
- الحالة: متوفر

**مخدر موضعي ليدوكين:**
- الكود: `ANES-003`
- التصنيف: مواد تخدير
- المخزون الحالي: 0 عبوة
- السعر: 25 ج.م
- الحالة: نفذت الكمية

**حشوة بيضاء مركبة:**
- الكود: `COMP-002`
- التصنيف: مواد حشو
- المخزون الحالي: 8 علبة
- السعر: 85 ج.م
- الحالة: منخفض

### 3. التصنيفات (6 تصنيفات)

```typescript
categories: InventoryCategory[] = [
  {
    name: 'مواد حشو',
    itemCount: 45,
    totalValue: 12500,
    monthlyConsumption: 3200,
    color: 'blue',
    icon: 'fas fa-tooth'
  },
  // ... باقي التصنيفات
];
```

### 4. الخامات المنخفضة (4 مواد)

تحتوي على المواد التي:
- نفذت بالكامل (status: 'out')
- وصلت للحد الأدنى (status: 'low')

### 5. طلبات التوريد (5 طلبات)

```typescript
orders: InventoryOrder[] = [
  {
    orderNumber: 'ORD-2024-001',
    supplier: 'شركة الأسنان المتحدة',
    status: 'pending',
    totalValue: 1250,
    itemCount: 8
  },
  // ... باقي الطلبات
];
```

## المنطق البرمجي

### 1. حساب الكميات المطلوبة

```typescript
getRequiredQuantity(item: InventoryItem): number {
  return Math.max(item.minStockLevel - item.currentStock, 0);
}
```

### 2. حساب التكلفة المتوقعة

```typescript
getEstimatedCost(item: InventoryItem): number {
  const requiredQuantity = this.getRequiredQuantity(item);
  return requiredQuantity * item.unitPrice;
}
```

### 3. إحصائيات الطلبات

```typescript
getPendingOrdersCount(): number {
  return this.orders.filter(order => order.status === 'pending').length;
}

getPendingOrdersValue(): number {
  return this.orders
    .filter(order => order.status === 'pending')
    .reduce((sum, order) => sum + order.totalValue, 0);
}
```

### 4. ترتيب الصفحات

```typescript
getPageNumbers(): number[] {
  const totalPages = this.getTotalPages();
  const current = this.currentPage;
  const pages: number[] = [];
  
  // منطق عرض أرقام الصفحات مع علامات الحذف
  if (totalPages <= 7) {
    // عرض جميع الصفحات
  } else {
    // عرض الصفحات مع علامات الحذف
  }
  
  return pages;
}
```

## الوظائف المتاحة

### 1. التصفية والبحث

- **تصفية حسب التصنيف:** مواد حشو، مواد تخدير، مواد تركيبات، إلخ
- **تصفية حسب الحالة:** متوفر، منخفض، نفذت الكمية
- **ترتيب حسب:** الاسم، المخزون، السعر
- **بحث نصي:** البحث في أسماء الخامات

### 2. إدارة المخزون

- **عرض المخزون الحالي**
- **تتبع الحد الأدنى والأعلى**
- **حساب الكميات المطلوبة**
- **تقدير التكلفة**

### 3. إدارة الطلبات

- **عرض الطلبات حسب الحالة**
- **حساب إجمالي قيمة الطلبات**
- **تتبع تواريخ التسليم**

## كيفية الاستخدام

### 1. عرض البيانات

```typescript
// في القالب HTML
<tr *ngFor="let item of inventoryItems">
  <td>{{ item.name }}</td>
  <td>{{ item.currentStock }} {{ item.unit }}</td>
  <td>{{ item.unitPrice }} ج.م</td>
  <td>{{ getStatusName(item.status) }}</td>
</tr>
```

### 2. تطبيق التصفية

```typescript
onFilterChange(): void {
  this.currentPage = 1;
  // تطبيق التصفية على البيانات
  console.log('Filter changed:', {
    category: this.selectedCategory,
    status: this.selectedStatus,
    sortBy: this.selectedSort
  });
}
```

### 3. البحث

```typescript
onSearch(): void {
  this.currentPage = 1;
  // تطبيق البحث على البيانات
  console.log('Search term:', this.searchTerm);
}
```

## التصميم والواجهة

### 1. لوحة التحكم

- **4 بطاقات إحصائية** تعرض:
  - إجمالي الخامات
  - الخامات المنخفضة
  - قيمة المخزون
  - طلبات قيد الانتظار

### 2. الأزرار السريعة

- إضافة خامة جديدة
- طلب توريد جديد
- تقرير المخزون
- جرد المخزون

### 3. التبويبات

- **كل الخامات:** جدول تفصيلي مع إمكانية التصفية
- **التصنيفات:** عرض بطاقات التصنيفات
- **الخامات المنخفضة:** تنبيهات وطلبات عاجلة
- **طلبات التوريد:** إدارة الطلبات

## التخصيص والتطوير

### 1. إضافة خامة جديدة

```typescript
// إضافة إلى مصفوفة inventoryItems
{
  id: 9,
  name: 'خامة جديدة',
  code: 'NEW-009',
  category: 'filling',
  manufacturer: 'شركة جديدة',
  currentStock: 10,
  unit: 'علبة',
  unitPrice: 100,
  minStockLevel: 5,
  maxStockLevel: 50,
  status: 'in-stock',
  lastUpdated: '2024-01-16'
}
```

### 2. إضافة تصنيف جديد

```typescript
// إضافة إلى مصفوفة categories
{
  id: 7,
  name: 'تصنيف جديد',
  code: 'NEW',
  itemCount: 10,
  totalValue: 5000,
  monthlyConsumption: 1000,
  lastSupplyDate: '2024-01-16',
  color: 'pink',
  icon: 'fas fa-star'
}
```

### 3. إضافة طلب جديد

```typescript
// إضافة إلى مصفوفة orders
{
  id: 6,
  orderNumber: 'ORD-2024-006',
  supplier: 'مورد جديد',
  supplierId: 6,
  orderDate: '2024-01-16',
  expectedDeliveryDate: '2024-01-23',
  itemCount: 3,
  totalValue: 500,
  status: 'pending',
  items: [...]
}
```

## الميزات المستقبلية

### 1. التكامل مع API

```typescript
// استبدال البيانات الوهمية بـ API calls
loadInventoryData(): void {
  this.inventoryService.getInventoryStats().subscribe(stats => {
    this.inventoryStats = stats;
  });
}
```

### 2. إضافة وظائف جديدة

- **طباعة التقارير**
- **إرسال تنبيهات**
- **تتبع تاريخ الاستهلاك**
- **تحليل الاتجاهات**

### 3. تحسينات الواجهة

- **رسوم بيانية تفاعلية**
- **خرائط حرارية للمخزون**
- **تنبيهات في الوقت الفعلي**

## الخلاصة

تم تنفيذ نظام إدارة المخزون والخامات بنجاح مع بيانات وهمية شاملة توضح:

1. **الوظائف الأساسية:** عرض، تصفية، بحث، ترتيب
2. **المنطق البرمجي:** حسابات المخزون والطلبات
3. **التصميم المتجاوب:** يعمل على جميع الأجهزة
4. **سهولة التخصيص:** إضافة بيانات جديدة بسهولة

النظام جاهز للتطوير المستقبلي والتكامل مع API حقيقي. 