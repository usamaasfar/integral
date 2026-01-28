import { useState } from "react";
import { Button } from "./components/ui/button";

interface Tool {
  name: string;
  description: string;
}

const App = () => {
  const [tools, setTools] = useState<Tool[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [connectionType, setConnectionType] = useState<string>("");
  const [aiResponse, setAiResponse] = useState<string>("");
  const [prompt, setPrompt] = useState<string>(
    "Find documentation for React hooks",
  );

  const handleTestRemoteMCP = async () => {
    setLoading(true);
    setError(null);
    setConnectionType("Remote");

    const result = await window.electronAPI.testRemoteMCP();

    if (result.success) {
      setTools(result.tools);
    } else {
      setError(result.error);
    }

    setLoading(false);
  };

  const handleTestLocalMCP = async () => {
    setLoading(true);
    setError(null);
    setConnectionType("Local");

    const result = await window.electronAPI.testLocalMCP();

    if (result.success) {
      setTools(result.tools);
    } else {
      setError(result.error);
    }

    setLoading(false);
  };

  const handleGenerateWithMCP = async () => {
    setLoading(true);
    setError(null);
    setAiResponse("");

    const result = await window.electronAPI.generateWithMCP(prompt);

    if (result.success) {
      setAiResponse(result.text || "");
    } else {
      setError(result.error);
    }

    setLoading(false);
  };

  return (
    <main className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">MCP Connection Test</h1>

      <div className="space-y-6">
        <div className="flex gap-4">
          <Button onClick={handleTestRemoteMCP} disabled={loading}>
            {loading && connectionType === "Remote"
              ? "Testing..."
              : "Test Remote MCP"}
          </Button>

          <Button
            onClick={handleTestLocalMCP}
            disabled={loading}
            variant="outline"
          >
            {loading && connectionType === "Local"
              ? "Testing..."
              : "Test Local MCP"}
          </Button>
        </div>

        <div className="border-t pt-6">
          <h2 className="text-xl font-semibold mb-4">
            AI Agent with MCP Tools
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Prompt:</label>
              <input
                type="text"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="w-full p-2 border rounded-md"
                placeholder="Enter your prompt..."
              />
            </div>
            <Button
              onClick={handleGenerateWithMCP}
              disabled={loading}
              className="w-full"
            >
              {loading && !connectionType
                ? "Generating..."
                : "Generate with MCP Tools"}
            </Button>
          </div>
        </div>

        {error && (
          <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded">
            Error: {error}
          </div>
        )}

        {aiResponse && (
          <div className="mt-6">
            <h3 className="text-lg font-semibold mb-2">AI Response:</h3>
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="whitespace-pre-wrap">{aiResponse}</p>
            </div>
          </div>
        )}

        {tools.length > 0 && (
          <div className="mt-6">
            <h2 className="text-xl font-semibold mb-4">
              {connectionType} MCP - Available Tools ({tools.length})
            </h2>
            <div className="grid gap-3">
              {tools.map((tool, index) => (
                <div key={index} className="p-3 border rounded-lg">
                  <h3 className="font-medium">{tool.name}</h3>
                  <p className="text-sm text-gray-600">{tool.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
};

export default App;
