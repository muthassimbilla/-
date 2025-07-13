import React from "react";
import { Link } from "react-router-dom";
import {
  Mail,
  Copy,
  Shuffle,
  Smartphone,
  Type,
  Key,
  Database,
  MapPin,
  AtSign,
  Phone,
  FileCheck,
  Filter,
} from "lucide-react";
import { useTheme } from "../contexts/SecurityContext";

const HomePage: React.FC = () => {
  const { isDarkMode } = useTheme();

  const tools = [
    {
      id: "duplicate-email-checker",
      title: "Email Checker",
      description:
        "Check and remove duplicate emails against database with support for txt and excel files.",
      icon: FileCheck,
      color: "from-amber-500 to-amber-600",
      hoverColor: "hover:from-amber-600 hover:to-amber-700",
      path: "/duplicate-email-checker",
      features: [
        "Database integration",
        "Excel/TXT support",
        "Duplicate tracking",
      ],
    },
    {
      id: "phone-formatter",
      title: "Phone Number Formatter",
      description:
        "Format phone numbers and remove special characters with automatic clipboard support.",
      icon: Phone,
      color: "from-teal-500 to-teal-600",
      hoverColor: "hover:from-teal-600 hover:to-teal-700",
      path: "/phone-formatter",
      features: ["Auto formatting", "History tracking", "Quick copy/paste"],
    },
    {
      id: "email-extractor",
      title: "Email Extractor",
      description:
        "Extract and validate email addresses from any text with advanced filtering options.",
      icon: Mail,
      color: "from-blue-500 to-blue-600",
      hoverColor: "hover:from-blue-600 hover:to-blue-700",
      path: "/email-extractor",
      features: ["Bulk extraction", "Domain filtering", "Export to Excel/TXT"],
    },
    {
      id: "email-provider-extractor",
      title: "Email Provider Extractor",
      description:
        "Extract and categorize emails by provider: Gmail, Yahoo, Hotmail, Outlook with individual downloads.",
      icon: Filter,
      color: "from-violet-500 to-violet-600",
      hoverColor: "hover:from-violet-600 hover:to-violet-700",
      path: "/email-provider-extractor",
      features: [
        "Provider categorization",
        "Individual downloads",
        "Real-time stats",
      ],
    },
    {
      id: "duplicate-remover",
      title: "Duplicate Remover",
      description:
        "Remove duplicate lines and organize your data with intelligent sorting algorithms.",
      icon: Copy,
      color: "from-purple-500 to-purple-600",
      hoverColor: "hover:from-purple-600 hover:to-purple-700",
      path: "/duplicate-remover",
      features: [
        "Smart deduplication",
        "Alphabetical sorting",
        "Statistics tracking",
      ],
    },
    {
      id: "user-agent-mixer",
      title: "User Agent Mixer",
      description:
        "Mix and randomize user agents from different devices for testing purposes.",
      icon: Shuffle,
      color: "from-green-500 to-green-600",
      hoverColor: "hover:from-green-600 hover:to-green-700",
      path: "/user-agent-mixer",
      features: [
        "Device categorization",
        "Random mixing",
        "Bulk import/export",
      ],
    },
    {
      id: "user-agent-generator",
      title: "User Agent Generator",
      description:
        "Generate realistic user agents for iPhone and Samsung devices with authentic patterns.",
      icon: Smartphone,
      color: "from-indigo-500 to-indigo-600",
      hoverColor: "hover:from-indigo-600 hover:to-indigo-700",
      path: "/user-agent-generator",
      features: [
        "iPhone & Samsung support",
        "Realistic patterns",
        "Bulk generation",
      ],
    },
    {
      id: "text-formatter",
      title: "Text Formatter",
      description:
        "Format, clean, and transform text with multiple formatting options.",
      icon: Type,
      color: "from-orange-500 to-orange-600",
      hoverColor: "hover:from-orange-600 hover:to-orange-700",
      path: "/text-formatter",
      features: ["Case conversion", "Text cleaning", "Format validation"],
    },
    {
      id: "password-generator",
      title: "Password Generator",
      description:
        "Generate secure passwords with customizable length and character sets.",
      icon: Key,
      color: "from-red-500 to-red-600",
      hoverColor: "hover:from-red-600 hover:to-red-700",
      path: "/password-generator",
      features: ["Customizable length", "Character options", "Strength meter"],
    },
    {
      id: "email-alias-manager",
      title: "Email Alias Manager",
      description:
        "Create and manage email aliases with Firebase integration for secure storage.",
      icon: Database,
      color: "from-cyan-500 to-cyan-600",
      hoverColor: "hover:from-cyan-600 hover:to-cyan-700",
      path: "/email-alias-manager",
      features: ["Firebase integration", "Google Auth", "Secure storage"],
    },
    {
      id: "us-address-generator",
      title: "US Address Generator",
      description:
        "Generate real US addresses by ZIP code using official Census Bureau data.",
      icon: MapPin,
      color: "from-emerald-500 to-emerald-600",
      hoverColor: "hover:from-emerald-600 hover:to-emerald-700",
      path: "/us-address-generator",
      features: ["Real Census data", "ZIP code lookup", "Copy components"],
    },
    {
      id: "gmail-manager",
      title: "Gmail Manager",
      description:
        "Upload, generate and track Gmail accounts with automatic status management.",
      icon: AtSign,
      color: "from-pink-500 to-pink-600",
      hoverColor: "hover:from-pink-600 hover:to-pink-700",
      path: "/gmail-manager",
      features: [
        "Supabase integration",
        "Status tracking",
        "One-click generation",
      ],
    },
  ];

  return (
    <div className="min-h-screen">
      {/* Tools Grid */}
      <section className="py-6 sm:py-12 md:py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-6 sm:mb-12">
            <h2
              className={`text-2xl sm:text-3xl md:text-4xl font-bold ${
                isDarkMode ? "text-white" : "text-gray-900"
              } mb-2 sm:mb-4`}
            >
              Powerful Tools at Your Fingertips
            </h2>
            <p
              className={`text-sm sm:text-base md:text-xl ${
                isDarkMode ? "text-gray-300" : "text-gray-600"
              } max-w-3xl mx-auto px-4`}
            >
              Choose from our collection of professional-grade tools designed to
              streamline your workflow.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6 lg:gap-8">
            {tools.map(tool => (
              <Link
                key={tool.id}
                to={tool.path}
                className={`group relative ${
                  isDarkMode
                    ? "bg-gray-800 border-gray-700"
                    : "bg-white/80 border-white/20"
                } backdrop-blur-lg rounded-lg sm:rounded-xl md:rounded-2xl p-3 sm:p-4 md:p-6 lg:p-8 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1`}
              >
                <div
                  className={`absolute inset-0 bg-gradient-to-r ${tool.color} opacity-0 group-hover:opacity-10 rounded-lg sm:rounded-xl md:rounded-2xl transition-opacity duration-300`}
                ></div>

                <div className="relative z-10">
                  <div
                    className={`inline-flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-gradient-to-r ${tool.color} text-white shadow-lg mb-3 sm:mb-4`}
                  >
                    <tool.icon className="w-5 h-5 sm:w-6 sm:h-6" />
                  </div>

                  <h3
                    className={`text-base sm:text-lg md:text-xl font-semibold mb-2 ${
                      isDarkMode ? "text-white" : "text-gray-900"
                    }`}
                  >
                    {tool.title}
                  </h3>

                  <p
                    className={`text-xs sm:text-sm md:text-base mb-3 sm:mb-4 ${
                      isDarkMode ? "text-gray-300" : "text-gray-600"
                    }`}
                  >
                    {tool.description}
                  </p>

                  <div className="space-y-1 sm:space-y-2">
                    {tool.features.map((feature, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <div
                          className={`w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-gradient-to-r ${tool.color}`}
                        ></div>
                        <span
                          className={`text-xs sm:text-sm ${
                            isDarkMode ? "text-gray-400" : "text-gray-500"
                          }`}
                        >
                          {feature}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
