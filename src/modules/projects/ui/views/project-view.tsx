"use client";

import {
  ResizableHandle,
  ResizablePanelGroup,
  ResizablePanel,
} from "@/components/ui/resizable";
import { Suspense, useState } from "react";
import MessagesContainer from "../components/messages-container";
import { Fragment } from "@prisma/client";
import ProjectHeader from "../components/project-header";
import FragmentWeb from "../components/fragment-web";

interface Props {
  projectId: string;
}

export default function ProjectView({ projectId }: Props) {
  const [activeFragment, setActiveFragment] =
    useState<Fragment | null>(null);

  return (
    <div className="h-screen">
      <ResizablePanelGroup direction="horizontal">
        <ResizablePanel
          defaultSize={35}
          minSize={20}
          className="flex flex-col min-h-0"
        >
          <Suspense fallback={<div>Loading...</div>}>
            <ProjectHeader projectId={projectId} />
          </Suspense>
          <Suspense fallback={<div>Loading Messages...</div>}>
            <MessagesContainer
              activeFragment={activeFragment}
              projectId={projectId}
              setActiveFragment={setActiveFragment}
            />
          </Suspense>
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel defaultSize={65} minSize={50}>
          {activeFragment && <FragmentWeb data={activeFragment} />}
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}
