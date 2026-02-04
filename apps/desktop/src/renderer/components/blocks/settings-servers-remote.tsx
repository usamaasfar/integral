import { zodResolver } from "@hookform/resolvers/zod";
import { BadgeCheck, ExternalLink, LoaderCircle, Search, Server, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import * as z from "zod";

import { Avatar, AvatarFallback, AvatarImage } from "~/renderer/components/ui/avatar";
import { Badge } from "~/renderer/components/ui/badge";
import { Button } from "~/renderer/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader } from "~/renderer/components/ui/card";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/renderer/components/ui/dialog";
import { FieldGroup } from "~/renderer/components/ui/field";
import { InputGroup, InputGroupAddon, InputGroupInput } from "~/renderer/components/ui/input-group";
import { ScrollArea } from "~/renderer/components/ui/scroll-area";
import { useServersStore } from "~/renderer/stores/servers";

const formSchema = z.object({ term: z.string() });

export const SettingsRemoteServers = () => {
  const { getRemoteMCPSearchResults, isSearchingRemoteMCP, loadConnectedServers } = useServersStore();

  const form = useForm<z.infer<typeof formSchema>>({ resolver: zodResolver(formSchema), defaultValues: { term: "" } });

  useEffect(() => {
    loadConnectedServers();
  }, [loadConnectedServers]);

  useEffect(() => {
    const subscription = form.watch((value) => {
      if (value.term) getRemoteMCPSearchResults(value.term);
    });
    return () => subscription.unsubscribe();
  }, [form, getRemoteMCPSearchResults]);

  useEffect(() => {
    const handleOAuthCallback = async (data: { code: string; state: string }) => {
      console.log("OAuth callback received:", data);

      const pendingNamespace = localStorage.getItem("mcp-pending-oauth-namespace");
      const pendingDisplayName = localStorage.getItem("mcp-pending-oauth-displayname");
      const pendingIconUrl = localStorage.getItem("mcp-pending-oauth-iconurl");

      if (!pendingNamespace) {
        console.warn("OAuth callback received but no pending namespace");
        return;
      }

      try {
        console.log(`Completing OAuth for ${pendingDisplayName || pendingNamespace} with code ${data.code.substring(0, 10)}...`);
        const result = await window.electronAPI.completeMCPOAuth(pendingNamespace, data.code);

        if (result.success) {
          const { connectRemoteMCPServer } = useServersStore.getState();
          await connectRemoteMCPServer(pendingNamespace, {
            displayName: pendingDisplayName || undefined,
            iconUrl: pendingIconUrl || undefined,
          });

          alert(`Successfully connected to ${pendingDisplayName || pendingNamespace}!`);
          loadConnectedServers();
        } else {
          alert(`Failed to complete OAuth for ${pendingDisplayName || pendingNamespace}`);
        }
      } catch (error: any) {
        console.error("OAuth completion error:", error);
        alert(`OAuth error: ${error.message}`);
      } finally {
        localStorage.removeItem("mcp-pending-oauth-namespace");
        localStorage.removeItem("mcp-pending-oauth-displayname");
        localStorage.removeItem("mcp-pending-oauth-iconurl");
      }
    };

    window.electronAPI.onMCPOAuthCallback(handleOAuthCallback);
  }, []);

  function onSubmit(data: z.infer<typeof formSchema>) {
    console.log(data);
  }

  return (
    <Card className="relative h-full flex flex-col rounded-t-none">
      <CardHeader>
        <CardDescription>Discover and connect MCP servers</CardDescription>
      </CardHeader>
      <ScrollArea className="flex-1 h-0">
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <FieldGroup>
              <Controller
                name="term"
                control={form.control}
                render={({ field }) => (
                  <InputGroup>
                    <InputGroupAddon>
                      {isSearchingRemoteMCP && form.watch("term") ? (
                        <LoaderCircle className="h-4 w-4 animate-spin" />
                      ) : (
                        <Search className="h-4 w-4" />
                      )}
                    </InputGroupAddon>
                    <InputGroupInput {...field} placeholder="Search MCP servers..." />
                    {field.value && (
                      <InputGroupAddon align="inline-end">
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => field.onChange("")}>
                          <X className="h-4 w-4" />
                        </Button>
                      </InputGroupAddon>
                    )}
                  </InputGroup>
                )}
              />
            </FieldGroup>
          </form>
          <div className="mt-4">{form.watch("term") ? <SearchRemoteMCPServers /> : <ConnectedRemoteMCPServers />}</div>
        </CardContent>
      </ScrollArea>
    </Card>
  );
};

const SearchRemoteMCPServers = () => {
  const { remoteMCPSearchResults, isSearchingRemoteMCP, connectRemoteMCPServer, isConnecting, connectedServers, disconnectMCPServer } =
    useServersStore();
  const [connectingServer, setConnectingServer] = useState<string | null>(null);
  const [disconnectingServer, setDisconnectingServer] = useState<string | null>(null);

  console.log({ connectedServers });

  const handleDisconnectServer = async (server) => {
    if (!server.namespace) return;

    setDisconnectingServer(server.namespace);
    try {
      await disconnectMCPServer(server.namespace);
      console.log(`Disconnected from ${server.displayName}`);
    } catch (error: any) {
      console.error("Disconnect error:", error);
      alert(`Error disconnecting from ${server.displayName}: ${error.message}`);
    } finally {
      setDisconnectingServer(null);
    }
  };

  const handleConnectServer = async (server) => {
    if (!server.namespace) return;

    setConnectingServer(server.namespace);
    try {
      const result = await connectRemoteMCPServer({
        namespace: server.namespace,
        displayName: server.displayName,
        iconUrl: server.iconUrl,
        verified: server.verified,
        homepage: server.homepage,
      });

      console.log(result);

      // if (result.needsAuth) {
      //   localStorage.setItem("mcp-pending-oauth-namespace", server.namespace);
      //   localStorage.setItem("mcp-pending-oauth-displayname", server.displayName);
      //   localStorage.setItem("mcp-pending-oauth-iconurl", server.iconUrl || "");
      //   alert(
      //     `OAuth Required\n\nA browser window has been opened for authorization.\n\nPlease authorize ${server.displayName} in your browser.\n\nThe connection will complete automatically after authorization.`,
      //   );
      // } else if (result.success) {
      //   console.log(`Successfully connected to ${server.displayName}`);
      // } else {
      //   alert(`Failed to connect to ${server.displayName}`);
      // }
    } catch (error: any) {
      console.error("Connection error:", error);
      alert(`Error connecting to ${server.displayName}: ${error.message}`);
    } finally {
      setConnectingServer(null);
    }
  };

  if (!isSearchingRemoteMCP)
    return (
      <div className="">
        {remoteMCPSearchResults.length === 0 ? (
          <div className="text-sm text-muted-foreground py-4">{isSearchingRemoteMCP ? "Searching..." : "No results found"}</div>
        ) : (
          <div>
            {remoteMCPSearchResults.map((server) => (
              <Dialog key={server.id}>
                <DialogTrigger asChild>
                  <div className="h-11 flex items-center gap-2 p-2 rounded-md hover:bg-accent">
                    <Avatar className="h-5 w-5 rounded-xs">
                      <AvatarImage src={server.iconUrl || undefined} alt={server.displayName} />
                      <AvatarFallback>
                        <Server className="h-4 w-4" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <p>{server.displayName}</p>
                      {connectedServers[server.namespace] && (
                        <Badge variant="secondary" className="gap-1 bg-blue-600">
                          Installed
                        </Badge>
                      )}
                      {server.verified && (
                        <Badge variant="secondary" className="gap-1 bg-green-600">
                          <BadgeCheck className="h-3 w-3" />
                          Verified
                        </Badge>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={(e) => {
                        e.stopPropagation();
                        window.electronAPI.openExternalLink(server.homepage);
                      }}
                    >
                      <ExternalLink className="h-3 w-3" />
                    </Button>
                  </div>
                </DialogTrigger>

                <DialogContent showCloseButton={false} className="max-w-md">
                  <DialogHeader>
                    <DialogTitle className="flex justify-between">
                      <div className="flex items-center gap-2">
                        <Avatar className="h-7 w-7 rounded-xs">
                          <AvatarImage src={server.iconUrl || undefined} alt={server.displayName} />
                          <AvatarFallback>
                            <Server className="h-7 w-7" />
                          </AvatarFallback>
                        </Avatar>

                        {server.displayName}
                        {server.verified && (
                          <Badge variant="secondary" className="gap-1 bg-green-600">
                            <BadgeCheck className="h-3 w-3" />
                            Verified
                          </Badge>
                        )}
                      </div>

                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={(e) => {
                          e.stopPropagation();
                          window.electronAPI.openExternalLink(server.homepage);
                        }}
                      >
                        <ExternalLink className="h-3 w-3" />
                      </Button>
                    </DialogTitle>
                  </DialogHeader>

                  <div className="space-y-4">
                    <div>
                      <h4 className="text-sm font-medium mb-1">Description</h4>
                      <p className="text-sm text-muted-foreground">{server.description}</p>
                    </div>
                  </div>

                  <DialogFooter className="w-full flex gap-2">
                    <DialogClose asChild>
                      <Button variant="outline" className="flex-1">
                        Close
                      </Button>
                    </DialogClose>

                    {connectedServers[server.namespace] ? (
                      <Button
                        variant="destructive"
                        className="flex-1"
                        disabled={disconnectingServer === server.namespace}
                        onClick={() => handleDisconnectServer(server)}
                      >
                        {disconnectingServer === server.namespace ? (
                          <>
                            <LoaderCircle className="h-4 w-4 animate-spin mr-2" />
                            Disconnecting...
                          </>
                        ) : (
                          "Disconnect"
                        )}
                      </Button>
                    ) : (
                      <Button
                        className="flex-1"
                        disabled={isConnecting || connectingServer === server.namespace}
                        onClick={async () => handleConnectServer(server)}
                      >
                        {connectingServer === server.namespace ? (
                          <>
                            <LoaderCircle className="h-4 w-4 animate-spin mr-2" />
                            Connecting...
                          </>
                        ) : (
                          "Install"
                        )}
                      </Button>
                    )}
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            ))}
          </div>
        )}
      </div>
    );
};

const ConnectedRemoteMCPServers = () => {
  const { connectedServers, disconnectMCPServer } = useServersStore();
  const [disconnecting, setDisconnecting] = useState<string | null>(null);

  if (Object.keys(connectedServers).length === 0) {
    return (
      <div className="text-center py-8">
        <Server className="h-12 w-12 mx-auto text-muted-foreground/50 mb-2" />
        <p className="text-sm text-muted-foreground">No connected servers</p>
        <p className="text-xs text-muted-foreground mt-1">Search above to discover and connect MCP servers</p>
      </div>
    );
  }

  const handleDisconnect = async (server) => {
    setDisconnecting(server);
    try {
      await disconnectMCPServer(server);
    } catch (error) {
      console.error("Failed to disconnect:", error);
    }
    setDisconnecting(null);
  };

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium mb-3">Connected Servers</p>
      {Object.keys(connectedServers).map((server) => (
        <div key={server} className="flex items-center justify-between p-3 border rounded-md">
          <div className="flex items-center gap-3">
            <Avatar className="h-5 w-5 rounded-xs">
              {connectedServers[server].iconUrl && (
                <AvatarImage src={connectedServers[server].iconUrl} alt={connectedServers[server].displayName} />
              )}
              <AvatarFallback>
                <Server className="h-4 w-4" />
              </AvatarFallback>
            </Avatar>
            <div className="flex">
              <p className="text-sm font-medium">{connectedServers[server].displayName} </p>
              {connectedServers[server].verified && (
                <Badge variant="ghost">
                  <BadgeCheck className="text-green-600" />
                </Badge>
              )}
            </div>
          </div>
          <Button variant="outline" size="sm" disabled={disconnecting === server} onClick={async () => handleDisconnect(server)}>
            {disconnecting === server ? (
              <>
                <LoaderCircle className="h-3 w-3 animate-spin mr-2" />
                Disconnecting...
              </>
            ) : (
              "Disconnect"
            )}
          </Button>
        </div>
      ))}
    </div>
  );
};
