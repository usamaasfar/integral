import { useEffect, useState } from "react";
import ComposerScreen from "~/renderer/screens/composer";
import SettingsScreen from "~/renderer/screens/settings";

const App = () => {
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.metaKey && e.key === "k") {
        e.preventDefault();
        setShowSettings((prev) => !prev);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <main className="h-screen w-screen ">
      {showSettings ? <SettingsScreen /> : <ComposerScreen />}
    </main>
  );
};

export default App;
