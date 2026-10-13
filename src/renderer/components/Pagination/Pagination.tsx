import {
  useLayoutEffect,
  useRef,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from 'react';
import './Pagination.css';

/**
 * Props for the generic, client-side `Pagination` component.
 *
 * @typeParam T - The type of one item in the collection being paginated.
 */
type PaginationProps<T> = {
  /** The complete collection to paginate, after any caller-specific filtering
   * or sorting. */
  items: T[];
  /**
   * Number of items currently shown on each page. Keep this in state and
   * update it with `onItemsPerPageChange`; `Pagination` calls that callback
   * when its measured list container or the first rows' dimensions change.
   */
  itemsPerPage: number;
  /** The selected page number, starting at 1. */
  currentPage: number;
  /** Updates the selected page when a page control is used or the collection
   * shrinks. */
  onPageChange: Dispatch<SetStateAction<number>>;
  /** Receives the measured number of rows that fit in the list container. */
  onItemsPerPageChange: Dispatch<SetStateAction<number>>;
  /** CSS class applied to the `<ul>` that contains the rendered rows. */
  containerClassName: string;
  /**
   * Receives the current page's slice after `items`, `currentPage`, or
   * `itemsPerPage` changes. Useful when the caller also needs the visible items
   * outside the render prop, such as for keyboard shortcuts.
   */
  onCurrentPageItemsChange: (items: T[]) => void;
  /**
   * Render function called with the current page's items. It should return the
   * list rows, normally `<li>` elements; the first two rows are measured to
   * determine the vertical row pitch, including the CSS row gap.
   */
  children: (items: T[]) => ReactNode;
};

/**
 * Paginates a collection and renders the current page inside a measured list.
 *
 * The caller owns the collection, current page, and page size as state. This
 * component slices the collection for the selected page, measures the list's
 * available height and row pitch, and reports changes to the page size through
 * `onItemsPerPageChange`. It also renders the previous/next and numbered page
 * controls when the collection spans more than one page.
 *
 * Use `items` for the already-filtered and already-sorted collection. The
 * `containerClassName` should apply the layout and height constraints that
 * define the available area for rows. The render prop should return `<li>`
 * children, as the first two list rows are used to measure how many items fit.
 *
 * @typeParam T - The type of the items in the collection.
 *
 * @example
 * ```tsx
 * type Product = { id: number; name: string };
 *
 * function ProductList({ products }: { products: Product[] }) {
 *   const [currentPage, setCurrentPage] = useState(1);
 *   const [itemsPerPage, setItemsPerPage] = useState(10);
 *   const visibleProducts = useRef<Product[]>([]);
 *
 *   return (
 *     <Pagination
 *       items={products}
 *       currentPage={currentPage}
 *       itemsPerPage={itemsPerPage}
 *       onPageChange={setCurrentPage}
 *       onItemsPerPageChange={setItemsPerPage}
 *       onCurrentPageItemsChange={(items) => {
 *         visibleProducts.current = items;
 *       }}
 *       containerClassName="product-list"
 *     >
 *       {(pageItems) =>
 *         pageItems.map((product) => (
 *           <li key={product.id}>{product.name}</li>
 *         ))
 *       }
 *     </Pagination>
 *   );
 * }
 * ```
 */
const Pagination = <T,>({
  items,
  itemsPerPage,
  currentPage,
  onPageChange,
  onItemsPerPageChange,
  containerClassName,
  onCurrentPageItemsChange,
  children,
}: PaginationProps<T>) => {
  const containerRef = useRef<HTMLUListElement | null>(null);
  const totalPages = Math.ceil(items.length / itemsPerPage);
  const effectivePage = Math.min(currentPage, Math.max(1, totalPages));
  const indexOfLastItem = effectivePage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = items.slice(indexOfFirstItem, indexOfLastItem);

  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const measureItemsPerPage = () => {
      const rows = Array.from(container.children).filter(
        (child): child is HTMLLIElement => child instanceof HTMLLIElement,
      );
      const firstRow = rows[0];
      if (!firstRow) return;

      const firstRowRect = firstRow.getBoundingClientRect();
      const secondRow = rows[1];
      const rowGap = Number.parseFloat(getComputedStyle(container).rowGap) || 0;
      const rowPitch = secondRow
        ? secondRow.getBoundingClientRect().top - firstRowRect.top
        : firstRowRect.height + rowGap;

      if (rowPitch <= 0) return;

      const fittingItems =
        Math.floor((container.clientHeight - firstRowRect.height) / rowPitch) +
        1;
      onItemsPerPageChange(Math.max(1, fittingItems));
    };

    const observer = new ResizeObserver(measureItemsPerPage);
    observer.observe(container);
    Array.from(container.children)
      .filter((child): child is HTMLLIElement => child instanceof HTMLLIElement)
      .slice(0, 2)
      .forEach((row) => observer.observe(row));
    measureItemsPerPage();

    return () => observer.disconnect();
  }, [items, effectivePage, itemsPerPage, onItemsPerPageChange]);

  useLayoutEffect(() => {
    onCurrentPageItemsChange(currentItems);
  }, [currentItems, onCurrentPageItemsChange]);

  useLayoutEffect(() => {
    if (currentPage !== effectivePage) {
      onPageChange(effectivePage);
    }
  }, [currentPage, effectivePage, onPageChange]);

  // Helper logic to compute which page numbers/ellipses to display
  const getPageRange = (): (number | string)[] => {
    const pages: (number | string)[] = [];
    const maxVisiblePages = 5;

    if (totalPages <= maxVisiblePages + 2) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const startPage = Math.max(2, effectivePage - 1);
    const endPage = Math.min(totalPages - 1, effectivePage + 1);

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
    <>
      <ul className={containerClassName} ref={containerRef}>
        {children(currentItems)}
      </ul>
      {totalPages > 1 && (
        <nav className="pagination">
          <button
            type="button"
            aria-label="Previous page"
            onClick={() => onPageChange(effectivePage - 1)}
            disabled={effectivePage === 1}
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
                    className={`page-number-btn ${effectivePage === page ? 'active' : ''}`}
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
            onClick={() => onPageChange(effectivePage + 1)}
            disabled={effectivePage === totalPages}
            className="next-btn"
          >
            Next
          </button>
        </nav>
      )}
    </>
  );
};

export default Pagination;
