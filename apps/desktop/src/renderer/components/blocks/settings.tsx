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
      <DialogContent onPointerDownOutside={(e) => e.preventDefault()} showCloseButton={false} className="max-w-2xl">
        <Tabs defaultValue="general" className="w-full">
          <TabsList className="w-full">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="providers">Providers</TabsTrigger>
            <TabsTrigger value="servers">Servers</TabsTrigger>
          </TabsList>
          <TabsContent value="general">
            <SettingsGeneral />
          </TabsContent>
          <TabsContent value="providers">
            <Providers />
          </TabsContent>
          <TabsContent value="servers">
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
