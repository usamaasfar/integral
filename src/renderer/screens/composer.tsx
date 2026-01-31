import { Sparkle } from "lucide-react";
import { useEffect, useState } from "react";
import { Compose } from "@/renderer/components/blocks/compose";
import { ComposerResult } from "@/renderer/components/blocks/composer-result";
import { ComposerToolCalling } from "@/renderer/components/blocks/composer-tool-calling";
import { Settings } from "@/renderer/components/blocks/settings";
import { Kbd, KbdGroup } from "@/renderer/components/ui/kbd";

const Welcome = () => {
  const [steps, setSteps] = useState([]);
  const [result, setResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const stepHandler = (step) => {
      setSteps((prev) => [...prev, step]);
    };

    const completeHandler = (result) => {
      setResult(result._output || result.text || result);
      setIsLoading(false);
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
    setIsLoading(true);
    window.electronAPI.aiCompose(prompt);
  };

  return (
    <>
      {isLoading && steps.length === 0 && (
        <div className="flex flex-col items-center justify-center h-screen">
          <Sparkle className="w-8 h-8 animate-pulse" />
        </div>
      )}

      {steps.length > 0 && !result && <ComposerToolCalling steps={steps} />}

      {result && (
        <div className="flex flex-col items-center justify-center h-screen p-8">
          <div className="max-w-2xl w-full">
            <ComposerResult result={result} />
          </div>
        </div>
      )}

      {steps.length === 0 && !result && !isLoading && (
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
      )}

      <Settings />
      <Compose onSubmit={handleAIResponse} />
    </>
  );
};

export default Welcome;
