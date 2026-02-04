import { Sparkle } from "lucide-react";
import { useEffect, useState } from "react";
import { Compose } from "~/renderer/components/blocks/compose";
import { ComposerResult } from "~/renderer/components/blocks/composer-result";
import { ComposerToolCalling } from "~/renderer/components/blocks/composer-tool-calling";
import { Greetings } from "~/renderer/components/blocks/greetings";
import { Kbd, KbdGroup } from "~/renderer/components/ui/kbd";

const Composer = () => {
  const [steps, setSteps] = useState<any[]>([]);
  const [result, setResult] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const stepHandler = (step: any) => {
      setSteps((prev) => [...prev, step]);
    };

    const completeHandler = (result: any) => {
      setResult(result._output || result.text || result);
      setIsLoading(false);
    };

    const errorHandler = (error: any) => {
      console.error("AI Error:", error);
      setIsLoading(false);
    };

    window.electronAPI.onAIStep(stepHandler);
    window.electronAPI.onAIComplete(completeHandler);
    window.electronAPI.onAIError(errorHandler);
  }, []);

  const handleAIResponse = async (prompt: string, mentions?: string[]) => {
    setSteps([]);
    setResult(null);
    setIsLoading(true);
    window.electronAPI.aiCompose(prompt, mentions);
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
          <Greetings />
          <div className="flex flex-col gap-2 text-xs absolute bottom-10">
            <KbdGroup>
              <span className="text-muted-foreground">Compose</span>
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

      <Compose onSubmit={handleAIResponse} />
    </>
  );
};

export default Composer;
