import { useEffect, useState } from "react";
import { Compose } from "@/renderer/components/blocks/compose";
import { ComposerResult } from "@/renderer/components/blocks/composer-result";
import { ComposerToolCalling } from "@/renderer/components/blocks/composer-tool-calling";
import { Settings } from "@/renderer/components/blocks/settings";
import { Kbd, KbdGroup } from "@/renderer/components/ui/kbd";

const Welcome = () => {
  const [steps, setSteps] = useState([]);
  const [result, setResult] = useState(null);

  useEffect(() => {
    const stepHandler = (step) => {
      setSteps((prev) => [...prev, step]);
    };

    const completeHandler = (result) => {
      setResult(result._output || result.text || result);
    };

    const errorHandler = (error) => {
      console.error("AI Error:", error);
    };

    window.electronAPI.onAIStep(stepHandler);
    window.electronAPI.onAIComplete(completeHandler);
    window.electronAPI.onAIError(errorHandler);
  }, []);

  const handleAIResponse = async (prompt: string) => {
    setSteps([]);
    setResult(null);
    window.electronAPI.aiCompose(prompt);
  };

  return (
    <>
      {steps.length > 0 && !result && <ComposerToolCalling steps={steps} />}

      {result && (
        <div className="mt-4">
          <ComposerResult result={result} />
        </div>
      )}

      {steps.length === 0 && !result && (
        <>
          <div className="h-full flex flex-col items-center justify-center">
            <p className="text-3xl font-extralight">Good morning, Alex</p>
            <div className="flex flex-col gap-2 text-xs absolute bottom-10">
              <KbdGroup>
                <span className="text-muted-foreground">Compose</span>
                <Kbd>⌘</Kbd>
                <Kbd>N</Kbd>
              </KbdGroup>
              <KbdGroup>
                <span className="text-muted-foreground">Setting</span>
                <Kbd>⌘</Kbd>
                <Kbd>K</Kbd>
              </KbdGroup>
            </div>
          </div>
          <Settings />
        </>
      )}

      <Compose onSubmit={handleAIResponse} />
    </>
  );
};

export default Welcome;
