import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import * as z from "zod";

import { Button } from "~/renderer/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader } from "~/renderer/components/ui/card";
import { Field, FieldError } from "~/renderer/components/ui/field";
import { Input } from "~/renderer/components/ui/input";
import { Label } from "~/renderer/components/ui/label";
import { Textarea } from "~/renderer/components/ui/textarea";
import { useSettingsStore } from "~/renderer/stores/settings";

const formSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters").max(20, "Username must be at most 20 characters"),
  customInstructions: z.string().max(500, "Instructions must be at most 500 characters"),
});

export const SettingsGeneral = () => {
  const { username, customInstructions, updateSettings } = useSettingsStore();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { username: "", customInstructions: "" },
  });

  useEffect(() => {
    form.reset({ username, customInstructions });
  }, [form, username, customInstructions]);

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    await updateSettings(data);
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
            Save
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
