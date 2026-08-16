import { useState, useCallback, useRef } from 'react';

export function useHistory(initialState = '') {
  const [state, setState] = useState(initialState);
  const historyRef = useRef([initialState]);
  const pointerRef = useRef(0);
  const [, forceRender] = useState({});
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const set = useCallback((value: string) => {
    setState(value);
    
    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    timeoutRef.current = setTimeout(() => {
      const history = historyRef.current;
      const pointer = pointerRef.current;
      
      if (history[pointer] !== value) {
        const newHistory = history.slice(0, pointer + 1);
        newHistory.push(value);
        
        if (newHistory.length > 50) newHistory.shift();
        
        historyRef.current = newHistory;
        pointerRef.current = newHistory.length - 1;
        forceRender({});
      }
    }, 500);
  }, []);

  const undo = useCallback(() => {
    if (pointerRef.current > 0) {
      pointerRef.current -= 1;
      forceRender({});
      setState(historyRef.current[pointerRef.current]);
    }
  }, []);

  const redo = useCallback(() => {
    if (pointerRef.current < historyRef.current.length - 1) {
      pointerRef.current += 1;
      forceRender({});
      setState(historyRef.current[pointerRef.current]);
    }
  }, []);

  const saveHistory = useCallback((value: string) => {
    const history = historyRef.current;
    const pointer = pointerRef.current;
    if (history[pointer] !== value) {
      const newHistory = history.slice(0, pointer + 1);
      newHistory.push(value);
      if (newHistory.length > 50) newHistory.shift();
      historyRef.current = newHistory;
      pointerRef.current = newHistory.length - 1;
    }
    setState(value);
  }, []);

  const clearHistory = useCallback((value: string) => {
    historyRef.current = [value];
    pointerRef.current = 0;
    forceRender({});
    setState(value);
  }, []);

  const canUndo = pointerRef.current > 0;
  const canRedo = pointerRef.current < historyRef.current.length - 1;

  return { state, set, undo, redo, canUndo, canRedo, saveHistory, clearHistory };
}
