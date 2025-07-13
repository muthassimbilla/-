import React, { useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useSecurity } from "./contexts/SecurityContext";
import LoginPage from "./pages/LoginPage";
import HomePage from "./pages/HomePage";
import EmailExtractor from "./pages/EmailExtractor";
import DuplicateRemover from "./pages/DuplicateRemover";
import UserAgentMixer from "./pages/UserAgentMixer";
import UserAgentGenerator from "./pages/UserAgentGenerator";
import TextFormatter from "./pages/TextFormatter";
import PasswordGenerator from "./pages/PasswordGenerator";
import EmailAliasManager from "./pages/EmailAliasManager";
import USAddressGenerator from "./pages/USAddressGenerator";
import AdminPanel from "./pages/AdminPanel";
import UserAgentAdmin from "./pages/UserAgentAdmin";
import GmailManager from "./pages/GmailManager";
import NotFoundPage from "./pages/NotFoundPage";
import PhoneNumberFormatter from "./pages/PhoneNumberFormatter";
import DuplicateEmailChecker from "./pages/DuplicateEmailChecker";
import EmailProviderExtractor from "./pages/EmailProviderExtractor";
import { applySecurityMeasures } from "./utils/security";
import Layout from "./components/Layout";

function App() {
  const { isAuthenticated } = useSecurity();

  useEffect(() => {
    applySecurityMeasures();
  }, []);

  return (
    <Layout>
      <Routes>
        <Route
          path="/"
          element={isAuthenticated ? <HomePage /> : <LoginPage />}
        />
        <Route
          path="/email-extractor"
          element={isAuthenticated ? <EmailExtractor /> : <LoginPage />}
        />
        <Route
          path="/duplicate-remover"
          element={isAuthenticated ? <DuplicateRemover /> : <LoginPage />}
        />
        <Route
          path="/duplicate-email-checker"
          element={isAuthenticated ? <DuplicateEmailChecker /> : <LoginPage />}
        />
        <Route
          path="/email-provider-extractor"
          element={isAuthenticated ? <EmailProviderExtractor /> : <LoginPage />}
        />
        <Route
          path="/user-agent-mixer"
          element={isAuthenticated ? <UserAgentMixer /> : <LoginPage />}
        />
        <Route
          path="/user-agent-generator"
          element={isAuthenticated ? <UserAgentGenerator /> : <LoginPage />}
        />
        <Route
          path="/text-formatter"
          element={isAuthenticated ? <TextFormatter /> : <LoginPage />}
        />
        <Route
          path="/password-generator"
          element={isAuthenticated ? <PasswordGenerator /> : <LoginPage />}
        />
        <Route
          path="/email-alias-manager"
          element={isAuthenticated ? <EmailAliasManager /> : <LoginPage />}
        />
        <Route
          path="/us-address-generator"
          element={isAuthenticated ? <USAddressGenerator /> : <LoginPage />}
        />
        <Route
          path="/gmail-manager"
          element={isAuthenticated ? <GmailManager /> : <LoginPage />}
        />
        <Route
          path="/phone-formatter"
          element={isAuthenticated ? <PhoneNumberFormatter /> : <LoginPage />}
        />
        <Route path="/admin/billa" element={<AdminPanel />} />
        <Route path="/admin/ua" element={<UserAgentAdmin />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Layout>
  );
}

export default App;
