import React, { useState } from "react";
import { NavLink } from "react-router-dom";
import { useSecurity } from "../contexts/SecurityContext";
import { useTheme } from "../contexts/SecurityContext";
import { Sun, Moon, User } from "lucide-react";
import ProLogo from "./ProLogo";
import UserInfoModal from "./UserInfoModal";

const Navbar: React.FC = () => {
  const { isAuthenticated, logout, currentProfile } = useSecurity();
  const { isDarkMode, toggleDarkMode } = useTheme();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showUserInfo, setShowUserInfo] = useState(false);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <nav className="bg-pro-gradient-dark text-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <NavLink to="/" className="flex items-center">
              <ProLogo size="md" variant="light" />
            </NavLink>
          </div>

          <div className="hidden md:block">
            <div className="ml-10 flex items-center space-x-4">
              <NavLink
                to="/"
                className={({ isActive }) =>
                  isActive
                    ? "bg-pro-purple-700 px-3 py-2 rounded-md text-sm font-medium"
                    : "px-3 py-2 rounded-md text-sm font-medium hover:bg-pro-purple-700"
                }
              >
                Home
              </NavLink>

              <NavLink
                to="/gmail-manager"
                className={({ isActive }) =>
                  isActive
                    ? "bg-pro-purple-700 px-3 py-2 rounded-md text-sm font-medium"
                    : "px-3 py-2 rounded-md text-sm font-medium hover:bg-pro-purple-700"
                }
              >
                Gmail Manager
              </NavLink>

              <NavLink
                to="/email-extractor"
                className={({ isActive }) =>
                  isActive
                    ? "bg-pro-purple-700 px-3 py-2 rounded-md text-sm font-medium"
                    : "px-3 py-2 rounded-md text-sm font-medium hover:bg-pro-purple-700"
                }
              >
                Email Extractor
              </NavLink>

              <NavLink
                to="/email-alias-manager"
                className={({ isActive }) =>
                  isActive
                    ? "bg-pro-purple-700 px-3 py-2 rounded-md text-sm font-medium"
                    : "px-3 py-2 rounded-md text-sm font-medium hover:bg-pro-purple-700"
                }
              >
                Email Alias
              </NavLink>

              <NavLink
                to="/user-agent-generator"
                className={({ isActive }) =>
                  isActive
                    ? "bg-pro-purple-700 px-3 py-2 rounded-md text-sm font-medium"
                    : "px-3 py-2 rounded-md text-sm font-medium hover:bg-pro-purple-700"
                }
              >
                User Agent
              </NavLink>

              <NavLink
                to="/password-generator"
                className={({ isActive }) =>
                  isActive
                    ? "bg-pro-purple-700 px-3 py-2 rounded-md text-sm font-medium"
                    : "px-3 py-2 rounded-md text-sm font-medium hover:bg-pro-purple-700"
                }
              >
                Password Gen
              </NavLink>

              <NavLink
                to="/text-formatter"
                className={({ isActive }) =>
                  isActive
                    ? "bg-pro-purple-700 px-3 py-2 rounded-md text-sm font-medium"
                    : "px-3 py-2 rounded-md text-sm font-medium hover:bg-pro-purple-700"
                }
              >
                Text Formatter
              </NavLink>

              <NavLink
                to="/phone-formatter"
                className={({ isActive }) =>
                  isActive
                    ? "bg-pro-purple-700 px-3 py-2 rounded-md text-sm font-medium"
                    : "px-3 py-2 rounded-md text-sm font-medium hover:bg-pro-purple-700"
                }
              >
                Phone Formatter
              </NavLink>

              <NavLink
                to="/duplicate-email-checker"
                className={({ isActive }) =>
                  isActive
                    ? "bg-pro-purple-700 px-3 py-2 rounded-md text-sm font-medium"
                    : "px-3 py-2 rounded-md text-sm font-medium hover:bg-pro-purple-700"
                }
              >
                Email Checker
              </NavLink>

              <NavLink
                to="/email-provider-extractor"
                className={({ isActive }) =>
                  isActive
                    ? "bg-pro-purple-700 px-3 py-2 rounded-md text-sm font-medium"
                    : "px-3 py-2 rounded-md text-sm font-medium hover:bg-pro-purple-700"
                }
              >
                Provider Extractor
              </NavLink>
            </div>
          </div>

          <div className="hidden md:block">
            <div className="ml-4 flex items-center md:ml-6 space-x-3">
              {/* Dark Mode Toggle */}
              <button
                onClick={toggleDarkMode}
                className="p-2 rounded-full bg-pro-purple-800 hover:bg-pro-purple-700 transition-colors duration-200 focus:outline-none"
                aria-label={
                  isDarkMode ? "Switch to light mode" : "Switch to dark mode"
                }
              >
                {isDarkMode ? (
                  <Sun className="h-5 w-5 text-yellow-300" />
                ) : (
                  <Moon className="h-5 w-5 text-white" />
                )}
              </button>

              {isAuthenticated && currentProfile && (
                <button
                  onClick={() => setShowUserInfo(true)}
                  className="p-2 rounded-full bg-pro-purple-800 hover:bg-pro-purple-700 transition-colors duration-200 focus:outline-none"
                  aria-label="Show user information"
                >
                  <User className="h-5 w-5 text-white" />
                </button>
              )}

              {isAuthenticated ? (
                <button
                  onClick={logout}
                  className="px-3 py-2 rounded-md text-sm font-medium bg-red-600 hover:bg-red-700"
                >
                  Logout
                </button>
              ) : (
                <NavLink
                  to="/login"
                  className={({ isActive }) =>
                    isActive
                      ? "bg-pro-purple-700 px-3 py-2 rounded-md text-sm font-medium"
                      : "px-3 py-2 rounded-md text-sm font-medium hover:bg-pro-purple-700"
                  }
                >
                  Login
                </NavLink>
              )}
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center space-x-2">
            {/* Dark Mode Toggle (Mobile) */}
            <button
              onClick={toggleDarkMode}
              className="p-2 rounded-full bg-pro-purple-800 hover:bg-pro-purple-700 transition-colors duration-200 focus:outline-none"
              aria-label={
                isDarkMode ? "Switch to light mode" : "Switch to dark mode"
              }
            >
              {isDarkMode ? (
                <Sun className="h-5 w-5 text-yellow-300" />
              ) : (
                <Moon className="h-5 w-5 text-white" />
              )}
            </button>

            {/* User Info Button (Mobile) */}
            {isAuthenticated && currentProfile && (
              <button
                onClick={() => setShowUserInfo(true)}
                className="p-2 rounded-full bg-pro-purple-800 hover:bg-pro-purple-700 transition-colors duration-200 focus:outline-none"
                aria-label="Show user information"
              >
                <User className="h-5 w-5 text-white" />
              </button>
            )}

            <button
              type="button"
              onClick={toggleMobileMenu}
              className="inline-flex items-center justify-center p-2 rounded-md text-white hover:bg-pro-purple-700 focus:outline-none"
              aria-controls="mobile-menu"
              aria-expanded={isMobileMenuOpen}
            >
              <span className="sr-only">Open main menu</span>
              <svg
                className="block h-6 w-6"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden absolute top-16 left-0 w-full bg-pro-gradient-dark shadow-lg z-50">
          <div className="px-2 pt-2 pb-3 space-y-1">
            <NavLink
              to="/"
              className={({ isActive }) =>
                isActive
                  ? "block bg-pro-purple-700 px-3 py-2 rounded-md text-base font-medium"
                  : "block px-3 py-2 rounded-md text-base font-medium hover:bg-pro-purple-700"
              }
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Home
            </NavLink>

            <NavLink
              to="/gmail-manager"
              className={({ isActive }) =>
                isActive
                  ? "block bg-pro-purple-700 px-3 py-2 rounded-md text-base font-medium"
                  : "block px-3 py-2 rounded-md text-base font-medium hover:bg-pro-purple-700"
              }
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Gmail Manager
            </NavLink>

            <NavLink
              to="/email-extractor"
              className={({ isActive }) =>
                isActive
                  ? "block bg-pro-purple-700 px-3 py-2 rounded-md text-base font-medium"
                  : "block px-3 py-2 rounded-md text-base font-medium hover:bg-pro-purple-700"
              }
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Email Extractor
            </NavLink>

            <NavLink
              to="/email-alias-manager"
              className={({ isActive }) =>
                isActive
                  ? "block bg-pro-purple-700 px-3 py-2 rounded-md text-base font-medium"
                  : "block px-3 py-2 rounded-md text-base font-medium hover:bg-pro-purple-700"
              }
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Email Alias
            </NavLink>

            <NavLink
              to="/user-agent-generator"
              className={({ isActive }) =>
                isActive
                  ? "block bg-pro-purple-700 px-3 py-2 rounded-md text-base font-medium"
                  : "block px-3 py-2 rounded-md text-base font-medium hover:bg-pro-purple-700"
              }
              onClick={() => setIsMobileMenuOpen(false)}
            >
              User Agent
            </NavLink>

            <NavLink
              to="/password-generator"
              className={({ isActive }) =>
                isActive
                  ? "block bg-pro-purple-700 px-3 py-2 rounded-md text-base font-medium"
                  : "block px-3 py-2 rounded-md text-base font-medium hover:bg-pro-purple-700"
              }
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Password Gen
            </NavLink>

            <NavLink
              to="/text-formatter"
              className={({ isActive }) =>
                isActive
                  ? "block bg-pro-purple-700 px-3 py-2 rounded-md text-base font-medium"
                  : "block px-3 py-2 rounded-md text-base font-medium hover:bg-pro-purple-700"
              }
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Text Formatter
            </NavLink>

            <NavLink
              to="/phone-formatter"
              className={({ isActive }) =>
                isActive
                  ? "block bg-pro-purple-700 px-3 py-2 rounded-md text-base font-medium"
                  : "block px-3 py-2 rounded-md text-base font-medium hover:bg-pro-purple-700"
              }
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Phone Formatter
            </NavLink>

            <NavLink
              to="/duplicate-email-checker"
              className={({ isActive }) =>
                isActive
                  ? "block bg-pro-purple-700 px-3 py-2 rounded-md text-base font-medium"
                  : "block px-3 py-2 rounded-md text-base font-medium hover:bg-pro-purple-700"
              }
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Email Checker
            </NavLink>

            <NavLink
              to="/email-provider-extractor"
              className={({ isActive }) =>
                isActive
                  ? "block bg-pro-purple-700 px-3 py-2 rounded-md text-base font-medium"
                  : "block px-3 py-2 rounded-md text-base font-medium hover:bg-pro-purple-700"
              }
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Provider Extractor
            </NavLink>

            {isAuthenticated ? (
              <button
                onClick={() => {
                  logout();
                  setIsMobileMenuOpen(false);
                }}
                className="w-full text-left px-3 py-2 rounded-md text-base font-medium bg-red-600 hover:bg-red-700"
              >
                Logout
              </button>
            ) : (
              <NavLink
                to="/login"
                className={({ isActive }) =>
                  isActive
                    ? "block bg-pro-purple-700 px-3 py-2 rounded-md text-base font-medium"
                    : "block px-3 py-2 rounded-md text-base font-medium hover:bg-pro-purple-700"
                }
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Login
              </NavLink>
            )}
          </div>
        </div>
      )}

      {/* User Info Modal */}
      <UserInfoModal
        show={showUserInfo}
        onClose={() => setShowUserInfo(false)}
        profile={currentProfile}
      />
    </nav>
  );
};

export default Navbar;
