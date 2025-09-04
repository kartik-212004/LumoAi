"use client";

import { trpc } from "@/trpc/client";
import {
  ResizableHandle,
  ResizablePanelGroup,
  ResizablePanel,
} from "@/components/ui/resizable";
import { Suspense } from "react";
import MessagesContainer from "./components/messages-container";

interface Props {
  projectId: string;
}

export default function ProjectView({ projectId }: Props) {
  const [project] = trpc.projects.getOne.useSuspenseQuery({
    id: projectId,
  });

  return (
    <div className="h-screen">
      <ResizablePanelGroup direction="horizontal">
        <ResizablePanel
          defaultSize={35}
          minSize={20}
          className="flex- flex-col min-h-0"
        >
          <Suspense fallback={<div>Loading Messages...</div>}>
            <MessagesContainer projectId={projectId} />
          </Suspense>
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel defaultSize={65} minSize={50}>
          TODO: Preview
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}
