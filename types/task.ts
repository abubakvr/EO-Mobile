/**
 * Task types based on API response
 */

export interface TaskLocation {
  [key: string]: any;
}

export interface TaskCustodian {
  id: number;
  email: string;
  full_name: string;
  phone: string;
}

export interface TaskTree {
  id: number;
  tree_code: string;
  species_id: number;
  species_name: string;
  custodian_id: number;
  custodian: TaskCustodian;
  sponsor_id: number;
  ward_id: number;
  location: TaskLocation;
  date_planted: string;
  growth_stage: string;
  health_status: string;
  land_type: string;
  last_inspected_at: string;
  created_at: string;
  updated_at: string;
}

export interface Task {
  id: number;
  task_id: string;
  task_type: string;
  status: string;
  tree_id: number;
  tree: TaskTree;
  ward_id: number;
  ward_name: string;
  due_date: string;
  created_at: string;
  updated_at: string;
}

export interface TasksResponse {
  data: Task[];
  page: number;
  page_size: number;
  page_count: number;
  total: number;
}

export interface TasksQueryParams {
  page?: number;
  page_size?: number;
  search?: string;
  ward_id?: number;
  status?: string;
  task_type?: string;
  tree_id?: number;
}
