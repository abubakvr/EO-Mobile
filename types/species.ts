/**
 * Species types based on API response
 */

export interface Species {
  id: number;
  code: string;
  common_name: string;
  scientific_name: string;
}

export interface SpeciesResponse {
  data: Species[];
  page: number;
  page_size: number;
  page_count: number;
  total: number;
}
