/**
 * Tree types based on API response
 */

export interface TreeCustodian {
  id: number;
  full_name: string;
  email: string;
  phone: string;
}

export interface TreeLocation {
  latitude: number;
  longitude: number;
}

export interface Tree {
  id: number;
  tree_code: string | null;
  species_id: number;
  species_name: string;
  custodian_id: number;
  custodian: TreeCustodian;
  ward_id: number;
  sponsor_id: number | null;
  location: TreeLocation;
  date_planted: string;
  growth_stage: string;
  health_status: string;
  land_type: string;
  last_inspected_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface TreesResponse {
  data: Tree[];
  page: number;
  page_size: number;
  page_count: number;
  total: number;
}

export interface TreesQueryParams {
  page?: number;
  page_size?: number;
  search?: string;
  health_status?: string;
  growth_stage?: string;
  ward_id?: number;
  species_id?: number;
}
