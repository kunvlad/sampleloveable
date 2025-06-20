import React from "react";

export const DeleteDialog = ({
  isOpen,
  onClose,
  onDelete,
  itemName
}: {
  isOpen: boolean;
  onClose: () => void;
  onDelete: () => void;
  itemName?: string;
}) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-sm">
        <h2 className="text-lg font-semibold mb-4">Delete {itemName || 'item'}?</h2>
        <p className="mb-6">Are you sure you want to delete this {itemName || 'item'}? This action cannot be undone.</p>
        <div className="flex justify-end gap-2">
          <button
            className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300"
            onClick={onClose}
            type="button"
          >
            Cancel
          </button>
          <button
            className="px-4 py-2 rounded bg-red-500 text-white hover:bg-red-600"
            onClick={() => { onDelete(); onClose(); }}
            type="button"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};
