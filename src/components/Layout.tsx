import React from "react";
import { useSecurity } from "../contexts/SecurityContext";
import { useTheme } from "../contexts/SecurityContext";
import { useLocation } from "react-router-dom";
import Navbar from "./Navbar";

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { isAuthenticated } = useSecurity();
  const { isDarkMode } = useTheme();
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith("/admin");

  return (
    <div
      className={`min-h-screen flex flex-col ${
        isDarkMode
          ? "bg-gradient-to-br from-gray-900 to-gray-800"
          : "bg-gradient-to-br from-blue-50 via-white to-purple-50"
      }`}
    >
      {isAuthenticated && !isAdminRoute && <Navbar />}
      <div
        className={`flex-grow p-4 ${
          isDarkMode ? "text-white" : "text-gray-800"
        }`}
      >
        {children}
      </div>
    </div>
  );
};

export default Layout;
