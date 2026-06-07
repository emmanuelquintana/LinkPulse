/**
 * Forma estándar que devuelven los endpoints paginados antes de que el
 * `TransformInterceptor` la traduzca a `data` + `metadata`.
 */
export interface PaginatedResult<T> {
  items: T[];
  page: number;
  size: number;
  elements: number;
}
