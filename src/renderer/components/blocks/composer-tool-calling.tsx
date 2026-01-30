import {
  Timeline,
  TimelineConnector,
  TimelineContent,
  TimelineDot,
  TimelineHeader,
  TimelineItem,
  TimelineTitle,
} from "@/renderer/components/ui/timeline";

export const ComposerToolCalling = ({ steps }) => {
  const messages = [];
  const seen = new Set();

  steps.forEach((step) => {
    // Only show steps that have tool calls (not the final answer)
    const hasToolCalls = step.content?.some((c) => c.type === "tool-call");

    if (step.text && step.text.trim() && hasToolCalls) {
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

  return (
    <div className="flex flex-col items-center justify-center h-screen p-4">
      <div className="max-w-md">
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
        </Timeline>
      </div>
    </div>
  );
};
