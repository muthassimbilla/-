import React from "react";
import { X, User, Calendar, Key, LogOut, MapPin } from "lucide-react";
import { UserProfile } from "../types";
import { useSecurity } from "../contexts/SecurityContext";

interface UserInfoModalProps {
  show: boolean;
  profile: UserProfile | null;
  onClose: () => void;
}

const UserInfoModal: React.FC<UserInfoModalProps> = ({
  show,
  profile,
  onClose,
}) => {
  const { logout } = useSecurity();

  if (!show || !profile) return null;

  // Format expiry date or show "Unlimited" if null
  const formatExpiryDate = (date: string | null) => {
    if (!date) return "Unlimited";
    const expiryDate = new Date(date);
    return expiryDate.toLocaleDateString();
  };

  // Calculate days remaining until expiry
  const getDaysRemaining = () => {
    if (!profile.expiresAt) return null;
    return profile.daysUntilExpiry;
  };

  const daysRemaining = getDaysRemaining();

  return (
    <div
      className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-white/90 rounded-2xl shadow-2xl p-6 max-w-md w-full border border-white/20"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            User Information
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-gray-100 transition-colors duration-200"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="space-y-4">
          <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-xl">
            <User className="w-5 h-5 text-blue-500" />
            <div>
              <div className="text-sm text-gray-500">Name</div>
              <div className="font-medium text-gray-800">{profile.name}</div>
            </div>
          </div>

          <div className="flex items-center space-x-3 p-3 bg-purple-50 rounded-xl">
            <Key className="w-5 h-5 text-purple-500" />
            <div>
              <div className="text-sm text-gray-500">Key ID</div>
              <div className="font-medium text-gray-800">{profile.id}</div>
            </div>
          </div>

          <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-xl">
            <Calendar className="w-5 h-5 text-green-500" />
            <div>
              <div className="text-sm text-gray-500">Validity</div>
              <div className="font-medium text-gray-800">
                {formatExpiryDate(profile.expiresAt)}
                {daysRemaining !== null && (
                  <span className="ml-2 text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full">
                    {daysRemaining} days left
                  </span>
                )}
              </div>
            </div>
          </div>

          {profile.deviceLocation && (
            <div className="flex items-center space-x-3 p-3 bg-blue-50/50 rounded-xl">
              <MapPin className="w-5 h-5 text-blue-500" />
              <div>
                <div className="text-sm text-gray-500">
                  Current Login Location
                </div>
                <div className="font-medium text-gray-800">
                  {profile.deviceLocation.city || "Unknown"},{" "}
                  {profile.deviceLocation.country || "Unknown"}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  IP: {profile.deviceLocation.ip || "Unknown"}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="mt-6 pt-4 border-t border-gray-100">
          <button
            onClick={() => {
              onClose();
              logout();
            }}
            className="w-full flex items-center justify-center space-x-2 bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded-xl transition-colors duration-200"
          >
            <LogOut className="w-4 h-4" />
            <span>Logout</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserInfoModal;
