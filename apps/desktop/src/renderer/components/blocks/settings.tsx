import { useEffect, useState } from "react";

import { SettingsGeneral } from "~/renderer/components/blocks/settings-general";
import { Providers } from "~/renderer/components/blocks/settings-providers";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/renderer/components/ui/card";
import { Dialog, DialogContent } from "~/renderer/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/renderer/components/ui/tabs";

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
      <DialogContent onPointerDownOutside={(e) => e.preventDefault()} showCloseButton={false} className="max-w-2xl h-120 flex flex-col">
        <Tabs defaultValue="general" className="w-full h-full flex flex-col overflow-hidden">
          <TabsList className="w-full">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="providers">Providers</TabsTrigger>
            <TabsTrigger value="servers">Servers</TabsTrigger>
          </TabsList>
          <TabsContent value="general" className="flex-1 mt-6 h-0">
            <SettingsGeneral />
          </TabsContent>
          <TabsContent value="providers" className="flex-1 mt-6 h-0">
            <Providers />
          </TabsContent>
          <TabsContent value="servers" className="flex-1 mt-6 h-0">
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
