import { createContext } from 'react';

type ClipHistoryContextType = {
  clips: Clip[];
  filterClips: (query: string) => void;
};

const clipHistoryDefaults = {
  clips: [],
  filterClips: () => {},
};

const ClipHistoryContext =
  createContext<ClipHistoryContextType>(clipHistoryDefaults);

export default ClipHistoryContext;
