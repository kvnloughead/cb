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
 *
 * @component
 * @example
 * const [page, setPage] = useState(1);
 * return (
 *   <Pagination
 *     totalItems={100}
 *     itemsPerPage={10}
 *     currentPage={page}
 *     onPageChange={setPage}
 *   />
 * )
 *
 * @param {Object} props - Component properties.
 * @param {number} props.totalItems - The total number of records across all pages.
 * @param {number} props.itemsPerPage - The number of rows/items rendered per individual page.
 * @param {number} props.currentPage - The currently active index page (starts at 1).
 * @param {function(number): void} props.onPageChange - Callback triggered when a new page number or navigation arrow is clicked. Receives the targeted page number as an argument.
 * @returns {React.ReactElement|null} The rendered pagination navigation bar, or null if total pages <= 1.
 */
const Pagination = ({
  totalItems,
  itemsPerPage,
  currentPage,
  onPageChange,
}: PaginationProps) => {
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const pageNumbers = Array.from({ length: totalPages }, (_, i) => i + 1);

  if (totalPages <= 1) return null;

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
        {pageNumbers.map((page) => (
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
        ))}
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
