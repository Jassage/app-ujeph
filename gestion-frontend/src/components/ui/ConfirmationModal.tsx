import React from "react";
import { AlertTriangle } from "lucide-react";
import Modal from "./Modal";

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
}

export default function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = "Supprimer",
  cancelLabel = "Annuler",
}: ConfirmationModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <div className="space-y-4">
        <div className="flex items-center space-x-3 text-amber-600 dark:text-amber-400">
          <AlertTriangle size={24} />
          <p className="text-sm">{message}</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={onConfirm}
            className="flex-1 px-2 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
          >
            {confirmLabel}
          </button>
          <button
            onClick={onClose}
            className="flex-1 px-2 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
          >
            {cancelLabel}
          </button>
        </div>
      </div>
    </Modal>
  );
}
