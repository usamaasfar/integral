import { useState, useEffect } from "react";
import * as Mention from "@diceui/mention";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const dummyMcpServers = [
  { id: "filesystem", name: "File System", description: "Access local files" },
  { id: "web-search", name: "Web Search", description: "Search the web" },
  { id: "database", name: "Database", description: "Query databases" },
  { id: "api-client", name: "API Client", description: "Make HTTP requests" },
];

export function McpMentionInput() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.metaKey && e.key === 'n') {
        e.preventDefault();
        setOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">Connect to MCP Server</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Select MCP Server</DialogTitle>
        </DialogHeader>
        <Mention.MentionRoot className="w-full **:data-tag:rounded **:data-tag:bg-blue-200 **:data-tag:py-px **:data-tag:text-blue-950 dark:**:data-tag:bg-blue-800 dark:**:data-tag:text-blue-50">
          <Mention.MentionInput
            placeholder="Type @ to mention an MCP server..."
            className="flex min-h-[100px] w-full rounded-md border border-zinc-200 bg-transparent px-3 py-2 text-base shadow-xs placeholder:text-muted-foreground focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-zinc-800 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm dark:border-zinc-800 dark:focus-visible:ring-zinc-300"
            asChild
          >
            <textarea />
          </Mention.MentionInput>
          <Mention.MentionPortal>
            <Mention.MentionContent className="data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 relative z-50 min-w-[var(--dice-anchor-width)] overflow-hidden rounded-md border border-zinc-200 bg-white p-1 text-zinc-950 shadow-md data-[state=closed]:animate-out data-[state=open]:animate-in dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50">
              {dummyMcpServers.map((server) => (
                <Mention.MentionItem
                  key={server.id}
                  value={server.name}
                  className="relative flex w-full cursor-default select-none flex-col rounded-sm px-2 py-1.5 text-sm outline-hidden data-disabled:pointer-events-none data-highlighted:bg-zinc-100 data-highlighted:text-zinc-900 data-disabled:opacity-50 dark:data-highlighted:bg-zinc-800 dark:data-highlighted:text-zinc-50"
                >
                  <span className="text-sm">{server.name}</span>
                  <span className="text-muted-foreground text-xs">
                    {server.description}
                  </span>
                </Mention.MentionItem>
              ))}
            </Mention.MentionContent>
          </Mention.MentionPortal>
        </Mention.MentionRoot>
      </DialogContent>
    </Dialog>
  );
}
