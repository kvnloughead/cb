import type { Dispatch, SetStateAction } from 'react';
import './Pagination.css';

type PaginationProps = {
  totalItems: number;
  itemsPerPage: number;
  currentPage: number;
  onPageChange: Dispatch<SetStateAction<number>>;
};

/**
 * A reusable presentation component for handling client or server-side pagination.
 */
const Pagination = ({
  totalItems,
  // expectedHeight,
  itemsPerPage,
  currentPage,
  onPageChange,
}: PaginationProps) => {
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  if (totalPages <= 1) return null;

  // Helper logic to compute which page numbers/ellipses to display
  const getPageRange = (): (number | string)[] => {
    const pages: (number | string)[] = [];
    const maxVisiblePages = 5;

    if (totalPages <= maxVisiblePages + 2) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const startPage = Math.max(2, currentPage - 1);
    const endPage = Math.min(totalPages - 1, currentPage + 1);

    pages.push(1);

    if (startPage > 2) {
      pages.push('ellipsis-left');
    } else if (startPage === 2) {
      pages.push(2);
    }

    for (
      let i = Math.max(3, startPage);
      i <= Math.min(totalPages - 2, endPage);
      i++
    ) {
      pages.push(i);
    }

    if (endPage < totalPages - 1) {
      if (endPage === totalPages - 2) {
        pages.push(totalPages - 1);
      } else {
        pages.push('ellipsis-right');
      }
    }

    pages.push(totalPages);
    return pages;
  };

  const visiblePages = getPageRange();

  return (
    <nav className="pagination">
      <button
        type="button"
        aria-label="Previous page"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="next-or-previous-btn current-page"
      >
        Previous
      </button>

      <ul className="page-number-btns">
        {visiblePages.map((page, index) => {
          if (typeof page === 'string') {
            return (
              <li
                key={`${page}-${index}`}
                className="pagination-ellipsis"
                aria-hidden="true"
              >
                &hellip;
              </li>
            );
          }

          return (
            <li key={page}>
              <button
                type="button"
                aria-label={`Go to page ${page}`}
                onClick={() => onPageChange(page)}
                className={`page-number-btn ${currentPage === page ? 'active' : ''}`}
              >
                {page}
              </button>
            </li>
          );
        })}
      </ul>

      <button
        type="button"
        aria-label="Next page"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="next-btn"
      >
        Next
      </button>
    </nav>
  );
};

export default Pagination;
