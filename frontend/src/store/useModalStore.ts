import { create } from 'zustand';

interface ModalState {
  isOpen: boolean;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'confirm';
  onConfirm: (() => void) | null;
  onCancel: (() => void) | null;
  showAlert: (title: string, message: string, type?: 'info' | 'success' | 'warning' | 'error') => void;
  showConfirm: (title: string, message: string, onConfirm: () => void, onCancel?: () => void) => void;
  closeModal: () => void;
}

export const useModalStore = create<ModalState>((set) => ({
  isOpen: false,
  title: '',
  message: '',
  type: 'info',
  onConfirm: null,
  onCancel: null,
  showAlert: (title, message, type = 'info') => set({
    isOpen: true,
    title,
    message,
    type,
    onConfirm: null,
    onCancel: null
  }),
  showConfirm: (title, message, onConfirm, onCancel) => set({
    isOpen: true,
    title,
    message,
    type: 'confirm',
    onConfirm,
    onCancel: onCancel || null
  }),
  closeModal: () => set({
    isOpen: false,
    title: '',
    message: '',
    type: 'info',
    onConfirm: null,
    onCancel: null
  })
}));
