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

/** Optional payload for growth-stage (growth check) reports */
export interface ReportGrowthStagePayload {
  soil_condition?: string;
  soil_fertility?: string;
  moisture_content?: string;
  ph_value?: string;
  temperature?: string;
  sunlight?: string;
  humidity?: string;
  broken_branch?: string;
  damaged_bark?: string;
  bent_stem?: string;
  root_exposure?: string;
  roots_exposure?: string;
  odor?: string;
  additional_comments?: string;
  leaf_image_url?: string;
  stem_image_url?: string;
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
  /** Growth-stage (growth check) specific fields; may be at top level or inside location_metadata */
  soil_condition?: string;
  soil_fertility?: string;
  moisture_content?: string;
  ph_value?: string;
  temperature?: string;
  sunlight?: string;
  humidity?: string;
  broken_branch?: string;
  damaged_bark?: string;
  bent_stem?: string;
  root_exposure?: string;
  roots_exposure?: string;
  odor?: string;
  additional_comments?: string;
  leaf_image_url?: string;
  stem_image_url?: string;
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
