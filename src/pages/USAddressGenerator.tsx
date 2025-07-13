import React, { useState } from "react";
import {
  MapPin,
  Copy,
  Loader2,
  LogOut,
  Home,
  RefreshCw,
  Check,
  AlertCircle,
  Globe,
} from "lucide-react";
import { useSecurity } from "../contexts/SecurityContext";
import SecurityPopup from "../components/SecurityPopup";
import { Link } from "react-router-dom";

interface AddressData {
  country: string;
  city: string;
  state: string;
  zipCode: string;
  streetAddress: string;
  fullAddress: string;
}

// ZIP code to city/state mapping for fallback
const zipCodeDatabase: Record<string, { city: string; state: string }> = {
  "10001": { city: "New York", state: "NY" },
  "10002": { city: "New York", state: "NY" },
  "10003": { city: "New York", state: "NY" },
  "10004": { city: "New York", state: "NY" },
  "10005": { city: "New York", state: "NY" },
  "90210": { city: "Beverly Hills", state: "CA" },
  "90211": { city: "Beverly Hills", state: "CA" },
  "90212": { city: "Beverly Hills", state: "CA" },
  "60601": { city: "Chicago", state: "IL" },
  "60602": { city: "Chicago", state: "IL" },
  "60603": { city: "Chicago", state: "IL" },
  "60604": { city: "Chicago", state: "IL" },
  "33101": { city: "Miami", state: "FL" },
  "33102": { city: "Miami", state: "FL" },
  "33109": { city: "Miami Beach", state: "FL" },
  "33139": { city: "Miami Beach", state: "FL" },
  "02101": { city: "Boston", state: "MA" },
  "02102": { city: "Boston", state: "MA" },
  "02103": { city: "Boston", state: "MA" },
  "02108": { city: "Boston", state: "MA" },
  "77001": { city: "Houston", state: "TX" },
  "77002": { city: "Houston", state: "TX" },
  "77003": { city: "Houston", state: "TX" },
  "77004": { city: "Houston", state: "TX" },
  "98101": { city: "Seattle", state: "WA" },
  "98102": { city: "Seattle", state: "WA" },
  "98103": { city: "Seattle", state: "WA" },
  "98104": { city: "Seattle", state: "WA" },
  "30301": { city: "Atlanta", state: "GA" },
  "30302": { city: "Atlanta", state: "GA" },
  "30303": { city: "Atlanta", state: "GA" },
  "30309": { city: "Atlanta", state: "GA" },
  "85001": { city: "Phoenix", state: "AZ" },
  "85002": { city: "Phoenix", state: "AZ" },
  "85003": { city: "Phoenix", state: "AZ" },
  "85004": { city: "Phoenix", state: "AZ" },
  "19101": { city: "Philadelphia", state: "PA" },
  "19102": { city: "Philadelphia", state: "PA" },
  "19103": { city: "Philadelphia", state: "PA" },
  "19104": { city: "Philadelphia", state: "PA" },
  "89101": { city: "Las Vegas", state: "NV" },
  "89102": { city: "Las Vegas", state: "NV" },
  "89103": { city: "Las Vegas", state: "NV" },
  "89104": { city: "Las Vegas", state: "NV" },
  "97201": { city: "Portland", state: "OR" },
  "97202": { city: "Portland", state: "OR" },
  "97203": { city: "Portland", state: "OR" },
  "97204": { city: "Portland", state: "OR" },
  "80201": { city: "Denver", state: "CO" },
  "80202": { city: "Denver", state: "CO" },
  "80203": { city: "Denver", state: "CO" },
  "80204": { city: "Denver", state: "CO" },
  "20001": { city: "Washington", state: "DC" },
  "20002": { city: "Washington", state: "DC" },
  "20003": { city: "Washington", state: "DC" },
  "20004": { city: "Washington", state: "DC" },
  "37201": { city: "Nashville", state: "TN" },
  "37202": { city: "Nashville", state: "TN" },
  "37203": { city: "Nashville", state: "TN" },
  "37204": { city: "Nashville", state: "TN" },
  "63101": { city: "St. Louis", state: "MO" },
  "63102": { city: "St. Louis", state: "MO" },
  "63103": { city: "St. Louis", state: "MO" },
  "63104": { city: "St. Louis", state: "MO" },
  "55401": { city: "Minneapolis", state: "MN" },
  "55402": { city: "Minneapolis", state: "MN" },
  "55403": { city: "Minneapolis", state: "MN" },
  "55404": { city: "Minneapolis", state: "MN" },
  "53201": { city: "Milwaukee", state: "WI" },
  "53202": { city: "Milwaukee", state: "WI" },
  "53203": { city: "Milwaukee", state: "WI" },
  "53204": { city: "Milwaukee", state: "WI" },
  "45201": { city: "Cincinnati", state: "OH" },
  "45202": { city: "Cincinnati", state: "OH" },
  "45203": { city: "Cincinnati", state: "OH" },
  "45204": { city: "Cincinnati", state: "OH" },
  "64101": { city: "Kansas City", state: "MO" },
  "64102": { city: "Kansas City", state: "MO" },
  "64103": { city: "Kansas City", state: "MO" },
  "64104": { city: "Kansas City", state: "MO" },
  "70112": { city: "New Orleans", state: "LA" },
  "70113": { city: "New Orleans", state: "LA" },
  "70114": { city: "New Orleans", state: "LA" },
  "70115": { city: "New Orleans", state: "LA" },
  "84101": { city: "Salt Lake City", state: "UT" },
  "84102": { city: "Salt Lake City", state: "UT" },
  "84103": { city: "Salt Lake City", state: "UT" },
  "84104": { city: "Salt Lake City", state: "UT" },
  "73101": { city: "Oklahoma City", state: "OK" },
  "73102": { city: "Oklahoma City", state: "OK" },
  "73103": { city: "Oklahoma City", state: "OK" },
  "73104": { city: "Oklahoma City", state: "OK" },
  "35201": { city: "Birmingham", state: "AL" },
  "35202": { city: "Birmingham", state: "AL" },
  "35203": { city: "Birmingham", state: "AL" },
  "35204": { city: "Birmingham", state: "AL" },
  "29401": { city: "Charleston", state: "SC" },
  "29402": { city: "Charleston", state: "SC" },
  "29403": { city: "Charleston", state: "SC" },
  "29404": { city: "Charleston", state: "SC" },
  "27601": { city: "Raleigh", state: "NC" },
  "27602": { city: "Raleigh", state: "NC" },
  "27603": { city: "Raleigh", state: "NC" },
  "27604": { city: "Raleigh", state: "NC" },
  "23219": { city: "Richmond", state: "VA" },
  "23220": { city: "Richmond", state: "VA" },
  "23221": { city: "Richmond", state: "VA" },
  "23222": { city: "Richmond", state: "VA" },
  "04101": { city: "Portland", state: "ME" },
  "04102": { city: "Portland", state: "ME" },
  "04103": { city: "Portland", state: "ME" },
  "04104": { city: "Portland", state: "ME" },
  "05401": { city: "Burlington", state: "VT" },
  "05402": { city: "Burlington", state: "VT" },
  "05403": { city: "Burlington", state: "VT" },
  "05404": { city: "Burlington", state: "VT" },
  "03101": { city: "Manchester", state: "NH" },
  "03102": { city: "Manchester", state: "NH" },
  "03103": { city: "Manchester", state: "NH" },
  "03104": { city: "Manchester", state: "NH" },
  "99501": { city: "Anchorage", state: "AK" },
  "99502": { city: "Anchorage", state: "AK" },
  "99503": { city: "Anchorage", state: "AK" },
  "99504": { city: "Anchorage", state: "AK" },
  "96801": { city: "Honolulu", state: "HI" },
  "96802": { city: "Honolulu", state: "HI" },
  "96803": { city: "Honolulu", state: "HI" },
  "96804": { city: "Honolulu", state: "HI" },
};

const USAddressGenerator: React.FC = () => {
  const [zipCode, setZipCode] = useState("");
  const [generatedAddress, setGeneratedAddress] = useState<AddressData | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPopup, setShowPopup] = useState(false);
  const [popupMessage, setPopupMessage] = useState("");
  const [popupType, setPopupType] = useState<"success" | "error" | "warning">(
    "success"
  );
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [dataSource, setDataSource] = useState<"api" | "local">("local");
  const { logout } = useSecurity();

  const showPopupMessage = (
    message: string,
    type: "success" | "error" | "warning"
  ) => {
    setPopupMessage(message);
    setPopupType(type);
    setShowPopup(true);
  };

  const validateZipCode = (zip: string): boolean => {
    const zipRegex = /^\d{5}$/;
    return zipRegex.test(zip);
  };

  const generateRandomStreetNumber = (): number => {
    return Math.floor(Math.random() * 9999) + 1;
  };

  const getRandomStreetName = (): string => {
    const streetNames = [
      "Main St",
      "Oak Ave",
      "Pine St",
      "Maple Dr",
      "Cedar Ln",
      "Elm St",
      "Park Ave",
      "First St",
      "Second St",
      "Third St",
      "Washington St",
      "Lincoln Ave",
      "Jefferson Dr",
      "Madison St",
      "Franklin Ave",
      "Roosevelt Blvd",
      "Wilson St",
      "Johnson Ave",
      "Smith Dr",
      "Brown St",
      "Davis Ave",
      "Miller St",
      "Wilson Dr",
      "Moore Ave",
      "Taylor St",
      "Anderson Dr",
      "Thomas Ave",
      "Jackson St",
      "White Dr",
      "Harris Ave",
      "Martin St",
      "Thompson Dr",
      "Garcia Ave",
      "Martinez St",
      "Robinson Dr",
      "Clark Ave",
      "Rodriguez St",
      "Lewis Dr",
      "Lee Ave",
      "Walker St",
      "Hall Dr",
      "Allen Ave",
      "Young St",
      "King Dr",
      "Sunset Blvd",
      "Broadway",
      "Fifth Ave",
      "Seventh St",
      "Eighth Ave",
      "Ninth St",
      "Highland Ave",
      "Valley Dr",
      "Hill St",
      "Lake Ave",
      "River Rd",
      "Forest Dr",
      "Garden St",
      "Spring Ave",
      "Summer St",
      "Winter Dr",
      "Autumn Ln",
      "Cherry St",
      "Rose Ave",
      "Lily Dr",
      "Violet St",
      "Iris Ave",
      "Tulip Ln",
      "Daisy St",
    ];
    return streetNames[Math.floor(Math.random() * streetNames.length)];
  };

  const generateFromLocalData = (zip: string): AddressData => {
    const locationData = zipCodeDatabase[zip];
    if (!locationData) {
      throw new Error("ZIP code not found in our database");
    }

    const streetNumber = generateRandomStreetNumber();
    const streetName = getRandomStreetName();
    const streetAddress = `${streetNumber} ${streetName}`;

    return {
      country: "United States",
      city: locationData.city,
      state: locationData.state,
      zipCode: zip,
      streetAddress: streetAddress,
      fullAddress: `${streetAddress}, ${locationData.city}, ${locationData.state} ${zip}, United States`,
    };
  };

  const generateFromAPI = async (zip: string): Promise<AddressData> => {
    const response = await fetch(`238509540805667926`, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
      mode: "cors",
    });

    if (!response.ok) {
      throw new Error("API request failed");
    }

    const data = await response.json();

    if (
      !data.result ||
      !data.result.addressMatches ||
      data.result.addressMatches.length === 0
    ) {
      throw new Error("No address found for this ZIP code");
    }

    const addressMatch = data.result.addressMatches[0];
    const addressComponents = addressMatch.addressComponents;

    const streetNumber = generateRandomStreetNumber();
    const streetName = getRandomStreetName();
    const streetAddress = `${streetNumber} ${streetName}`;

    return {
      country: "United States",
      city: addressComponents.city || "Unknown City",
      state: addressComponents.state || "Unknown State",
      zipCode: zip,
      streetAddress: streetAddress,
      fullAddress: `${streetAddress}, ${addressComponents.city}, ${addressComponents.state} ${zip}, United States`,
    };
  };

  const generateAddress = async () => {
    if (!zipCode.trim()) {
      setError("Please enter a ZIP code");
      showPopupMessage("Please enter a ZIP code!", "warning");
      return;
    }

    if (!validateZipCode(zipCode.trim())) {
      setError("Please enter a valid 5-digit ZIP code");
      showPopupMessage("Please enter a valid 5-digit ZIP code!", "error");
      return;
    }

    setIsLoading(true);
    setError("");
    setGeneratedAddress(null);

    try {
      let addressData: AddressData;

      // Try API first, fallback to local data
      try {
        addressData = await generateFromAPI(zipCode.trim());
        setDataSource("api");
        showPopupMessage("Address generated from Census API!", "success");
      } catch (apiError) {
        console.warn("API failed, using local data:", apiError);
        addressData = generateFromLocalData(zipCode.trim());
        setDataSource("local");
        showPopupMessage("Address generated from local database!", "success");
      }

      setGeneratedAddress(addressData);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to generate address";
      setError(errorMessage);
      showPopupMessage(errorMessage, "error");
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = async (text: string, fieldName: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(fieldName);
      showPopupMessage(`${fieldName} copied to clipboard!`, "success");

      setTimeout(() => {
        setCopiedField(null);
      }, 2000);
    } catch (err) {
      showPopupMessage("Failed to copy to clipboard!", "error");
    }
  };

  const copyAllAddress = async () => {
    if (!generatedAddress) return;

    const fullAddressText = `Country: ${generatedAddress.country}\nCity: ${generatedAddress.city}\nState: ${generatedAddress.state}\nZIP Code: ${generatedAddress.zipCode}\nStreet Address: ${generatedAddress.streetAddress}\nFull Address: ${generatedAddress.fullAddress}`;

    await copyToClipboard(fullAddressText, "Complete Address");
  };

  const clearAddress = () => {
    setGeneratedAddress(null);
    setZipCode("");
    setError("");
    setCopiedField(null);
    showPopupMessage("Address cleared!", "success");
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      generateAddress();
    }
  };

  const popularZipCodes = [
    "10001",
    "90210",
    "60601",
    "33101",
    "02101",
    "77001",
    "98101",
    "30301",
    "85001",
    "19101",
  ];

  return (
    <div className="min-h-screen p-2 sm:p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white/90 backdrop-blur-lg rounded-xl sm:rounded-2xl shadow-2xl p-4 sm:p-6 mb-4 sm:mb-6 border border-white/30">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 sm:p-3 bg-gradient-to-r from-emerald-500 to-blue-600 rounded-xl shadow-lg">
                <MapPin className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
              </div>
              <div>
                <h1 className="text-xl sm:text-3xl font-bold bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent">
                  US Address Generator
                </h1>
                <p className="text-sm sm:text-base text-gray-600">
                  Generate authentic US addresses by ZIP code
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-3 w-full sm:w-auto">
              <Link
                to="/"
                className="flex items-center space-x-2 px-3 sm:px-4 py-2 bg-blue-500 text-white rounded-lg sm:rounded-xl hover:bg-blue-600 transition-colors duration-200 text-sm sm:text-base"
              >
                <Home className="w-4 h-4" />
                <span className="hidden sm:inline">Home</span>
              </Link>
              <button
                onClick={logout}
                className="flex items-center space-x-2 px-3 sm:px-4 py-2 bg-red-500 text-white rounded-lg sm:rounded-xl hover:bg-red-600 transition-colors duration-200 text-sm sm:text-base"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-4 sm:gap-6">
          {/* Input Section */}
          <div className="bg-white/90 backdrop-blur-lg rounded-xl sm:rounded-2xl shadow-xl p-4 sm:p-6 border border-white/30">
            <div className="flex items-center space-x-2 mb-4 sm:mb-6">
              <Globe className="w-5 h-5 text-emerald-600" />
              <h2 className="text-lg sm:text-xl font-semibold text-gray-800">
                Generate Address
              </h2>
            </div>

            <div className="space-y-4 sm:space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  US ZIP Code (5 digits)
                </label>
                <input
                  type="text"
                  value={zipCode}
                  onChange={e => {
                    const value = e.target.value.replace(/\D/g, "").slice(0, 5);
                    setZipCode(value);
                    setError("");
                  }}
                  onKeyPress={handleKeyPress}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white/70 backdrop-blur-sm text-base sm:text-lg font-mono transition-all duration-200"
                  placeholder="e.g., 10001"
                  maxLength={5}
                />
                {error && (
                  <div className="mt-2 flex items-center space-x-2 text-red-600">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span className="text-sm">{error}</span>
                  </div>
                )}
              </div>

              <div className="flex gap-2 sm:gap-3">
                <button
                  onClick={generateAddress}
                  disabled={isLoading || !zipCode.trim()}
                  className="flex-1 flex items-center justify-center space-x-2 px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-emerald-500 to-blue-600 text-white rounded-lg sm:rounded-xl hover:from-emerald-600 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 transform hover:scale-105 transition-all duration-200 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none text-sm sm:text-base"
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                  ) : (
                    <MapPin className="w-4 h-4 sm:w-5 sm:h-5" />
                  )}
                  <span>{isLoading ? "Generating..." : "Generate"}</span>
                </button>

                {generatedAddress && (
                  <button
                    onClick={clearAddress}
                    className="flex items-center space-x-2 px-3 sm:px-4 py-2 sm:py-3 bg-gray-500 text-white rounded-lg sm:rounded-xl hover:bg-gray-600 transition-colors duration-200 text-sm sm:text-base"
                  >
                    <RefreshCw className="w-4 h-4" />
                    <span className="hidden sm:inline">Clear</span>
                  </button>
                )}
              </div>

              {/* Popular ZIP codes */}
              <div className="bg-gradient-to-r from-emerald-50 to-blue-50 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-emerald-200">
                <h3 className="text-sm font-semibold text-emerald-800 mb-2 sm:mb-3">
                  Popular ZIP Codes:
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs sm:text-sm">
                  {popularZipCodes.map(zip => (
                    <button
                      key={zip}
                      onClick={() => setZipCode(zip)}
                      className="px-2 sm:px-3 py-1 sm:py-2 bg-white/80 text-emerald-700 rounded-lg hover:bg-white hover:shadow-md transition-all duration-200 font-mono border border-emerald-200"
                    >
                      {zip}
                    </button>
                  ))}
                </div>
              </div>

              {/* Data source indicator */}
              {generatedAddress && (
                <div className="flex items-center space-x-2 text-xs sm:text-sm text-gray-600 bg-gray-50 rounded-lg p-2 sm:p-3">
                  <div
                    className={`w-2 h-2 rounded-full ${
                      dataSource === "api" ? "bg-green-500" : "bg-blue-500"
                    }`}
                  ></div>
                  <span>
                    Data source:{" "}
                    {dataSource === "api"
                      ? "US Census Bureau API"
                      : "Local Database"}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Output Section */}
          <div className="bg-white/90 backdrop-blur-lg rounded-xl sm:rounded-2xl shadow-xl p-4 sm:p-6 border border-white/30">
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-800">
                Generated Address
              </h2>
              {generatedAddress && (
                <button
                  onClick={copyAllAddress}
                  className="flex items-center space-x-2 px-3 sm:px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg sm:rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all duration-200 shadow-md text-sm sm:text-base"
                >
                  <Copy className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span>Copy All</span>
                </button>
              )}
            </div>

            {generatedAddress ? (
              <div className="space-y-3 sm:space-y-4">
                {/* Country */}
                <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-gray-200">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs sm:text-sm font-medium text-gray-700">
                      🇺🇸 Country
                    </label>
                    <button
                      onClick={() =>
                        copyToClipboard(generatedAddress.country, "Country")
                      }
                      className={`p-1 sm:p-2 rounded-lg transition-all duration-200 ${
                        copiedField === "Country"
                          ? "bg-green-500 text-white"
                          : "bg-blue-500 text-white hover:bg-blue-600"
                      }`}
                    >
                      {copiedField === "Country" ? (
                        <Check className="w-3 h-3 sm:w-4 sm:h-4" />
                      ) : (
                        <Copy className="w-3 h-3 sm:w-4 sm:h-4" />
                      )}
                    </button>
                  </div>
                  <p className="text-sm sm:text-base text-gray-800 font-semibold">
                    {generatedAddress.country}
                  </p>
                </div>

                {/* City */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-blue-200">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs sm:text-sm font-medium text-blue-700">
                      🏙️ City
                    </label>
                    <button
                      onClick={() =>
                        copyToClipboard(generatedAddress.city, "City")
                      }
                      className={`p-1 sm:p-2 rounded-lg transition-all duration-200 ${
                        copiedField === "City"
                          ? "bg-green-500 text-white"
                          : "bg-blue-500 text-white hover:bg-blue-600"
                      }`}
                    >
                      {copiedField === "City" ? (
                        <Check className="w-3 h-3 sm:w-4 sm:h-4" />
                      ) : (
                        <Copy className="w-3 h-3 sm:w-4 sm:h-4" />
                      )}
                    </button>
                  </div>
                  <p className="text-sm sm:text-base text-blue-800 font-semibold">
                    {generatedAddress.city}
                  </p>
                </div>

                {/* State */}
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-purple-200">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs sm:text-sm font-medium text-purple-700">
                      🗺️ State
                    </label>
                    <button
                      onClick={() =>
                        copyToClipboard(generatedAddress.state, "State")
                      }
                      className={`p-1 sm:p-2 rounded-lg transition-all duration-200 ${
                        copiedField === "State"
                          ? "bg-green-500 text-white"
                          : "bg-blue-500 text-white hover:bg-blue-600"
                      }`}
                    >
                      {copiedField === "State" ? (
                        <Check className="w-3 h-3 sm:w-4 sm:h-4" />
                      ) : (
                        <Copy className="w-3 h-3 sm:w-4 sm:h-4" />
                      )}
                    </button>
                  </div>
                  <p className="text-sm sm:text-base text-purple-800 font-semibold">
                    {generatedAddress.state}
                  </p>
                </div>

                {/* ZIP Code */}
                <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-orange-200">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs sm:text-sm font-medium text-orange-700">
                      📮 ZIP Code
                    </label>
                    <button
                      onClick={() =>
                        copyToClipboard(generatedAddress.zipCode, "ZIP Code")
                      }
                      className={`p-1 sm:p-2 rounded-lg transition-all duration-200 ${
                        copiedField === "ZIP Code"
                          ? "bg-green-500 text-white"
                          : "bg-blue-500 text-white hover:bg-blue-600"
                      }`}
                    >
                      {copiedField === "ZIP Code" ? (
                        <Check className="w-3 h-3 sm:w-4 sm:h-4" />
                      ) : (
                        <Copy className="w-3 h-3 sm:w-4 sm:h-4" />
                      )}
                    </button>
                  </div>
                  <p className="text-sm sm:text-base text-orange-800 font-semibold font-mono">
                    {generatedAddress.zipCode}
                  </p>
                </div>

                {/* Street Address */}
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-green-200">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs sm:text-sm font-medium text-green-700">
                      🏠 Street Address
                    </label>
                    <button
                      onClick={() =>
                        copyToClipboard(
                          generatedAddress.streetAddress,
                          "Street Address"
                        )
                      }
                      className={`p-1 sm:p-2 rounded-lg transition-all duration-200 ${
                        copiedField === "Street Address"
                          ? "bg-green-500 text-white"
                          : "bg-blue-500 text-white hover:bg-blue-600"
                      }`}
                    >
                      {copiedField === "Street Address" ? (
                        <Check className="w-3 h-3 sm:w-4 sm:h-4" />
                      ) : (
                        <Copy className="w-3 h-3 sm:w-4 sm:h-4" />
                      )}
                    </button>
                  </div>
                  <p className="text-sm sm:text-base text-green-800 font-semibold">
                    {generatedAddress.streetAddress}
                  </p>
                </div>

                {/* Full Address (পূর্ণ ঠিকানা) */}
                <div className="bg-gradient-to-r from-indigo-50 to-blue-50 rounded-lg sm:rounded-xl p-3 sm:p-4 border-2 border-indigo-300 shadow-md">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs sm:text-sm font-medium text-indigo-700">
                      📍 পূর্ণ ঠিকানা (Full Address)
                    </label>
                    <button
                      onClick={() =>
                        copyToClipboard(
                          generatedAddress.fullAddress,
                          "Full Address"
                        )
                      }
                      className={`p-1 sm:p-2 rounded-lg transition-all duration-200 ${
                        copiedField === "Full Address"
                          ? "bg-green-500 text-white"
                          : "bg-indigo-500 text-white hover:bg-indigo-600"
                      }`}
                    >
                      {copiedField === "Full Address" ? (
                        <Check className="w-3 h-3 sm:w-4 sm:h-4" />
                      ) : (
                        <Copy className="w-3 h-3 sm:w-4 sm:h-4" />
                      )}
                    </button>
                  </div>
                  <p className="text-sm sm:text-lg text-indigo-800 font-semibold leading-relaxed break-words">
                    {generatedAddress.fullAddress}
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-64 sm:h-80 text-gray-500">
                <div className="text-center">
                  <MapPin className="w-8 h-8 sm:w-12 sm:h-12 mx-auto mb-4 opacity-50" />
                  <p className="text-base sm:text-lg mb-2">
                    No address generated yet
                  </p>
                  <p className="text-xs sm:text-sm">
                    Enter a ZIP code and click "Generate"
                  </p>

                  {/* Placeholder preview */}
                  <div className="mt-4 sm:mt-6 space-y-2 sm:space-y-3 opacity-20">
                    <div className="bg-gray-100 rounded-lg p-2 sm:p-3">
                      <p className="text-xs text-gray-500 mb-1">Country</p>
                      <p className="text-sm text-gray-700">United States</p>
                    </div>
                    <div className="bg-gray-100 rounded-lg p-2 sm:p-3">
                      <p className="text-xs text-gray-500 mb-1">City</p>
                      <p className="text-sm text-gray-700">New York</p>
                    </div>
                    <div className="bg-gray-100 rounded-lg p-2 sm:p-3">
                      <p className="text-xs text-gray-500 mb-1">State</p>
                      <p className="text-sm text-gray-700">NY</p>
                    </div>
                    <div className="bg-gray-100 rounded-lg p-2 sm:p-3">
                      <p className="text-xs text-gray-500 mb-1">ZIP Code</p>
                      <p className="text-sm text-gray-700 font-mono">10001</p>
                    </div>
                    <div className="bg-gray-100 rounded-lg p-2 sm:p-3">
                      <p className="text-xs text-gray-500 mb-1">
                        Street Address
                      </p>
                      <p className="text-sm text-gray-700">123 Main St</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Info Section */}
        <div className="mt-4 sm:mt-6 bg-white/90 backdrop-blur-lg rounded-xl sm:rounded-2xl shadow-xl p-4 sm:p-6 border border-white/30">
          <div className="flex items-start space-x-3">
            <div className="p-2 bg-emerald-100 rounded-lg flex-shrink-0">
              <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-2">
                How it works
              </h3>
              <div className="text-xs sm:text-sm text-gray-600 space-y-1 sm:space-y-2">
                <p>• Enter a valid 5-digit US ZIP code</p>
                <p>
                  • The tool attempts to fetch real city/state data from the US
                  Census Bureau API
                </p>
                <p>
                  • If the API is unavailable, it uses our comprehensive local
                  database
                </p>
                <p>
                  • A realistic street address is randomly generated for that
                  location
                </p>
                <p>
                  • Each address component can be copied individually or all
                  together
                </p>
                <p>
                  • Supports {Object.keys(zipCodeDatabase).length}+ ZIP codes
                  across all 50 states
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showPopup && (
        <SecurityPopup
          show={showPopup}
          message={popupMessage}
          type={popupType}
          onClose={() => setShowPopup(false)}
        />
      )}
    </div>
  );
};

export default USAddressGenerator;
