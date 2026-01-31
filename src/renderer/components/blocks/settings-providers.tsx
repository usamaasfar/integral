import { zodResolver } from "@hookform/resolvers/zod";
import React, { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import * as z from "zod";
import { Avatar, AvatarFallback } from "@/renderer/components/ui/avatar";
import { Button } from "@/renderer/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader } from "@/renderer/components/ui/card";
import { Field, FieldError } from "@/renderer/components/ui/field";
import { Input } from "@/renderer/components/ui/input";
import { Label } from "@/renderer/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/renderer/components/ui/select";

export type ProviderType = "openai" | "anthropic" | "groq" | "cerebras" | "google" | "ollama" | "openrouter" | "openai-compatible";

export const PROVIDERS: Array<{ type: ProviderType; name: string; displayName: string; logo: string }> = [
  {
    type: "openai",
    name: "openai",
    displayName: "OpenAI",
    logo: "https://raw.githubusercontent.com/lobehub/lobe-icons/refs/heads/master/packages/static-png/dark/openai.png",
  },
  {
    type: "anthropic",
    name: "anthropic",
    displayName: "Anthropic",
    logo: "https://raw.githubusercontent.com/lobehub/lobe-icons/refs/heads/master/packages/static-png/dark/claude-color.png",
  },
  {
    type: "groq",
    name: "groq",
    displayName: "Groq",
    logo: "https://raw.githubusercontent.com/lobehub/lobe-icons/refs/heads/master/packages/static-png/dark/groq.png",
  },
  {
    type: "cerebras",
    name: "cerebras",
    displayName: "Cerebras",
    logo: "https://raw.githubusercontent.com/lobehub/lobe-icons/refs/heads/master/packages/static-png/dark/cerebras-color.png",
  },
  {
    type: "google",
    name: "google",
    displayName: "Google",
    logo: "https://raw.githubusercontent.com/lobehub/lobe-icons/refs/heads/master/packages/static-png/dark/gemini-color.png",
  },
  {
    type: "ollama",
    name: "ollama",
    displayName: "Ollama",
    logo: "https://raw.githubusercontent.com/lobehub/lobe-icons/refs/heads/master/packages/static-png/dark/ollama.png",
  },
  {
    type: "openrouter",
    name: "openrouter",
    displayName: "OpenRouter",
    logo: "https://raw.githubusercontent.com/lobehub/lobe-icons/refs/heads/master/packages/static-png/dark/openrouter.png",
  },
  {
    type: "openai-compatible",
    name: "openai-compatible",
    displayName: "OpenAI Compatible",
    logo: "https://raw.githubusercontent.com/lobehub/lobe-icons/refs/heads/master/packages/static-png/dark/openai.png",
  },
];

const providerSchema = z.object({
  selectedProvider: z.string(),
  modelName: z.string().min(1, "Model name is required"),
  apiKey: z.string().optional(),
  name: z.string().optional(),
  baseUrl: z.string().url("Invalid URL").optional(),
});

export const Providers = () => {
  const [ollamaModels, setOllamaModels] = React.useState<string[]>([]);

  const form = useForm<z.infer<typeof providerSchema>>({
    resolver: zodResolver(providerSchema),
    defaultValues: {
      selectedProvider: "ollama",
      modelName: "kimi-k2.5:cloud",
      apiKey: "",
      name: "",
      baseUrl: "",
    },
  });

  const selectedProvider = form.watch("selectedProvider");
  const isOpenAICompatible = selectedProvider === "openai-compatible";
  const isOllama = selectedProvider === "ollama";

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const settings = await window.electronAPI.getProviderSettings();
        const apiKey = await window.electronAPI.getProviderApiKey(settings.selectedProvider);

        form.reset({
          selectedProvider: settings.selectedProvider,
          modelName: settings.modelName,
          apiKey: apiKey || "",
          name: settings.name,
          baseUrl: settings.baseUrl,
        });
      } catch (error) {
        console.error("Failed to load provider settings:", error);
      }
    };

    loadSettings();
  }, [form]);

  useEffect(() => {
    if (isOllama) {
      window.electronAPI.getOllamaModels().then(setOllamaModels);
    }
  }, [isOllama]);

  const onSubmit = async (data: z.infer<typeof providerSchema>) => {
    try {
      await window.electronAPI.saveProviderSettings(data);
      console.log("Settings saved successfully");
    } catch (error) {
      console.error("Failed to save settings:", error);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardDescription>Configure your AI provider and model settings</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Controller
            name="selectedProvider"
            control={form.control}
            render={({ field }) => (
              <Field>
                <Label htmlFor={field.name}>Select Provider</Label>
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a provider">
                      {field.value && (
                        <div className="flex items-center space-x-2">
                          <img
                            src={PROVIDERS.find((p) => p.type === field.value)?.logo}
                            alt={PROVIDERS.find((p) => p.type === field.value)?.displayName}
                            className="w-4 h-4 object-contain"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = "none";
                            }}
                          />
                          <span>{PROVIDERS.find((p) => p.type === field.value)?.displayName}</span>
                        </div>
                      )}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {PROVIDERS.map((provider) => (
                      <SelectItem key={provider.type} value={provider.type}>
                        <div className="flex items-center space-x-2">
                          <img
                            src={provider.logo}
                            alt={provider.displayName}
                            className="w-4 h-4 object-contain"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = "none";
                              const fallback = target.nextElementSibling as HTMLElement;
                              if (fallback) fallback.style.display = "inline-flex";
                            }}
                          />
                          <Avatar size="xs" className="hidden w-4 h-4">
                            <AvatarFallback className="text-xs">{provider.displayName.charAt(0).toUpperCase()}</AvatarFallback>
                          </Avatar>
                          <span>{provider.displayName}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            )}
          />

          <Controller
            name="modelName"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <Label htmlFor={field.name}>Model Name</Label>
                {isOllama ? (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a model" />
                    </SelectTrigger>
                    <SelectContent>
                      {ollamaModels.map((model) => (
                        <SelectItem key={model} value={model}>
                          {model}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input {...field} id={field.name} placeholder="gpt-4" aria-invalid={fieldState.invalid} />
                )}
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />

          {!isOllama && (
            <Controller
              name="apiKey"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <Label htmlFor={field.name}>API Key</Label>
                  <Input {...field} id={field.name} type="password" placeholder="Enter your API key" aria-invalid={fieldState.invalid} />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
          )}

          {isOpenAICompatible && (
            <>
              <Controller
                name="name"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <Label htmlFor={field.name}>Provider Name</Label>
                    <Input {...field} id={field.name} placeholder="Custom provider name" aria-invalid={fieldState.invalid} />
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />

              <Controller
                name="baseUrl"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <Label htmlFor={field.name}>Base URL</Label>
                    <Input {...field} id={field.name} placeholder="https://api.example.com/v1" aria-invalid={fieldState.invalid} />
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />
            </>
          )}

          <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
            Save
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
