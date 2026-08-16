import { useState, useEffect, useRef, useCallback } from "react";

export interface Draft {
  id: string;
  timestamp: number;
  type: "auto" | "manual" | "milestone";
  title?: string;
  text: string;
}

export function useDrafts(currentText: string) {
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [lastAutoSave, setLastAutoSave] = useState<number | null>(null);
  
  // Track if auto-save for the exact current text was explicitly suppressed/cleared by the user
  const suppressedAutoSaveTextRef = useRef<string | null>(null);

  // Load drafts on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem("kytario_drafts");
      if (stored) {
        setDrafts(JSON.parse(stored));
      }
    } catch (e) {
      console.error("Could not parse drafts from local storage", e);
    }
  }, []);

  // Sync drafts state directly to localStorage
  useEffect(() => {
    if (drafts.length > 0) {
      localStorage.setItem("kytario_drafts", JSON.stringify(drafts));
    } else {
      localStorage.removeItem("kytario_drafts");
    }
  }, [drafts]);

  // If user empties the editor completely, purge any active auto-saved draft
  useEffect(() => {
    if (!currentText || !currentText.trim()) {
      suppressedAutoSaveTextRef.current = null;
      setDrafts(prev => {
        const remaining = prev.filter(d => d.type !== "auto");
        if (remaining.length !== prev.length) {
          if (remaining.length > 0) {
            localStorage.setItem("kytario_drafts", JSON.stringify(remaining));
          } else {
            localStorage.removeItem("kytario_drafts");
          }
          return remaining;
        }
        return prev;
      });
    } else if (suppressedAutoSaveTextRef.current && currentText !== suppressedAutoSaveTextRef.current) {
      // User typed something new after clearing -> resume normal auto-save
      suppressedAutoSaveTextRef.current = null;
    }
  }, [currentText]);

  // Auto-save every 5 seconds if currentText is not empty and not suppressed
  useEffect(() => {
    if (!currentText || !currentText.trim()) return;

    const interval = setInterval(() => {
      // Skip auto-save if user explicitly cleared/deleted the draft for this exact content
      if (suppressedAutoSaveTextRef.current === currentText) {
        return;
      }

      setDrafts(prev => {
        const now = Date.now();
        setLastAutoSave(now);
        // Remove existing auto-save if any
        const filtered = prev.filter(d => d.type !== "auto");
        const newDraft: Draft = {
          id: `auto-${now}`,
          timestamp: now,
          type: "auto",
          text: currentText,
        };
        const updated = [newDraft, ...filtered];
        localStorage.setItem("kytario_drafts", JSON.stringify(updated));
        return updated;
      });
    }, 5000);

    return () => clearInterval(interval);
  }, [currentText]);

  const saveManualDraft = useCallback(() => {
    if (!currentText || !currentText.trim()) return;
    setDrafts(prev => {
      const now = Date.now();
      const newDraft: Draft = {
        id: `manual-${now}`,
        timestamp: now,
        type: "manual",
        text: currentText,
      };
      // Keep latest 10 manual drafts + auto & milestone drafts
      const manualDrafts = [newDraft, ...prev.filter(d => d.type === "manual")].slice(0, 10);
      const otherDrafts = prev.filter(d => d.type !== "manual");
      const updated = [...otherDrafts, ...manualDrafts].sort((a, b) => b.timestamp - a.timestamp);
      localStorage.setItem("kytario_drafts", JSON.stringify(updated));
      return updated;
    });
  }, [currentText]);

  const saveMilestoneDraft = useCallback((title: string, textToSave?: string) => {
    const text = textToSave !== undefined ? textToSave : currentText;
    if (!text || !text.trim()) return;
    setDrafts(prev => {
      const now = Date.now();
      const newDraft: Draft = {
        id: `milestone-${now}`,
        timestamp: now,
        type: "milestone",
        title,
        text,
      };
      // Keep latest 15 milestone drafts
      const milestones = [newDraft, ...prev.filter(d => d.type === "milestone")].slice(0, 15);
      const others = prev.filter(d => d.type !== "milestone");
      const updated = [...others, ...milestones].sort((a, b) => b.timestamp - a.timestamp);
      localStorage.setItem("kytario_drafts", JSON.stringify(updated));
      return updated;
    });
  }, [currentText]);

  const deleteDraft = useCallback((id: string) => {
    setDrafts(prev => {
      const target = prev.find(d => d.id === id);
      if (target && target.type === "auto") {
        // User explicitly deleted the auto draft -> suppress re-saving until text changes
        suppressedAutoSaveTextRef.current = currentText;
      }
      const updated = prev.filter(d => d.id !== id);
      if (updated.length > 0) {
        localStorage.setItem("kytario_drafts", JSON.stringify(updated));
      } else {
        localStorage.removeItem("kytario_drafts");
      }
      return updated;
    });
  }, [currentText]);

  const clearAllDrafts = useCallback(() => {
    suppressedAutoSaveTextRef.current = currentText;
    setDrafts([]);
    localStorage.removeItem("kytario_drafts");
  }, [currentText]);

  const clearAutoSave = useCallback(() => {
    suppressedAutoSaveTextRef.current = currentText;
    setDrafts(prev => {
      const remaining = prev.filter(d => d.type !== "auto");
      if (remaining.length > 0) {
        localStorage.setItem("kytario_drafts", JSON.stringify(remaining));
      } else {
        localStorage.removeItem("kytario_drafts");
      }
      return remaining;
    });
  }, [currentText]);

  // Save on page unload (refresh/close) ONLY IF not suppressed and not empty
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (!currentText || !currentText.trim()) {
        return;
      }
      if (suppressedAutoSaveTextRef.current === currentText) {
        return;
      }
      const now = Date.now();
      setDrafts(prev => {
        const filtered = prev.filter(d => d.type !== "auto");
        const newDraft = {
          id: `auto-${now}`,
          timestamp: now,
          type: "auto" as const,
          text: currentText,
        };
        const updated = [newDraft, ...filtered];
        localStorage.setItem("kytario_drafts", JSON.stringify(updated));
        return updated;
      });
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [currentText]);

  return {
    drafts,
    lastAutoSave,
    saveManualDraft,
    saveMilestoneDraft,
    deleteDraft,
    clearAllDrafts,
    clearAutoSave
  };
}
