import { useEffect } from "react";
import ComposerScreen from "~/renderer/screens/composer";
import { useSettingsStore } from "~/renderer/stores/settings";

const App = () => {
  const loadSettings = useSettingsStore((state) => state.loadSettings);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  return (
    <main className="h-screen w-screen ">
      <ComposerScreen />
    </main>
  );
};

export default App;
