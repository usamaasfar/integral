import { tool } from "ai";
import { z } from "zod";
import { randomUUID } from "crypto";
import { getCurrentComposeEvent, registerCheckpointHandler, unregisterCheckpointHandler } from "~/main/ipc";

/**
 * Base properties shared by all field types
 */
const baseFieldSchema = z.object({
  name: z.string().describe("Unique field identifier (e.g., 'email', 'subject')"),
  label: z.string().describe("Human-readable label shown to user"),
  description: z.string().optional().describe("Optional help text displayed below the field"),
  required: z.boolean().default(true).describe("Whether this field must be filled"),
});

/**
 * Text input field schema
 */
const textFieldSchema = baseFieldSchema.extend({
  type: z.literal("text"),
  placeholder: z.string().optional().describe("Placeholder text shown in empty field"),
  defaultValue: z.string().optional().describe("Pre-filled value"),
});

/**
 * Textarea input field schema
 */
const textareaFieldSchema = baseFieldSchema.extend({
  type: z.literal("textarea"),
  placeholder: z.string().optional().describe("Placeholder text shown in empty field"),
  defaultValue: z.string().optional().describe("Pre-filled value"),
  rows: z.number().optional().default(4).describe("Number of visible text rows"),
});

/**
 * Single select dropdown field schema
 */
const selectFieldSchema = baseFieldSchema.extend({
  type: z.literal("select"),
  options: z.array(z.string()).min(1).describe("Available options for selection"),
  defaultValue: z.string().optional().describe("Pre-selected option"),
});

/**
 * Multiple select field schema
 */
const multiselectFieldSchema = baseFieldSchema.extend({
  type: z.literal("multiselect"),
  options: z.array(z.string()).min(1).describe("Available options (multiple can be selected)"),
  defaultValue: z.array(z.string()).optional().describe("Pre-selected options"),
});

/**
 * Date picker field schema
 */
const dateFieldSchema = baseFieldSchema.extend({
  type: z.literal("date"),
  defaultValue: z.string().optional().describe("Default date in ISO format (YYYY-MM-DD)"),
  minDate: z.string().optional().describe("Minimum selectable date (ISO format)"),
  maxDate: z.string().optional().describe("Maximum selectable date (ISO format)"),
});

/**
 * Discriminated union of all field types
 */
const fieldSchema = z.discriminatedUnion("type", [
  textFieldSchema,
  textareaFieldSchema,
  selectFieldSchema,
  multiselectFieldSchema,
  dateFieldSchema,
]);

/**
 * Main input schema for the request_user_input tool
 */
const requestUserInputSchema = z.object({
  reason: z.string().describe("Brief explanation (1-2 sentences) of why you need this information. Shown to the user."),
  fields: z.array(fieldSchema).min(1).describe("Array of input fields to collect from the user. Each field will be rendered in the form."),
});

/**
 * Output schema - returns key-value pairs of field responses
 */
const outputSchema = z.record(z.string(), z.any()).describe("Object with field names as keys and user inputs as values");

/**
 * Type exports for use in other files
 */
export type Field = z.infer<typeof fieldSchema>;
export type RequestUserInputParams = z.infer<typeof requestUserInputSchema>;
export type RequestUserInputOutput = z.infer<typeof outputSchema>;

/**
 * Checkpoint request function
 * Communicates with the renderer process to show checkpoint dialog and collect user input
 */
async function requestCheckpoint(params: RequestUserInputParams): Promise<RequestUserInputOutput> {
  const event = getCurrentComposeEvent();

  if (!event) {
    throw new Error("No active compose event - checkpoint cannot be requested");
  }

  const checkpointId = randomUUID();

  return new Promise<RequestUserInputOutput>((resolve, reject) => {
    // Register handlers for this checkpoint
    registerCheckpointHandler(checkpointId, resolve, reject);

    // Set timeout (5 minutes)
    const timeout = setTimeout(() => {
      unregisterCheckpointHandler(checkpointId);
      reject(new Error("Checkpoint timeout - user did not respond within 5 minutes"));
    }, 5 * 60 * 1000);

    // Clean up timeout when promise settles
    const cleanup = () => clearTimeout(timeout);
    Promise.race([
      new Promise((_, rej) => {
        setTimeout(() => rej(new Error("timeout")), 5 * 60 * 1000);
      }),
    ]).catch(cleanup);

    // Send checkpoint request to renderer
    event.reply("ai-checkpoint-required", {
      id: checkpointId,
      reason: params.reason,
      fields: params.fields,
    });
  });
}

/**
 * Human-in-the-loop tool for requesting user input
 *
 * This tool allows the AI to pause execution and request additional information
 * from the user when required parameters are missing or ambiguous.
 *
 * @example
 * ```typescript
 * // AI calls this when it needs email details
 * request_user_input({
 *   reason: "I need more information to send the email",
 *   fields: [
 *     {
 *       type: "text",
 *       name: "to",
 *       label: "Recipient Email",
 *       placeholder: "example@company.com",
 *       required: true
 *     },
 *     {
 *       type: "textarea",
 *       name: "body",
 *       label: "Email Body",
 *       rows: 6,
 *       required: true
 *     }
 *   ]
 * })
 * ```
 */
export const requestUserInputTool = tool({
  description: `Request additional information from the user when required parameters are missing or ambiguous.

USE THIS TOOL WHEN:
- Required information is not provided in the user's message
- User's intent is unclear and needs clarification
- You need to confirm specific details before taking an action
- Parameter values are ambiguous (e.g., "the team" - which team?)

DO NOT USE THIS TOOL WHEN:
- Information can be reasonably inferred from context
- The request is just for general conversation
- You're asking for confirmation of something obvious

EXAMPLES OF WHEN TO USE:
✓ User: "Send an email to the team" → You don't know the team email or subject
✓ User: "Create a calendar event for the meeting" → You need date, time, attendees
✓ User: "Book a flight" → You need departure city, destination, dates

EXAMPLES OF WHEN NOT TO USE:
✗ User: "What's the weather like?" → No action required, just answer
✗ User: "Send email to john@company.com about the report" → Subject can be inferred`,

  inputSchema: requestUserInputSchema,
  outputSchema,

  execute: async (params) => {
    return await requestCheckpoint(params);
  },
});
