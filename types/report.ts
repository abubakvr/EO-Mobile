/**
 * Report types based on API response
 */

export interface ReportCoordinates {
  latitude: number;
  longitude: number;
}

export interface ReportLocationMetadata {
  [key: string]: any;
}

export interface ReportCustodian {
  id: number;
  email: string;
  full_name: string;
  phone: string;
}

export interface ReportTree {
  id: number;
  tree_code: string;
  species_id: number;
  species_name: string;
  custodian_id: number;
  custodian: ReportCustodian;
  sponsor_id: number;
  ward_id: number;
  location: {
    [key: string]: any;
  };
  date_planted: string;
  growth_stage: string;
  health_status: string;
  land_type: string;
  last_inspected_at: string;
  created_at: string;
  updated_at: string;
}

export interface Report {
  id: number;
  report_type: string;
  status: string;
  task_id: number;
  species_id: number;
  species_name: string;
  ward_name: string;
  is_accessible: boolean;
  accessibility_reason?: string;
  coordinates: ReportCoordinates;
  location_accuracy: number;
  location_metadata: ReportLocationMetadata;
  damaged_destroyed?: string;
  missing_tree?: string;
  others?: string;
  report_image_urls: string[];
  tree: ReportTree;
  created_at: string;
  updated_at: string;
}

export interface ReportsResponse {
  data: Report[];
  page: number;
  page_size: number;
  page_count: number;
  total: number;
}

export interface ReportsQueryParams {
  page?: number;
  page_size?: number;
  search?: string;
  ward_id?: number;
  species_id?: number;
}
