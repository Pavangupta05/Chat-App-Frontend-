import { useOutletContext } from "react-router-dom";
import SettingsPanel from "./SettingsPanel";

function SettingsView() {
  const context = useOutletContext();
  
  return (
    <SettingsPanel 
      isOpen={true}
      isRouted={true}
      onClose={context.onClosePanel}

      theme={context.theme}
      onThemeToggle={context.onThemeToggle}
      onLogout={context.onLogout}
      backgroundDoodle={context.backgroundDoodle}
      onBackgroundChange={context.onBackgroundChange}
    />
  );
}

export default SettingsView;

