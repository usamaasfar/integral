import { zodResolver } from "@hookform/resolvers/zod";
import { Loader } from "lucide-react";
import { useEffect, useMemo } from "react";
import { Controller, useForm } from "react-hook-form";
import * as z from "zod";

import { PROVIDERS, type ProviderType } from "~/common/providers";
import { Button } from "~/renderer/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader } from "~/renderer/components/ui/card";
import { Field, FieldError } from "~/renderer/components/ui/field";
import { Input } from "~/renderer/components/ui/input";
import { Label } from "~/renderer/components/ui/label";
import { ScrollArea } from "~/renderer/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/renderer/components/ui/select";
import { useSettingsStore } from "~/renderer/stores/settings";

export const Providers = () => {
  const {
    selectedProvider,
    providers,
    ollamaHealth,
    ollamaModels,
    isLoading,
    checkOllamaHealth,
    loadOllamaModels,
    loadProviders,
    saveProvider,
  } = useSettingsStore();

  const providerSchema = useMemo(() => {
    return z
      .object({
        selectedProvider: z.string(),
        modelName: z.string().min(1, "Model name is required"),
        apiKey: z.string().optional(),
        name: z.string().optional(),
        baseUrl: z.string().optional(),
      })
      .superRefine((data, ctx) => {
        const provider = data.selectedProvider as ProviderType;

        if (provider === "openai" || provider === "anthropic" || provider === "google") {
          if (!data.apiKey) {
            ctx.addIssue({ code: "custom", message: "API Key is required", path: ["apiKey"] });
          }
        }

        if (provider === "openai-compatible") {
          if (!data.apiKey) {
            ctx.addIssue({ code: "custom", message: "API Key is required", path: ["apiKey"] });
          }
          if (!data.baseUrl) {
            ctx.addIssue({ code: "custom", message: "Base URL is required", path: ["baseUrl"] });
          }
          if (!data.name) {
            ctx.addIssue({ code: "custom", message: "Provider name is required", path: ["name"] });
          }
        }
      });
  }, []);

  const form = useForm<z.infer<typeof providerSchema>>({
    resolver: zodResolver(providerSchema),
    defaultValues: { selectedProvider: selectedProvider, modelName: "", apiKey: "", name: "", baseUrl: "" },
  });

  const formSelectedProvider = form.watch("selectedProvider") as ProviderType;
  const isOllama = formSelectedProvider === "ollama";
  const isOpenAICompatible = formSelectedProvider === "openai-compatible";

  useEffect(() => {
    loadProviders();
  }, [loadProviders]);

  useEffect(() => {
    checkOllamaHealth();
  }, [checkOllamaHealth]);

  useEffect(() => {
    if (isOllama && ollamaHealth) loadOllamaModels();
  }, [isOllama, ollamaHealth, loadOllamaModels]);

  useEffect(() => {
    const providerConfig = providers[formSelectedProvider];
    const formData = {
      selectedProvider: formSelectedProvider,
      modelName: providerConfig?.model || "",
      apiKey: providerConfig?.apiKey || "",
      name: providerConfig?.name || "",
      baseUrl: providerConfig?.baseUrl || "",
    };
    form.reset(formData);
  }, [formSelectedProvider, providers, form]);

  const onSubmit = async (data: z.infer<typeof providerSchema>) => {
    await saveProvider({
      provider: data.selectedProvider as ProviderType,
      model: data.modelName,
      apiKey: data.apiKey,
      name: data.name,
      baseUrl: data.baseUrl,
    });
    form.reset(data);
  };

  const canSave = isOllama ? ollamaHealth && ollamaModels.length > 0 : true;
  const hasChanges = form.formState.isDirty || formSelectedProvider !== selectedProvider;

  return (
    <Card className="relative h-full flex flex-col">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-50 rounded-lg">
          <Loader className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      )}
      <CardHeader className="flex-shrink-0">
        <CardDescription>Configure your AI provider and model settings</CardDescription>
      </CardHeader>
      <ScrollArea className="flex-1 h-0">
        <CardContent className="pb-6">
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
                            }}
                          />
                          <span>{provider.displayName}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            )}
          />

          {isOpenAICompatible && (
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
          )}

          <Controller
            name="modelName"
            control={form.control}
            render={({ field, fieldState }) => {
              const ollamaError =
                isOllama && !ollamaHealth
                  ? { message: "Can't connect to Ollama" }
                  : isOllama && ollamaModels.length === 0
                    ? { message: "Run: ollama run kimi-k2.5:cloud, then restart Integral" }
                    : null;

              const hasError = fieldState.invalid || ollamaError;

              const placeholder = {
                openai: "gpt-5.2",
                anthropic: "claude-sonnet-4-5",
                google: "gemini-3-flash-preview",
                "openai-compatible": "model name",
                ollama: "Select a model",
              }[formSelectedProvider];

              return (
                <Field data-invalid={hasError}>
                  <Label htmlFor={field.name}>Model Name</Label>
                  {isOllama ? (
                    <Select value={field.value} onValueChange={field.onChange} disabled={!ollamaHealth || ollamaModels.length === 0}>
                      <SelectTrigger aria-invalid={!!hasError}>
                        <SelectValue placeholder={placeholder} />
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
                    <Input {...field} id={field.name} placeholder={placeholder} aria-invalid={fieldState.invalid} />
                  )}
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  {ollamaError && <FieldError errors={[ollamaError]} />}
                </Field>
              );
            }}
          />

          {isOpenAICompatible && (
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
          )}

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

          <Button type="submit" className="w-full" disabled={!canSave || !hasChanges || form.formState.isSubmitting}>
            Use
          </Button>
        </form>
      </CardContent>
      </ScrollArea>
    </Card>
  );
};
