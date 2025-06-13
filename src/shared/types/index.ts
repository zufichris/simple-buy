export interface PaginatedResponse<T> {
  items: T[];
  totalItems: number;
  totalPages: number;
  currentPage: number;
  itemsPerPage: number;
}

export interface IBaseRepository<T, C, U> {
  create(createDto: C): Promise<T>;
  findById(id: string): Promise<T | null>;
  findOneBy(criteria: Partial<T>): Promise<T | null>;
  list(criteria?: Partial<T>): Promise<T[]>;
  update(id: string, updateDto: U): Promise<T | null>;
  delete(id: string): Promise<boolean>;
}
