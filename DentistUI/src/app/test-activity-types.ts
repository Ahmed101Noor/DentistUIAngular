// ملف تجريبي لاختبار أنواع الأنشطة المختلفة
// يمكن استخدام هذا الملف لفهم الأنواع المستخدمة في قاعدة البيانات

export const ACTIVITY_TYPES = {
  // الأنواع المستخدمة حالياً في الكود
  ADD: 'Add',
  CONSUME: 'Consume', 
  CREATE: 'Create',
  
  // أنواع محتملة أخرى قد تكون في قاعدة البيانات
  ADJUSTMENT: 'Adjustment',
  ADJUST: 'Adjust',
  RESTOCK: 'Restock',
  TRANSFER: 'Transfer',
  RETURN: 'Return',
  WASTE: 'Waste',
  EXPIRED: 'Expired',
  
  // أنواع بالعربية (محتملة)
  ARABIC_ADD: 'إضافة',
  ARABIC_CONSUME: 'استهلاك',
  ARABIC_CREATE: 'إنشاء',
  ARABIC_ADJUST: 'تعديل'
};

// دالة لطباعة جميع الأنواع المحتملة
export function logAllPossibleActivityTypes() {
  console.log('🔍 جميع أنواع الأنشطة المحتملة:', ACTIVITY_TYPES);
}

// دالة للتحقق من نوع النشاط
export function checkActivityType(type: string): string {
  const normalizedType = type?.trim();
  
  console.log(`🔍 فحص نوع النشاط: "${normalizedType}"`);
  
  // التحقق من الأنواع الإنجليزية
  if (normalizedType === 'Add' || normalizedType === 'add' || normalizedType === 'ADD') {
    return 'إضافة';
  }
  if (normalizedType === 'Consume' || normalizedType === 'consume' || normalizedType === 'CONSUME') {
    return 'استهلاك';
  }
  if (normalizedType === 'Create' || normalizedType === 'create' || normalizedType === 'CREATE') {
    return 'إنشاء';
  }
  if (normalizedType === 'Adjust' || normalizedType === 'adjust' || normalizedType === 'ADJUST' || normalizedType === 'Adjustment') {
    return 'تعديل';
  }
  
  // التحقق من الأنواع العربية
  if (normalizedType === 'إضافة' || normalizedType === 'اضافة') {
    return 'إضافة';
  }
  if (normalizedType === 'استهلاك' || normalizedType === 'استهلك') {
    return 'استهلاك';
  }
  if (normalizedType === 'إنشاء' || normalizedType === 'انشاء') {
    return 'إنشاء';
  }
  if (normalizedType === 'تعديل' || normalizedType === 'تعديلات') {
    return 'تعديل';
  }
  
  console.warn(`⚠️ نوع نشاط غير معروف: "${normalizedType}"`);
  return normalizedType || 'غير محدد';
}