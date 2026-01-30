import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { ScrollArea } from "@/renderer/components/ui/scroll-area";

export const ComposerResult = ({ result }) => {
  return (
    <>
      {result && (
        <ScrollArea className="h-[80vh] w-full">
          <div className="prose prose-sm max-w-none prose-invert pr-4">
            <ReactMarkdown
              components={{
                code({ node, inline, className, children, ...props }) {
                  const match = /language-(\w+)/.exec(className || "");
                  return !inline && match ? (
                    <div className="relative">
                      <SyntaxHighlighter
                        style={oneDark}
                        language={match[1]}
                        PreTag="div"
                        className="rounded-lg overflow-x-auto max-h-96 overflow-y-auto text-xs"
                        {...props}
                      >
                        {String(children).replace(/\n$/, "")}
                      </SyntaxHighlighter>
                    </div>
                  ) : (
                    <code className="bg-gray-800 text-gray-200 px-1 py-0.5 rounded text-sm" {...props}>
                      {children}
                    </code>
                  );
                },
                h1: ({ children }) => <h1 className="text-2xl font-bold text-white mb-4">{children}</h1>,
                h2: ({ children }) => <h2 className="text-xl font-semibold text-white mb-3">{children}</h2>,
                h3: ({ children }) => <h3 className="text-lg font-medium text-white mb-2">{children}</h3>,
                p: ({ children }) => <p className="text-gray-300 mb-3 leading-relaxed">{children}</p>,
                strong: ({ children }) => <strong className="text-white font-semibold">{children}</strong>,
                ul: ({ children }) => <ul className="list-disc list-inside text-gray-300 mb-3 space-y-1">{children}</ul>,
                ol: ({ children }) => <ol className="list-decimal list-inside text-gray-300 mb-3 space-y-1">{children}</ol>,
              }}
            >
              {result}
            </ReactMarkdown>
          </div>
        </ScrollArea>
      )}
    </>
  );
};
