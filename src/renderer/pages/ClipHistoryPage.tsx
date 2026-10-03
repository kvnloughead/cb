import Header from '../components/Header';
import ClipHistoryList from '../components/ClipHistoryList';

export default function ClipHistoryPage() {
  return (
    <>
      <Header />
      <main className="main">
        <ClipHistoryList
          history={[
            { id: 1, content: 'foo' },
            { id: 2, content: 'bar' },
          ]}
        />
      </main>
    </>
  );
}
