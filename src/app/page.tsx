"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { trpc } from "@/trpc/client";
import { toast } from "sonner";
import { useState } from "react";

export default function Page() {
  const [value, setValue] = useState("");
  const invoke = trpc.invoke.useMutation({
    onSuccess: () => toast.success("Backgriund Job Started"),
  });

  return (
    <div className="p-4">
      <Input
        value={value}
        onChange={(e) => setValue(e.target.value)}
      />
      <Button
        onClick={() => invoke.mutate({ value: value })}
        disabled={invoke.isPending}
      >
        click me
      </Button>

      {invoke.error && <p>Error: {invoke.error.message}</p>}
      {invoke.isSuccess && <p>Job sent successfully!</p>}
    </div>
  );
}
