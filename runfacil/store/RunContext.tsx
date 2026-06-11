import React, { createContext, useContext, useReducer } from 'react';

export type RunStatus = 'idle' | 'running' | 'paused' | 'finished';

export type Coordinate = {
  lat: number;
  lng: number;
  timestamp: number;
  accuracy?: number;
};

type RunState = {
  status: RunStatus;
  startedAt: number | null;
  pausedAt: number | null;
  pausedDuration: number;
  coordinates: Coordinate[];
  heartRate: number | null;
  distance: number;
  pace: number;
};

type RunAction =
  | { type: 'START'; payload: { timestamp: number } }
  | { type: 'PAUSE'; payload: { timestamp: number } }
  | { type: 'RESUME'; payload: { timestamp: number } }
  | { type: 'FINISH' }
  | { type: 'RESET' }
  | { type: 'ADD_COORDINATE'; payload: Coordinate }
  | { type: 'SET_HEART_RATE'; payload: number | null }
  | { type: 'SET_DISTANCE'; payload: number }
  | { type: 'SET_PACE'; payload: number };

const initialState: RunState = {
  status: 'idle',
  startedAt: null,
  pausedAt: null,
  pausedDuration: 0,
  coordinates: [],
  heartRate: null,
  distance: 0,
  pace: 0,
};

function runReducer(state: RunState, action: RunAction): RunState {
  switch (action.type) {
    case 'START':
      return { ...initialState, status: 'running', startedAt: action.payload.timestamp };
    case 'PAUSE':
      return { ...state, status: 'paused', pausedAt: action.payload.timestamp };
    case 'RESUME': {
      const pausedMs = action.payload.timestamp - (state.pausedAt ?? action.payload.timestamp);
      return {
        ...state,
        status: 'running',
        pausedAt: null,
        pausedDuration: state.pausedDuration + pausedMs,
      };
    }
    case 'FINISH':
      return { ...state, status: 'finished' };
    case 'RESET':
      return initialState;
    case 'ADD_COORDINATE':
      return { ...state, coordinates: [...state.coordinates, action.payload] };
    case 'SET_HEART_RATE':
      return { ...state, heartRate: action.payload };
    case 'SET_DISTANCE':
      return { ...state, distance: action.payload };
    case 'SET_PACE':
      return { ...state, pace: action.payload };
    default:
      return state;
  }
}

type RunContextType = {
  state: RunState;
  dispatch: React.Dispatch<RunAction>;
};

const RunContext = createContext<RunContextType | null>(null);

export function RunProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(runReducer, initialState);
  return <RunContext.Provider value={{ state, dispatch }}>{children}</RunContext.Provider>;
}

export function useRun() {
  const ctx = useContext(RunContext);
  if (!ctx) throw new Error('useRun must be used within RunProvider');
  return ctx;
}
