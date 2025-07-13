import React from "react";

interface SecurityPopupProps {
  show: boolean;
  message: string;
  type: "success" | "error" | "warning";
  onClose: () => void;
}

const SecurityPopup: React.FC<SecurityPopupProps> = ({
  show,
  message,
  type,
  onClose,
}) => {
  if (!show) return null;

  const bgColor = {
    success: "bg-green-500",
    error: "bg-red-500",
    warning: "bg-yellow-500",
  }[type];

  return (
    <div
      className={`fixed bottom-4 right-4 ${bgColor} text-white px-6 py-3 rounded-lg shadow-lg flex items-center space-x-3`}
    >
      <span>{message}</span>
      <button onClick={onClose} className="text-white hover:text-gray-200">
        ×
      </button>
    </div>
  );
};

export type { SecurityPopupProps };
export default SecurityPopup;
