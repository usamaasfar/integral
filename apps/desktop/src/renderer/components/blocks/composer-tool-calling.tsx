import { useState } from "react";
import { Button } from "~/renderer/components/ui/button";
import { Input } from "~/renderer/components/ui/input";
import { Label } from "~/renderer/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/renderer/components/ui/select";
import { Textarea } from "~/renderer/components/ui/textarea";
import {
  Timeline,
  TimelineConnector,
  TimelineContent,
  TimelineDot,
  TimelineHeader,
  TimelineItem,
  TimelineTitle,
} from "~/renderer/components/ui/timeline";
import type { CheckpointData } from "~/renderer/components/CheckpointDialog";
import type { Field } from "~/main/ai/agents/tools";

export const ComposerToolCalling = ({
  steps,
  checkpoint,
  onCheckpointSubmit,
  onCheckpointCancel,
}: {
  steps: any[];
  checkpoint?: CheckpointData | null;
  onCheckpointSubmit?: (values: Record<string, any>) => void;
  onCheckpointCancel?: () => void;
}) => {
  const [values, setValues] = useState<Record<string, any>>(() => {
    if (!checkpoint) return {};
    const initial: Record<string, any> = {};
    checkpoint.fields.forEach((field) => {
      if (field.defaultValue !== undefined) {
        initial[field.name] = field.defaultValue;
      }
    });
    return initial;
  });

  const messages = [];
  const seen = new Set();

  steps.forEach((step) => {
    if (step.text && step.text.trim()) {
      const key = `text-${step.text.trim()}`;
      if (!seen.has(key)) {
        seen.add(key);
        messages.push({
          text: step.text.trim(),
          status: "completed",
        });
      }
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkpoint || !onCheckpointSubmit) return;

    // No validation - all fields are optional
    onCheckpointSubmit(values);
  };

  const renderField = (field: Field) => {
    const value = values[field.name];

    switch (field.type) {
      case "text":
        return (
          <div key={field.name} className="space-y-1.5">
            <Label htmlFor={field.name} className="text-sm">
              {field.label}
            </Label>
            <Input
              id={field.name}
              value={value || ""}
              onChange={(e) => {
                setValues((prev) => ({ ...prev, [field.name]: e.target.value }));
              }}
              placeholder={field.placeholder}
            />
            {field.description && <p className="text-xs text-muted-foreground">{field.description}</p>}
          </div>
        );

      case "textarea":
        return (
          <div key={field.name} className="space-y-1.5">
            <Label htmlFor={field.name} className="text-sm">
              {field.label}
            </Label>
            <Textarea
              id={field.name}
              value={value || ""}
              onChange={(e) => {
                setValues((prev) => ({ ...prev, [field.name]: e.target.value }));
              }}
              placeholder={field.placeholder}
              rows={field.rows || 3}
            />
            {field.description && <p className="text-xs text-muted-foreground">{field.description}</p>}
          </div>
        );

      case "select":
        return (
          <div key={field.name} className="space-y-1.5">
            <Label htmlFor={field.name} className="text-sm">
              {field.label}
            </Label>
            <Select
              value={value || ""}
              onValueChange={(val) => {
                setValues((prev) => ({ ...prev, [field.name]: val }));
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select..." />
              </SelectTrigger>
              <SelectContent>
                {field.options.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {field.description && <p className="text-xs text-muted-foreground">{field.description}</p>}
          </div>
        );

      case "multiselect":
        return (
          <div key={field.name} className="space-y-1.5">
            <Label className="text-sm">
              {field.label}
            </Label>
            <div className="space-y-2 border rounded-md p-3">
              {field.options.map((option) => {
                const selected = Array.isArray(value) ? value.includes(option) : false;
                return (
                  <div key={option} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id={`${field.name}-${option}`}
                      checked={selected}
                      onChange={(e) => {
                        const currentValues = Array.isArray(value) ? value : [];
                        const newValues = e.target.checked
                          ? [...currentValues, option]
                          : currentValues.filter((v) => v !== option);
                        setValues((prev) => ({ ...prev, [field.name]: newValues }));
                      }}
                      className="h-4 w-4"
                    />
                    <label htmlFor={`${field.name}-${option}`} className="text-sm cursor-pointer">
                      {option}
                    </label>
                  </div>
                );
              })}
            </div>
            {field.description && <p className="text-xs text-muted-foreground">{field.description}</p>}
          </div>
        );

      case "date":
        return (
          <div key={field.name} className="space-y-1.5">
            <Label htmlFor={field.name} className="text-sm">
              {field.label}
            </Label>
            <Input
              id={field.name}
              type="date"
              value={value || ""}
              onChange={(e) => {
                setValues((prev) => ({ ...prev, [field.name]: e.target.value }));
              }}
              min={field.minDate}
              max={field.maxDate}
            />
            {field.description && <p className="text-xs text-muted-foreground">{field.description}</p>}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen p-4">
      <div className="max-w-md w-full">
        <Timeline>
          {messages.map((message, i) => (
            <TimelineItem key={i}>
              <TimelineDot data-status={message.status} />
              <TimelineConnector />
              <TimelineContent>
                <TimelineHeader>
                  <TimelineTitle>{message.text}</TimelineTitle>
                </TimelineHeader>
              </TimelineContent>
            </TimelineItem>
          ))}

          {/* Checkpoint Form - inline with timeline */}
          {checkpoint && (
            <TimelineItem>
              <TimelineDot data-status="active" className="animate-pulse" />
              <TimelineConnector />
              <TimelineContent>
                <TimelineHeader>
                  <TimelineTitle>{checkpoint.reason}</TimelineTitle>
                </TimelineHeader>
                <form onSubmit={handleSubmit} className="mt-4 space-y-3 bg-muted/50 p-4 rounded-md border">
                  {checkpoint.fields.map(renderField)}
                  <div className="flex gap-2 pt-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => onCheckpointCancel?.()}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                    <Button type="submit" size="sm" className="flex-1">
                      Continue
                    </Button>
                  </div>
                </form>
              </TimelineContent>
            </TimelineItem>
          )}
        </Timeline>
      </div>
    </div>
  );
};
