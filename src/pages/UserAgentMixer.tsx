import React, { useState, useCallback, useRef } from "react";
import {
  Shuffle,
  Copy,
  Download,
  Trash2,
  Upload,
  LogOut,
  Plus,
  X,
  Home,
  ToggleRight,
  ToggleLeft,
  File,
} from "lucide-react";
import { useSecurity } from "../contexts/SecurityContext";
import * as XLSX from "xlsx/xlsx.mjs";
import SecurityPopup from "../components/SecurityPopup";
import { Link } from "react-router-dom";

interface DeviceBox {
  id: string;
  name: string;
  userAgents: string[];
}

const UserAgentMixer: React.FC = () => {
  const [deviceBoxes, setDeviceBoxes] = useState<DeviceBox[]>([
    { id: "1", name: "iPhone", userAgents: [] },
    { id: "2", name: "Samsung", userAgents: [] },
    { id: "3", name: "Motorola", userAgents: [] },
  ]);
  const [mixedUserAgents, setMixedUserAgents] = useState<string[]>([]);
  const [newDeviceName, setNewDeviceName] = useState("");
  const [showPopup, setShowPopup] = useState(false);
  const [popupMessage, setPopupMessage] = useState("");
  const [popupType, setPopupType] = useState<"success" | "error" | "warning">(
    "success"
  );
  const { logout } = useSecurity();
  const [autoMix, setAutoMix] = useState(false);
  const [autoCopy, setAutoCopy] = useState(false);
  const [inputText, setInputText] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const showPopupMessage = (
    message: string,
    type: "success" | "error" | "warning"
  ) => {
    setPopupMessage(message);
    setPopupType(type);
    setShowPopup(true);
  };

  const isValidUserAgent = (ua: string): boolean => {
    return (
      typeof ua === "string" &&
      ua.length > 20 &&
      (ua.toLowerCase().includes("mozilla") ||
        ua.toLowerCase().includes("applewebkit") ||
        ua.toLowerCase().includes("chrome"))
    );
  };

  const sanitizeUserAgents = (userAgents: string[]): string[] => {
    const seen = new Set<string>();
    return userAgents
      .map(ua => ua.trim())
      .filter(ua => ua.length > 0)
      .filter(isValidUserAgent)
      .filter(ua => {
        const key = ua.toLowerCase();
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
  };

  const updateDeviceUserAgents = (deviceId: string, text: string) => {
    const userAgents = text.split(/\r?\n/).filter(Boolean);
    const cleanUserAgents = sanitizeUserAgents(userAgents);

    setDeviceBoxes(prev =>
      prev.map(device =>
        device.id === deviceId
          ? { ...device, userAgents: cleanUserAgents }
          : device
      )
    );
  };

  const clearUserAgents = (deviceId: string) => {
    const device = deviceBoxes.find(d => d.id === deviceId);
    if (
      device &&
      window.confirm(
        `Are you sure you want to clear all user agents for "${device.name}"?`
      )
    ) {
      setDeviceBoxes(prev =>
        prev.map(d => (d.id === deviceId ? { ...d, userAgents: [] } : d))
      );
      showPopupMessage(`Cleared user agents for "${device.name}"!`, "success");
    }
  };

  const addDeviceBox = () => {
    if (!newDeviceName.trim()) {
      showPopupMessage("Please enter a device name!", "warning");
      return;
    }

    if (
      deviceBoxes.some(
        device => device.name.toLowerCase() === newDeviceName.toLowerCase()
      )
    ) {
      showPopupMessage("Device name already exists!", "error");
      return;
    }

    const newDevice: DeviceBox = {
      id: Date.now().toString(),
      name: newDeviceName.trim(),
      userAgents: [],
    };

    setDeviceBoxes(prev => [...prev, newDevice]);
    setNewDeviceName("");
    showPopupMessage(
      `Device "${newDevice.name}" added successfully!`,
      "success"
    );
  };

  const removeDeviceBox = (deviceId: string) => {
    const device = deviceBoxes.find(d => d.id === deviceId);
    if (
      device &&
      window.confirm(`Are you sure you want to delete "${device.name}"?`)
    ) {
      setDeviceBoxes(prev => prev.filter(d => d.id !== deviceId));
      showPopupMessage(
        `Device "${device.name}" removed successfully!`,
        "success"
      );
    }
  };

  const pasteUserAgents = async (deviceId: string) => {
    try {
      const text = await navigator.clipboard.readText();
      const device = deviceBoxes.find(d => d.id === deviceId);
      if (device) {
        const existingText = device.userAgents.join("\n");
        const newText = existingText ? `${existingText}\n${text}` : text;
        updateDeviceUserAgents(deviceId, newText);
        showPopupMessage("User agents pasted successfully!", "success");
      }
    } catch (err) {
      showPopupMessage("Failed to paste from clipboard!", "error");
    }
  };

  const uploadFile = (
    event: React.ChangeEvent<HTMLInputElement>,
    deviceId: string
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    const device = deviceBoxes.find(d => d.id === deviceId);

    if (!device) return;

    if (file.name.endsWith(".txt")) {
      reader.onload = () => {
        const text = reader.result as string;
        const existingText = device.userAgents.join("\n");
        const newText = existingText ? `${existingText}\n${text}` : text;
        updateDeviceUserAgents(deviceId, newText);
        showPopupMessage("TXT file uploaded successfully!", "success");
      };
      reader.readAsText(file);
    } else if (file.name.endsWith(".xlsx")) {
      reader.onload = e => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: "array" });
          const worksheet = workbook.Sheets[workbook.SheetNames[0]];
          const jsonData = XLSX.utils.sheet_to_json(worksheet, {
            header: 1,
          }) as string[][];
          const userAgents = jsonData
            .flat()
            .filter(item => typeof item === "string" && item.trim());

          const existingText = device.userAgents.join("\n");
          const newText = existingText
            ? `${existingText}\n${userAgents.join("\n")}`
            : userAgents.join("\n");
          updateDeviceUserAgents(deviceId, newText);
          showPopupMessage("Excel file uploaded successfully!", "success");
        } catch (error) {
          showPopupMessage("Error processing Excel file!", "error");
        }
      };
      reader.readAsArrayBuffer(file);
    }

    event.target.value = "";
  };

  const mixUserAgents = useCallback(() => {
    // Update all device boxes first
    deviceBoxes.forEach(device => {
      const textarea = document.querySelector(
        `#device-${device.id} textarea`
      ) as HTMLTextAreaElement;
      if (textarea) {
        updateDeviceUserAgents(device.id, textarea.value);
      }
    });

    const iphoneDevice = deviceBoxes.find(
      d => d.name.toLowerCase() === "iphone"
    );
    const iphoneList = iphoneDevice ? [...iphoneDevice.userAgents] : [];

    if (!iphoneList.length) {
      showPopupMessage("At least one iPhone user agent is required!", "error");
      return;
    }

    const otherDevices = deviceBoxes
      .filter(d => d.name.toLowerCase() !== "iphone")
      .map(d => ({ name: d.name, list: [...d.userAgents] }))
      .filter(d => d.list.length > 0);

    if (!otherDevices.length) {
      setMixedUserAgents(iphoneList);
      showPopupMessage(
        `Mixed ${iphoneList.length} user agents successfully!`,
        "success"
      );
      return;
    }

    const result: string[] = [];
    let nextOtherIdx = 0;

    while (iphoneList.length || otherDevices.some(d => d.list.length)) {
      const remainingOther = otherDevices.reduce(
        (sum, d) => sum + d.list.length,
        0
      );
      const quota = remainingOther
        ? Math.ceil(iphoneList.length / (remainingOther + 1))
        : iphoneList.length;

      // Add iPhone user agents
      for (let i = 0; i < quota && iphoneList.length; i++) {
        result.push(iphoneList.shift()!);
      }

      // Add one from other devices
      if (remainingOther) {
        let loops = 0;
        while (loops < otherDevices.length) {
          const device = otherDevices[nextOtherIdx];
          nextOtherIdx = (nextOtherIdx + 1) % otherDevices.length;
          loops++;
          if (device.list.length) {
            result.push(device.list.shift()!);
            break;
          }
        }
      }
    }

    setMixedUserAgents(result);
    showPopupMessage(
      `Mixed ${result.length} user agents successfully!`,
      "success"
    );
  }, [deviceBoxes]);

  const copyMixedUserAgents = async () => {
    if (mixedUserAgents.length === 0) {
      showPopupMessage("No mixed user agents to copy!", "warning");
      return;
    }

    try {
      await navigator.clipboard.writeText(mixedUserAgents.join("\n"));
      showPopupMessage("Mixed user agents copied to clipboard!", "success");
    } catch (err) {
      showPopupMessage("Failed to copy user agents!", "error");
    }
  };

  const downloadTxt = () => {
    if (mixedUserAgents.length === 0) {
      showPopupMessage("No mixed user agents to download!", "warning");
      return;
    }

    const blob = new Blob([mixedUserAgents.join("\n")], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "mixed-user-agents.txt";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showPopupMessage("User agents downloaded as TXT file!", "success");
  };

  const downloadExcel = () => {
    if (mixedUserAgents.length === 0) {
      showPopupMessage("No mixed user agents to download!", "warning");
      return;
    }

    try {
      const worksheet = XLSX.utils.aoa_to_sheet(
        mixedUserAgents.map(ua => [ua])
      );
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "UserAgents");
      XLSX.writeFile(workbook, "mixed-user-agents.xlsx");
      showPopupMessage("User agents downloaded as Excel file!", "success");
    } catch (error) {
      showPopupMessage("Error creating Excel file!", "error");
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    const device = deviceBoxes.find(d => d.id === "1");

    if (!device) return;

    if (file.name.endsWith(".txt")) {
      reader.onload = () => {
        const text = reader.result as string;
        const existingText = device.userAgents.join("\n");
        const newText = existingText ? `${existingText}\n${text}` : text;
        updateDeviceUserAgents("1", newText);
        showPopupMessage("TXT file uploaded successfully!", "success");
      };
      reader.readAsText(file);
    } else if (file.name.endsWith(".xlsx")) {
      reader.onload = e => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: "array" });
          const worksheet = workbook.Sheets[workbook.SheetNames[0]];
          const jsonData = XLSX.utils.sheet_to_json(worksheet, {
            header: 1,
          }) as string[][];
          const userAgents = jsonData
            .flat()
            .filter(item => typeof item === "string" && item.trim());

          const existingText = device.userAgents.join("\n");
          const newText = existingText
            ? `${existingText}\n${userAgents.join("\n")}`
            : userAgents.join("\n");
          updateDeviceUserAgents("1", newText);
          showPopupMessage("Excel file uploaded successfully!", "success");
        } catch (error) {
          showPopupMessage("Error processing Excel file!", "error");
        }
      };
      reader.readAsArrayBuffer(file);
    }

    event.target.value = "";
  };

  const pasteFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      const device = deviceBoxes.find(d => d.id === "1");
      if (device) {
        const existingText = device.userAgents.join("\n");
        const newText = existingText ? `${existingText}\n${text}` : text;
        updateDeviceUserAgents("1", newText);
        showPopupMessage("User agents pasted successfully!", "success");
      }
    } catch (err) {
      showPopupMessage("Failed to paste from clipboard!", "error");
    }
  };

  const mixUserAgentsHandler = () => {
    // Update all device boxes first
    deviceBoxes.forEach(device => {
      const textarea = document.querySelector(
        `#device-${device.id} textarea`
      ) as HTMLTextAreaElement;
      if (textarea) {
        updateDeviceUserAgents(device.id, textarea.value);
      }
    });

    const iphoneDevice = deviceBoxes.find(
      d => d.name.toLowerCase() === "iphone"
    );
    const iphoneList = iphoneDevice ? [...iphoneDevice.userAgents] : [];

    if (!iphoneList.length) {
      showPopupMessage("At least one iPhone user agent is required!", "error");
      return;
    }

    const otherDevices = deviceBoxes
      .filter(d => d.name.toLowerCase() !== "iphone")
      .map(d => ({ name: d.name, list: [...d.userAgents] }))
      .filter(d => d.list.length > 0);

    if (!otherDevices.length) {
      setMixedUserAgents(iphoneList);
      showPopupMessage(
        `Mixed ${iphoneList.length} user agents successfully!`,
        "success"
      );
      return;
    }

    const result: string[] = [];
    let nextOtherIdx = 0;

    while (iphoneList.length || otherDevices.some(d => d.list.length)) {
      const remainingOther = otherDevices.reduce(
        (sum, d) => sum + d.list.length,
        0
      );
      const quota = remainingOther
        ? Math.ceil(iphoneList.length / (remainingOther + 1))
        : iphoneList.length;

      // Add iPhone user agents
      for (let i = 0; i < quota && iphoneList.length; i++) {
        result.push(iphoneList.shift()!);
      }

      // Add one from other devices
      if (remainingOther) {
        let loops = 0;
        while (loops < otherDevices.length) {
          const device = otherDevices[nextOtherIdx];
          nextOtherIdx = (nextOtherIdx + 1) % otherDevices.length;
          loops++;
          if (device.list.length) {
            result.push(device.list.shift()!);
            break;
          }
        }
      }
    }

    setMixedUserAgents(result);
    showPopupMessage(
      `Mixed ${result.length} user agents successfully!`,
      "success"
    );
  };

  const copyToClipboard = async () => {
    if (mixedUserAgents.length === 0) {
      showPopupMessage("No mixed user agents to copy!", "warning");
      return;
    }

    try {
      await navigator.clipboard.writeText(mixedUserAgents.join("\n"));
      showPopupMessage("Mixed user agents copied to clipboard!", "success");
    } catch (err) {
      showPopupMessage("Failed to copy user agents!", "error");
    }
  };

  const clearAll = () => {
    setDeviceBoxes(prev => prev.map(d => ({ ...d, userAgents: [] })));
    setMixedUserAgents([]);
    showPopupMessage("All user agents cleared!", "success");
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="flex flex-col md:flex-row justify-between items-center mb-6">
        <h1 className="text-3xl font-bold mb-4 md:mb-0">User Agent Mixer</h1>
        <div className="flex flex-wrap gap-2 justify-center md:justify-end">
          <Link
            to="/"
            className="btn btn-outline-secondary flex items-center gap-2"
          >
            <Home size={20} /> Home
          </Link>
          <button
            onClick={logout}
            className="btn btn-outline-danger flex items-center gap-2"
          >
            <LogOut size={20} /> Logout
          </button>
        </div>
      </div>

      {/* Device Boxes */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {deviceBoxes.map(device => (
          <div
            key={device.id}
            className="bg-white rounded-lg shadow p-4 relative"
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">{device.name}</h3>
              <div className="flex gap-2">
                <button
                  onClick={() => clearUserAgents(device.id)}
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  <Trash2 size={18} className="text-red-500" />
                </button>
                {device.id !== "1" &&
                  device.id !== "2" &&
                  device.id !== "3" && (
                    <button
                      onClick={() => removeDeviceBox(device.id)}
                      className="p-1 hover:bg-gray-100 rounded"
                    >
                      <X size={18} className="text-gray-500" />
                    </button>
                  )}
              </div>
            </div>

            <textarea
              value={device.userAgents.join("\n")}
              onChange={e => updateDeviceUserAgents(device.id, e.target.value)}
              className="w-full h-[150px] p-3 border rounded mb-4 text-sm"
              placeholder={`Paste ${device.name} user agents here...`}
            />

            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => pasteUserAgents(device.id)}
                className="btn btn-secondary flex items-center gap-2 text-sm"
              >
                <File size={16} /> Paste
              </button>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="btn btn-primary flex items-center gap-2 text-sm"
              >
                <Upload size={16} /> Upload
              </button>
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept=".txt,.xlsx"
                onChange={e => uploadFile(e, device.id)}
              />
            </div>
          </div>
        ))}

        {/* Add New Device Box */}
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex gap-2">
            <input
              type="text"
              value={newDeviceName}
              onChange={e => setNewDeviceName(e.target.value)}
              className="flex-1 p-2 border rounded"
              placeholder="Enter device name..."
            />
            <button
              onClick={addDeviceBox}
              className="btn btn-success flex items-center gap-2"
            >
              <Plus size={20} /> Add
            </button>
          </div>
        </div>
      </div>

      {/* Mixed Results Section */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-4">
          <h2 className="text-xl font-semibold">Mixed User Agents</h2>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setAutoMix(!autoMix)}
                className="btn btn-outline-primary flex items-center gap-2"
              >
                {autoMix ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
                Auto Mix
              </button>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setAutoCopy(!autoCopy)}
                className="btn btn-outline-primary flex items-center gap-2"
              >
                {autoCopy ? (
                  <ToggleRight size={20} />
                ) : (
                  <ToggleLeft size={20} />
                )}
                Auto Copy
              </button>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-4">
          <button
            onClick={mixUserAgentsHandler}
            className="btn btn-primary flex items-center gap-2"
          >
            <Shuffle size={20} /> Mix
          </button>
          <button
            onClick={copyMixedUserAgents}
            className="btn btn-secondary flex items-center gap-2"
          >
            <Copy size={20} /> Copy
          </button>
          <button
            onClick={downloadTxt}
            className="btn btn-info flex items-center gap-2"
          >
            <Download size={20} /> TXT
          </button>
          <button
            onClick={downloadExcel}
            className="btn btn-success flex items-center gap-2"
          >
            <Download size={20} /> Excel
          </button>
          <button
            onClick={clearAll}
            className="btn btn-danger flex items-center gap-2"
          >
            <Trash2 size={20} /> Clear
          </button>
        </div>

        <textarea
          value={mixedUserAgents.join("\n")}
          readOnly
          className="w-full h-[200px] p-3 border rounded bg-gray-50"
          placeholder="Mixed user agents will appear here..."
        />
      </div>

      <SecurityPopup
        show={showPopup}
        message={popupMessage}
        type={popupType}
        onClose={() => setShowPopup(false)}
      />
    </div>
  );
};

export default UserAgentMixer;
