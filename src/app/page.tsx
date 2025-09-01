"use client";

import { Button } from "@/components/ui/button";
import { trpc } from "@/trpc/client";
import { toast } from "sonner";

export default function Page() {
  const invoke = trpc.invoke.useMutation({
    onSuccess: () => toast.success("Backgriund Job Started"),
  });

  return (
    <div className="p-4">
      <Button
        onClick={() => invoke.mutate({ text: "kartik" })}
        disabled={invoke.isPending}
      >
        click me
      </Button>

      {invoke.error && <p>Error: {invoke.error.message}</p>}
      {invoke.isSuccess && <p>Job sent successfully!</p>}
    </div>
  );
}
