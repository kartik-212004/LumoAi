"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { trpc } from "@/trpc/client";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";

export default function Page() {
  const [value, setValue] = useState("");
  const createMessage = trpc.messages.create.useMutation();
  const { data: messages } = trpc.messages.getMany.useQuery();

  return (
    <div className="p-4">
      <Input
        value={value}
        onChange={(e) => setValue(e.target.value)}
      />
      <Button
        onClick={() => createMessage.mutate({ value: value })}
        disabled={createMessage.isPending}
      >
        click me
      </Button>
      {JSON.stringify(messages, null, 2)}
    </div>
  );
}
