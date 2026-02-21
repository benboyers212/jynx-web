"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";

type ChatPanelContextType = {
  isOpen: boolean;
  initialMessage: string;
  openPanel: (message?: string) => void;
  closePanel: () => void;
  togglePanel: () => void;
};

const ChatPanelContext = createContext<ChatPanelContextType | undefined>(undefined);

export function ChatPanelProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [initialMessage, setInitialMessage] = useState("");

  const openPanel = (message?: string) => {
    setInitialMessage(message || "");
    setIsOpen(true);
  };

  const closePanel = () => {
    setIsOpen(false);
    setInitialMessage("");
  };

  const togglePanel = () => setIsOpen((prev) => !prev);

  return (
    <ChatPanelContext.Provider value={{ isOpen, initialMessage, openPanel, closePanel, togglePanel }}>
      {children}
    </ChatPanelContext.Provider>
  );
}

export function useChatPanel() {
  const context = useContext(ChatPanelContext);
  if (!context) {
    throw new Error("useChatPanel must be used within a ChatPanelProvider");
  }
  return context;
}
