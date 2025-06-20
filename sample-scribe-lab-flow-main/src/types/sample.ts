
export interface Sample {
  id: string;
  barcode: string;
  name: string;
  sampleType: 'blank' | 'system-suitability' | 'control' | 'calibration' | 'unknown' | 'sample';
  status: 'created' | 'imported' | 'prepared' | 'analyzed' | 'split' | 'merged' | 'transferred';
  createdAt: Date;
  volume: number; // in μL
  concentration: number | null; // in mg/mL, calculated from weight/volume
  position: string | null; // HPLC position
  parentId: string | null;
  isParent: boolean;
  weight: number | null; // in mg
  concentrations?: { [compound: string]: number }; // for merged samples with multiple compounds
  compounds?: string[]; // list of compound names for better tracking
  tags?: string[]; // e.g. ['imported']
}

export interface HPLCPosition {
  vial: number;
  sample: Sample;
}

export interface ActivityLogEntry {
  id: string;
  timestamp: Date;
  action: 'created' | 'split' | 'merged' | 'transferred' | 'weight_added' | 'volume_added' | 'renamed' | 'diluted';
  sampleId: string;
  sampleBarcode: string;
  details: string;
  metadata?: any;
}

export interface PartialMergeData {
  sampleId: string;
  volume: number;
  sampleName: string;
  concentration?: number;
  compound?: string;
}

