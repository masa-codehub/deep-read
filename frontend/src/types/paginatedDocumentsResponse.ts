import type { Document } from './document';

export interface PaginatedDocumentsResponse {
  documents: Document[];
  totalCount: number;
  currentPage: number;
  pageSize: number;
  totalPages: number;
}
