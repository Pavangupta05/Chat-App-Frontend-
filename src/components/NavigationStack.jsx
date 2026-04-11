import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import SettingsPanel from "./SettingsPanel";
import ProfilePanel from "./ProfilePanel";
import StaticPanel from "./StaticPanel";

/**
 * NavigationStack - Manages the stack of overlay pages based on URL.
 * 
 * It keeps track of overlay routes and renders them using AnimatePresence.
 */
const NavigationStack = ({ theme, onThemeToggle, onLogout, backgroundDoodle, onBackgroundChange }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const handleClose = () => {
    const path = location.pathname;
    
    // BACK NAVIGATION LOGIC
    if (path.startsWith("/profile/edit")) {
      navigate("/profile");
    } else if (path === "/profile" || path === "/settings") {
      navigate("/chat");
    } else if (path.startsWith("/settings/")) {
      // Swipe back from Privacy/Terms goes back to Settings
      navigate("/settings");
    } else {
      navigate("/chat");
    }
  };

  return (
    <AnimatePresence mode="wait">
      {location.pathname === "/settings" && (
        <SettingsPanel 
          key="settings"
          isOpen={true} 
          onClose={handleClose}
          theme={theme}
          onThemeToggle={onThemeToggle}
          onLogout={onLogout}
          backgroundDoodle={backgroundDoodle}
          onBackgroundChange={onBackgroundChange}
        />
      )}
      
      {location.pathname === "/profile" && (
        <ProfilePanel 
          key="profile"
          isOpen={true} 
          onClose={handleClose} 
        />
      )}

      {location.pathname === "/profile/edit" && (
        <ProfilePanel 
          key="profile-edit"
          isOpen={true} 
          onClose={handleClose}
          editMode={true}
        />
      )}

      {/* Static Info Pages */}
      {location.pathname === "/settings/privacy" && (
        <StaticPanel key="privacy" type="privacy" onClose={handleClose} />
      )}
      {location.pathname === "/settings/terms" && (
        <StaticPanel key="terms" type="terms" onClose={handleClose} />
      )}
      {location.pathname === "/settings/help" && (
        <StaticPanel key="help" type="help" onClose={handleClose} />
      )}
      {location.pathname === "/settings/about" && (
        <StaticPanel key="about" type="about" onClose={handleClose} />
      )}
    </AnimatePresence>
  );
};

export default NavigationStack;
