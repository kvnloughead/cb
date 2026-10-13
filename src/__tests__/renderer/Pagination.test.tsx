import '@testing-library/jest-dom';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import Pagination from '../../renderer/components/Pagination/Pagination';

type Item = {
  id: number;
  label: string;
};

const items: Item[] = Array.from({ length: 8 }, (_, index) => ({
  id: index + 1,
  label: `item ${index + 1}`,
}));

class MockResizeObserver implements ResizeObserver {
  static instances: MockResizeObserver[] = [];

  constructor(private callback: ResizeObserverCallback) {
    MockResizeObserver.instances.push(this);
  }

  observe() {}
  unobserve() {}
  disconnect() {}

  trigger() {
    this.callback([], this);
  }
}

type PaginationHarnessProps = {
  items?: Item[];
  initialPage?: number;
  initialItemsPerPage?: number;
  onVisibleItemsChange?: (items: Item[]) => void;
};

function PaginationHarness({
  items: harnessItems = items,
  initialPage = 1,
  initialItemsPerPage = 2,
  onVisibleItemsChange = () => {},
}: PaginationHarnessProps) {
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [itemsPerPage, setItemsPerPage] = useState(initialItemsPerPage);

  return (
    <Pagination
      items={harnessItems}
      itemsPerPage={itemsPerPage}
      currentPage={currentPage}
      onPageChange={setCurrentPage}
      onItemsPerPageChange={setItemsPerPage}
      onCurrentPageItemsChange={onVisibleItemsChange}
      containerClassName="test-list"
    >
      {(pageItems) =>
        pageItems.map((item) => <li key={item.id}>{item.label}</li>)
      }
    </Pagination>
  );
}

describe('Pagination', () => {
  let containerHeight = 40;

  beforeEach(() => {
    containerHeight = 40;
    MockResizeObserver.instances = [];
    Object.defineProperty(globalThis, 'ResizeObserver', {
      configurable: true,
      value: MockResizeObserver,
    });
    jest
      .spyOn(HTMLElement.prototype, 'clientHeight', 'get')
      .mockImplementation(function (this: HTMLElement) {
        return this.classList.contains('test-list') ? containerHeight : 0;
      });
    jest
      .spyOn(HTMLElement.prototype, 'getBoundingClientRect')
      .mockImplementation(function (this: HTMLElement) {
        const rowIndex = this.parentElement?.classList.contains('test-list')
          ? Array.from(this.parentElement.children).indexOf(this)
          : -1;
        const top = rowIndex >= 0 ? rowIndex * 20 : 0;
        return new DOMRect(0, top, 100, 10);
      });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('renders the current page and changes pages from the controls', () => {
    const onVisibleItemsChange = jest.fn();
    render(<PaginationHarness onVisibleItemsChange={onVisibleItemsChange} />);

    expect(screen.getByText('item 1')).toBeInTheDocument();
    expect(screen.getByText('item 2')).toBeInTheDocument();
    expect(screen.queryByText('item 3')).not.toBeInTheDocument();
    expect(onVisibleItemsChange).toHaveBeenLastCalledWith(items.slice(0, 2));

    fireEvent.click(screen.getByRole('button', { name: 'Go to page 2' }));

    expect(screen.getByText('item 3')).toBeInTheDocument();
    expect(screen.getByText('item 4')).toBeInTheDocument();
    expect(screen.queryByText('item 2')).not.toBeInTheDocument();
    expect(onVisibleItemsChange).toHaveBeenLastCalledWith(items.slice(2, 4));
  });

  it('disables previous and next controls at the first and last pages', () => {
    render(<PaginationHarness />);

    expect(
      screen.getByRole('button', { name: 'Previous page' }),
    ).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Next page' })).toBeEnabled();

    fireEvent.click(screen.getByRole('button', { name: 'Go to page 4' }));

    expect(screen.getByRole('button', { name: 'Previous page' })).toBeEnabled();
    expect(screen.getByRole('button', { name: 'Next page' })).toBeDisabled();
  });

  it('updates the page size when the measured container resizes', () => {
    containerHeight = 100;
    render(<PaginationHarness />);

    expect(screen.getByText('item 5')).toBeInTheDocument();
    expect(screen.queryByText('item 6')).not.toBeInTheDocument();

    containerHeight = 60;
    const observer = MockResizeObserver.instances.at(-1);
    if (!observer) throw new Error('Expected a ResizeObserver instance');
    act(() => observer.trigger());

    expect(screen.getByText('item 3')).toBeInTheDocument();
    expect(screen.queryByText('item 4')).not.toBeInTheDocument();
  });

  it('clamps the current page when the collection shrinks', () => {
    const { rerender } = render(
      <PaginationHarness initialPage={3} initialItemsPerPage={2} />,
    );

    expect(screen.getByText('item 5')).toBeInTheDocument();

    rerender(
      <PaginationHarness
        items={items.slice(0, 4)}
        initialPage={3}
        initialItemsPerPage={2}
      />,
    );

    expect(screen.getByText('item 3')).toBeInTheDocument();
    expect(screen.getByText('item 4')).toBeInTheDocument();
    expect(screen.queryByText('item 5')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Go to page 2' })).toHaveClass(
      'active',
    );
  });

  it('hides pagination controls when all items fit on one page', () => {
    render(
      <Pagination
        items={items.slice(0, 2)}
        itemsPerPage={2}
        currentPage={1}
        onPageChange={jest.fn()}
        onItemsPerPageChange={jest.fn()}
        onCurrentPageItemsChange={jest.fn()}
        containerClassName="test-list"
      >
        {(pageItems) =>
          pageItems.map((item) => <li key={item.id}>{item.label}</li>)
        }
      </Pagination>,
    );

    expect(screen.queryByRole('navigation')).not.toBeInTheDocument();
    expect(screen.getByText('item 1')).toBeInTheDocument();
    expect(screen.getByText('item 2')).toBeInTheDocument();
  });
});
