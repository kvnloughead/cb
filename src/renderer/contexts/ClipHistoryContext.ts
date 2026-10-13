import { createContext } from 'react';

type ClipHistoryContextType = {
  clips: Clip[];
  filterQuery: string;
  setClips: React.Dispatch<React.SetStateAction<Clip[]>>;
  setFilterQuery: React.Dispatch<React.SetStateAction<string>>;
};

const clipHistoryDefaults = {
  clips: [],
  filterQuery: '',
  setClips: () => {},
  setFilterQuery: () => {},
};

const ClipHistoryContext =
  createContext<ClipHistoryContextType>(clipHistoryDefaults);

export default ClipHistoryContext;
