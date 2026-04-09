import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import SettingsPanel from "./SettingsPanel";
import ProfilePanel from "./ProfilePanel";

/**
 * NavigationStack - Manages the stack of overlay pages based on URL.
 * 
 * It keeps track of overlay routes and renders them using AnimatePresence.
 */
const NavigationStack = ({ theme, onThemeToggle, onLogout, backgroundDoodle, onBackgroundChange }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const handleClose = () => {
    // Navigate back to home or step out of the stack
    if (location.pathname.startsWith("/profile/edit")) {
      navigate("/profile");
    } else {
      navigate("/");
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
    </AnimatePresence>
  );
};

export default NavigationStack;
