import React, { createContext, useContext, useState, useCallback, type ReactNode } from "react";

interface ModalContextType {
  isAnyModalOpen: boolean;
  openModal: () => void;
  closeModal: () => void;
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

export const useModal = () => {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error("useModal must be used within a ModalProvider");
  }
  return context;
};

interface ModalProviderProps {
  children: ReactNode;
}

export const ModalProvider: React.FC<ModalProviderProps> = ({ children }) => {
  const [isAnyModalOpen, setIsAnyModalOpen] = useState(false);

  const openModal = useCallback(() => {
    setIsAnyModalOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setIsAnyModalOpen(false);
  }, []);

  return (
    <ModalContext.Provider value={{ isAnyModalOpen, openModal, closeModal }}>
      {children}
    </ModalContext.Provider>
  );
};
