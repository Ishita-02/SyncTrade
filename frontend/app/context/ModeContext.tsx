"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";

// Changed to lowercase to match your snippets
type ViewMode = "follower" | "leader";

interface ModeContextType {
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  activeStrategyId: number | null; 
  setActiveStrategyId: (id: number | null) => void;
}

const ModeContext = createContext<ModeContextType | undefined>(undefined);

export function ModeProvider({ children }: { children: ReactNode }) {
  const [viewMode, setViewMode] = useState<ViewMode>("follower"); // Default to follower
  const [activeStrategyId, setActiveStrategyId] = useState<number | null>(null);

  return (
    <ModeContext.Provider 
      value={{ 
        viewMode, 
        setViewMode, 
        activeStrategyId, 
        setActiveStrategyId 
      }}
    >
      {children}
    </ModeContext.Provider>
  );
}

export function useMode() {
  const context = useContext(ModeContext);
  if (!context) {
    throw new Error("useMode must be used within a ModeProvider");
  }
  return context;
}