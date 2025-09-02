export interface TeethDto {
  id: number;
  teethNumber: number;
  status: string; // API returns string, we'll convert to enum
  description?: string;
  // Optional fields that may not be returned by API
  patientId?: number;
  lastUpdated?: Date;
  treatmentPlan?: string;
}

export interface UpdateToothStatusDto {
  status: TeethStatus;
  description?: string;
}

export enum TeethStatus {
  Healthy = 0,
  Caries = 1,
  Treated = 2,
  Lost = 3,
  Other = 4,
  Unknown = 5
}

// Helper function to convert enum to display options
export function getTeethStatusOptions() {
  return [
    { value: TeethStatus.Healthy, label: 'سليم', color: '#4ade80' },
    { value: TeethStatus.Caries, label: 'تسوس', color: '#facc15' },
    { value: TeethStatus.Treated, label: 'معالج', color: '#60a5fa' },
    { value: TeethStatus.Lost, label: 'مفقود', color: '#f87171' },
    { value: TeethStatus.Other, label: 'أخرى', color: '#a78bfa' },
    { value: TeethStatus.Unknown, label: 'غير معروف', color: '#6b7280' }
  ];
}

// Helper function to get status color
export function getTeethStatusColor(status: TeethStatus): string {
  const options = getTeethStatusOptions();
  return options.find(option => option.value === status)?.color || '#6b7280';
}

// Helper function to get status label
export function getTeethStatusLabel(status: TeethStatus): string {
  const options = getTeethStatusOptions();
  return options.find(option => option.value === status)?.label || 'غير محدد';
}

// Helper function to convert string status to enum
export function convertStringToTeethStatus(status: string | number): TeethStatus {
  if (typeof status === 'number' && status >= 0 && status <= 5) {
    return status;
  }
  
  if (typeof status !== 'string' || !status) {
    return TeethStatus.Unknown;
  }
  
  // Log the incoming status for debugging
  console.log('Converting status:', status);
  
  // First try direct match with lowercase
  switch (status.toLowerCase()) {
    case 'healthy':
      return TeethStatus.Healthy;
    case 'caries':
      return TeethStatus.Caries;
    case 'treated':
      return TeethStatus.Treated;
    case 'lost':
      return TeethStatus.Lost;
    case 'other':
      return TeethStatus.Other;
    case 'unknown':
      return TeethStatus.Unknown;
  }
  
  // If no direct match, try to match with numeric values (API might return numbers as strings)
  const numericStatus = parseInt(status);
  if (!isNaN(numericStatus) && numericStatus >= 0 && numericStatus <= 5) {
    return numericStatus;
  }
  
  // If still no match, log and return default
  console.warn(`Unknown tooth status: ${status}, defaulting to Unknown`);
  return TeethStatus.Unknown;
}