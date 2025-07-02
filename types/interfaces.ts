export interface ApiError extends Error {
  statusCode?: number;
}

export interface Error {
  name: string;
  message: string;
  stack?: string;
}

export interface QstashProps {
  payload: any;
  DESTINATION_URL: string;
}

export interface Product {
  id: string;
  title: string;
  type?: string;
  legacyResourceId: string;
  gid: string;
  [key: string]: unknown; // ✅ index signature to satisfy Polaris type
}

export interface Entry {
  from: string;
  to: string;
  make: string;
  model: string;
  driveType: string;
  engineType: string;

}
export interface EntryData {
  id: string;
  startFrom: string;
  end: string;
  make: string;
  model: string;
  driveType: string;
  engineType: string;
  products: Product[];
}
export interface CarEntry {
  id: string;
  startFrom: string;
  end: string;
  make: string;
  model: string;
  driveType?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProductModalProps {
  open: boolean;
  onClose: () => void;
  products: Product[];
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  onAdd: (selected: Product[]) => void;
}
export interface ValidationErrors {
  yearFrom?: string;
  yearTo?: string;
  make?: string;
  model?: string;
  driveType?: string;
  [key: string]: string | undefined;
}
export interface EditEntryModalProps {
  open: boolean;
  year: string;
  make: string;
  model: string;
  driveType: string;
  engineType: string;
  yearOptions: { label: string; value: string }[];
  driveTypeOptions: { label: string; value: string }[];
  validationErrors: Record<string, string | undefined>;
  setYear: (value: string) => void;
  setMake: (value: string) => void;
  setModel: (value: string) => void;
  setdriveType: (value: 'AWD' | 'FWD' | 'RWD') => void;
  setEngineType:(val: string) => void;
  onUpdate: () => void;
  onCancel: () => void;
}

export interface SelectedProductsCardProps {
  selectedItems: Product[];
  showForm: boolean;
  onAddClick: () => void;
  onContinueClick: () => void;
}


export interface UploadedFile {
  id: string;
  error?: string | null;
  fileName: string;
  url: string;
  description?: string;
  totalRecords?: string;
  active: boolean;
  chunkSize?: number;
  totalChunks?: number;
  processedChunks?: number;
  isProcessed: boolean;
}

export interface CsvProgress {
  totalRecords: number;
  chunkSize: number;
  totalChunks: number;
  processedChunks: number;
  remainingChunks: number;
  progressPercent: number;
}

export interface FlatProductRow {
  entryId: string;
  productTitle: string;
  make: string;
  model: string;
  year: string;
  legacyResourceId: string;
  driveType?: string;
  engineType: string;
}

export interface EntryProps {
  year: string;
  make: string;
  model: string;
  driveType: string;
  engineType:string;
  entries: Entry[];
  yearOptions: { label: string; value: string }[];
  driveTypeOptions: { label: string; value: string }[];
  validationErrors: Record<string, string | undefined>;
  isSaving: boolean;
  onChangeYear: (type: 'from' | 'to', value: string) => void;
  onChangeMake: (value: string) => void;
  onChangeModel: (value: string) => void;
  onChangedriveType: (value: 'AWD' | 'FWD' | 'RWD') => void;
  onChangeEngineType:(value:string)=>void
  onAddEntry: () => void;
  onEdit: (index: number) => void;
  onDelete: (index: number) => void;
  onSave: () => void;
}

export interface ProductCarsTableProps {
  entries: CarEntry[];
  loading: boolean;
  totalPages: number;
  totalCount: number;
  currentPage: number;
  onPageChange: (page: number) => void;
}
export type ProductEntryInput = {
  shop: string;
  year: string;
  make: string;
  model: string;
  driveType: string;
  engineType: string;
  products: {
    productId: string;
    title: string;
  }[];
};