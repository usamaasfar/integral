import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/renderer/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/renderer/components/ui/card";
import { Dialog, DialogContent } from "@/renderer/components/ui/dialog";
import { Field, FieldError } from "@/renderer/components/ui/field";
import { Input } from "@/renderer/components/ui/input";
import { Label } from "@/renderer/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/renderer/components/ui/tabs";
import { Textarea } from "@/renderer/components/ui/textarea";
import { Providers } from "./settings-providers";

export const Settings = () => {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.metaKey && event.key === "k") {
        event.preventDefault();
        setIsOpen(true);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent onPointerDownOutside={(e) => e.preventDefault()} showCloseButton={false} className="max-w-2xl">
        <Tabs defaultValue="general" className="w-full">
          <TabsList className="w-full">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="providers">Providers</TabsTrigger>
            <TabsTrigger value="servers">Servers</TabsTrigger>
          </TabsList>
          <TabsContent value="general">
            <General />
          </TabsContent>
          <TabsContent value="providers">
            <Providers />
          </TabsContent>
          <TabsContent value="servers">
            <Card>
              <CardHeader>
                <CardTitle>Settings</CardTitle>
                <CardDescription>Manage your account preferences and options. Customize your experience to fit your needs.</CardDescription>
              </CardHeader>
              <CardContent className="text-muted-foreground text-sm">Configure notifications, security, and themes.</CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

const formSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters").max(20, "Username must be at most 20 characters"),
  customInstructions: z.string().max(500, "Instructions must be at most 500 characters"),
});

const General = () => {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { username: "", customInstructions: "" },
  });

  useEffect(() => {
    window.electronAPI.getSettings().then((settings) => {
      form.reset(settings);
    });
  }, [form]);

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    await window.electronAPI.saveSettings(data);
  };

  return (
    <Card>
      <CardHeader>
        <CardDescription>Configure how the AI should interact with you</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Controller
            name="username"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <Label htmlFor={field.name}>Username</Label>
                <Input {...field} id={field.name} placeholder="How should the AI call you?" aria-invalid={fieldState.invalid} />
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />

          <Controller
            name="customInstructions"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <Label htmlFor={field.name}>Custom Instructions</Label>
                <Textarea
                  {...field}
                  id={field.name}
                  placeholder="Add custom instructions for the AI..."
                  rows={6}
                  aria-invalid={fieldState.invalid}
                />
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />

          <Button type="submit" className="w-full" disabled={!form.formState.isDirty}>
            Save Settings
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
