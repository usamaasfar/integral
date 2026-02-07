/**
 * Message processing pipelines for ToolLoopAgent prepareStep
 */

/**
 * Truncate large tool results to prevent context overflow
 */
export function truncate(messages: any[], maxSize = 10000) {
  return messages.map((msg) => {
    if (msg.role === "tool" && Array.isArray(msg.content)) {
      const content = msg.content.map((part: any) => {
        if (part.type === "tool-result") {
          const output = part.output ?? {};
          const str = JSON.stringify(output);
          if (str.length > maxSize) {
            return { ...part, output: str.substring(0, maxSize) + `\n\n[Result truncated. Original: ${str.length} chars]` };
          }
        }
        return part;
      });
      return { ...msg, content };
    }
    return msg;
  });
}

// pipelines:
// export function compact(messages: any[]) { ... }
// export function prune(messages: any[]) { ... }
