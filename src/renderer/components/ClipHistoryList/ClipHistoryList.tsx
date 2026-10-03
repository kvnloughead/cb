import './ClipHistoryList.css';

type Clip = {
  id: number;
  content: string;
};

type ClipHistoryListProps = {
  history: Clip[];
};

export default function ClipHistoryList({ history }: ClipHistoryListProps) {
  return (
    <ul className="clip-history-list">
      {history.map((clip, i) => (
        <li key={clip.id}>
          <p className="truncate-line">{clip.content}</p>
          <button
            type="button"
            className="clip-number"
            aria-label={`select clip ${i + 1}`}
          >
            {i + 1}
          </button>
        </li>
      ))}
    </ul>
  );
}
