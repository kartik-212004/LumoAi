"use client";

import Link from "next/link";
import Image from "next/image";
import { formatDistanceToNow } from "date-fns";
import { Button } from "@/components/ui/button";
import { trpc } from "@/trpc/client";
import { useUser } from "@clerk/nextjs";

export default function ProjectsList() {
  const { user } = useUser();

  const { data: projects = [] } = trpc.projects.getMany.useQuery();

  if (!user) return null;

  return (
    <div className="w-full bg-card/50 backdrop-blur-sm rounded-2xl p-6 md:p-8 border border-border/50 shadow-sm">
      <h2 className="text-xl md:text-2xl font-semibold mb-6 text-foreground/90">
        {user?.firstName ? `${user.firstName}'s Projects` : "Your Projects"}
      </h2>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {projects.length === 0 && (
          <div className="col-span-full text-center py-12">
            <p className="text-muted-foreground">
              No projects yet. Start building something amazing!
            </p>
          </div>
        )}
        
        {projects?.map((project) => (
          <Button
            key={project.id}
            variant="ghost"
            asChild
            className="h-auto p-4 justify-start hover:bg-muted/50 transition-colors duration-200 rounded-xl border border-transparent hover:border-border/50"
          >
            <Link href={`/projects/${project.id}`}>
              <div className="flex items-center gap-3 w-full">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Image
                    src="/logo.svg"
                    alt="lumo"
                    width={20}
                    height={20}
                    className="object-contain"
                  />
                </div>
                <div className="flex flex-col flex-1 min-w-0">
                  <h3 className="truncate font-medium text-sm">
                    {project.name}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {formatDistanceToNow(project.updatedAt, {
                      addSuffix: true,
                    })}
                  </p>
                </div>
              </div>
            </Link>
          </Button>
        ))}
      </div>
    </div>
  );
}
