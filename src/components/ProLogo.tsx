import React from "react";

interface ProLogoProps {
  size?: "sm" | "md" | "lg" | "xl";
  variant?: "light" | "dark";
}

const ProLogo: React.FC<ProLogoProps> = ({
  size = "md",
  variant = "light",
}) => {
  const sizeClasses = {
    sm: "h-6",
    md: "h-8",
    lg: "h-12",
    xl: "h-16",
  };

  const textClasses = {
    light: {
      primary: "text-white",
      secondary: "text-pro-purple-200",
    },
    dark: {
      primary: "text-gray-800",
      secondary: "text-pro-purple-600",
    },
  };

  return (
    <div className="flex items-center">
      <div className="relative">
        <svg
          className={`${sizeClasses[size]} ${textClasses[variant].primary}`}
          viewBox="0 0 50 50"
          fill="currentColor"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M25 5C15.6 5 8 12.6 8 22C8 29.3 13.4 35.5 20.5 37.3L25 45L29.5 37.3C36.6 35.5 42 29.3 42 22C42 12.6 34.4 5 25 5ZM25 10C31.6 10 37 15.4 37 22C37 28.6 31.6 34 25 34C18.4 34 13 28.6 13 22C13 15.4 18.4 10 25 10Z"
            fill="currentColor"
          />
          <path
            d="M25 15C21.1 15 18 18.1 18 22C18 25.9 21.1 29 25 29C28.9 29 32 25.9 32 22C32 18.1 28.9 15 25 15Z"
            fill="currentColor"
          />
          <path
            d="M32 18L38 12"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
          />
        </svg>
        <div
          className="absolute top-0 right-0 transform translate-x-1/4 -translate-y-1/4"
          style={{
            filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.2))",
          }}
        >
          <svg
            className={`${
              size === "sm"
                ? "h-3"
                : size === "md"
                ? "h-4"
                : size === "lg"
                ? "h-6"
                : "h-8"
            } ${textClasses[variant].primary}`}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M7 11L12 6L17 11M12 18V7"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </div>
      <div
        className={`ml-2 font-bold ${
          size === "sm"
            ? "text-lg"
            : size === "md"
            ? "text-xl"
            : size === "lg"
            ? "text-2xl"
            : "text-3xl"
        }`}
        style={{
          textShadow:
            variant === "light" ? "0 2px 4px rgba(0,0,0,0.2)" : "none",
        }}
      >
        <span className={textClasses[variant].primary}>B</span>
        <span className={textClasses[variant].secondary}>Tools</span>
      </div>
    </div>
  );
};

export default ProLogo;
