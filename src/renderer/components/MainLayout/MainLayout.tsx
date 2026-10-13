import { useState } from 'react';

import ClipHistoryContext from '../../contexts/ClipHistoryContext';

interface MainLayoutProps {
  header: React.ReactNode;
  main: React.ReactNode;
  footer?: React.ReactNode;
}

/**
 * The main layout component for the application. It renders the header, the
 * main content page component, and a footer. Header and main content are
 * provided as props.
 *
 * This component also provides the {@link ClipHistoryContext} to its children.
 *
 * @component
 * @example
 * ```tsx
 * function App() {
 *   return (
 *     <MainLayout header={<Header />} main={<ClipHistoryPage />} />
 *   );
 * }
 * ```
 */
export default function MainLayout({ header, main, footer }: MainLayoutProps) {
  const [clips, setClips] = useState<Clip[]>([]);
  const [filterQuery, setFilterQuery] = useState<string>('');

  return (
    <ClipHistoryContext.Provider
      value={{
        clips,
        filterQuery,
        setClips,
        setFilterQuery,
      }}
    >
      {header}
      <main className="main">{main}</main>
      {footer}
    </ClipHistoryContext.Provider>
  );
}
