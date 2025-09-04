import { trpc } from "@/trpc/server";
import ProjectView from "@/modules/projects/ui/views/project-view";
import { getQueryClient } from "@/trpc/server";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { Suspense } from "react";
interface Props {
  params: { projectId: string };
}
export default async function Page({ params }: Props) {
  const { projectId } = await params;
  const queryClient = getQueryClient();

  void trpc.messages.getMany.prefetch({ projectId: projectId });
  void trpc.projects.getOne.prefetch({ id: projectId });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <Suspense fallback={<div>Loading...</div>}>
        <ProjectView projectId={projectId} />
      </Suspense>
    </HydrationBoundary>
  );
}
