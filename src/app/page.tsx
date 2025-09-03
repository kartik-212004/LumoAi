"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { trpc } from "@/trpc/client";
import { useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export default function Page() {
  const router = useRouter();
  const [value, setValue] = useState("");
  const createProject = trpc.projects.create.useMutation({
    onError: (error) => {
      toast.error(error.message);
    },
    onSuccess: (data, variables, context) => {
      router.push(`/projects/${data.id}`);
    },
  });
  const { data: messages } = trpc.messages.getMany.useQuery();

  return (
    <div className="h-screen w-screen flex items-center justify-center">
      <div className="max-w-7xl mx-auto flex items-center flex-col gap-y-4">
        <Input
          value={value}
          onChange={(e) => setValue(e.target.value)}
        />
        <Button
          onClick={() => createProject.mutate({ value: value })}
          disabled={createProject.isPending}
        >
          Submit
        </Button>
        {JSON.stringify(messages, null, 2)}
      </div>
    </div>
  );
}
