import { createContext } from 'react';

type ClipHistoryContextType = {
  clips: Clip[];
  filterQuery: string;
  setFilterQuery: (query: string) => void;
};

const clipHistoryDefaults = {
  clips: [],
  filterQuery: '',
  setFilterQuery: () => {},
};

const ClipHistoryContext =
  createContext<ClipHistoryContextType>(clipHistoryDefaults);

export default ClipHistoryContext;
