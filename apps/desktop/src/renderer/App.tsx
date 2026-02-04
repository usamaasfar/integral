import { useEffect, useState } from "react";
import ComposerScreen from "~/renderer/screens/composer";
import SettingsScreen from "~/renderer/screens/settings";

const App = () => {
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd+K: Toggle settings
      if (e.metaKey && e.key === "k") {
        e.preventDefault();
        setShowSettings((prev) => !prev);
      }
      // Escape: Close settings
      if (e.key === "Escape" && showSettings) {
        e.preventDefault();
        setShowSettings(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showSettings]);

  return (
    <main className="h-screen w-screen ">
      {showSettings ? <SettingsScreen /> : <ComposerScreen />}
    </main>
  );
};

export default App;
