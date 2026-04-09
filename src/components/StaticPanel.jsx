import React from "react";
import { X, Shield, FileText, HelpCircle, Info } from "lucide-react";
import OverlayPage from "./OverlayPage";

const CONTENT = {
  privacy: {
    title: "Privacy Policy",
    icon: <Shield size={48} color="var(--accent)" />,
    text: "Your privacy is our top priority. We use end-to-end encryption for all your personal chats to ensure that only you and the person you are communicating with can read or listen to what is sent. We do not sell your personal data to advertisers. Your messages, photos, and files are stored securely on our servers solely for the purpose of synchronizing across your devices."
  },
  terms: {
    title: "Terms of Service",
    icon: <FileText size={48} color="var(--accent)" />,
    text: "By using our Chat Application, you agree to abide by our community guidelines. You are responsible for all activity that occurs under your account. We reserve the right to suspend or terminate accounts that engage in illegal activities, spamming, or harassment of other users. Your use of this service is at your own risk."
  },
  help: {
    title: "Help Center",
    icon: <HelpCircle size={48} color="var(--accent)" />,
    text: "Need assistance? Our support team is here to help you 24/7. Whether you're having trouble with your account, found a bug, or just want to suggest a feature, you can reach out to us. Check our FAQ section for instant answers to the most common questions regarding connectivity, features, and security."
  },
  about: {
    title: "About Chat App",
    icon: <Info size={48} color="var(--accent)" />,
    text: "Version 2.5.0\n\nThis Chat Application is a high-performance, secure, and modern communication platform designed for individuals and teams. Built with the latest web technologies, we aim to provide a seamless messaging experience with real-time synchronize, voice/video calls, and theme customization. Thank you for being a part of our journey."
  }
};

function StaticPanel({ type, onClose }) {
  const content = CONTENT[type] || CONTENT.about;

  return (
    <OverlayPage onClose={onClose}>
      <div className="side-panel__header">
        <button className="icon-button header-close-btn" type="button" onClick={onClose} aria-label="Close">
          <X size={24} />
        </button>
        <h2>{content.title}</h2>
      </div>

      <div className="side-panel__body" style={{ padding: "32px 24px", textAlign: "center" }}>
        <div style={{ marginBottom: "24px", display: "flex", justifyContent: "center" }}>
          {content.icon}
        </div>
        <h1 style={{ fontSize: "24px", marginBottom: "16px" }}>{content.title}</h1>
        <div style={{ 
          fontSize: "16px", 
          lineHeight: "1.6", 
          color: "var(--text-secondary)", 
          textAlign: "left",
          whiteSpace: "pre-wrap"
        }}>
          {content.text}
        </div>
        
        <div style={{ marginTop: "48px", borderTop: "1px solid var(--border-color)", padding: "24px 0" }}>
          <p style={{ fontSize: "12px", color: "var(--text-muted)" }}>
            © 2026 Chat App. All rights reserved.
          </p>
        </div>
      </div>
    </OverlayPage>
  );
}

export default StaticPanel;
