"use client";

import { trpc } from "@/trpc/client";
import React, { useEffect, useRef } from "react";
import MessageCard from "./message-card";
import { MessageForm } from "./message-form";
import { Fragment } from "@prisma/client";
import { MessageLoading } from "./message-loading";

interface Props {
  projectId: string;
  activeFragment: Fragment | null;
  setActiveFragment: (fragment: Fragment | null) => void;
}

export default function MessagesContainer({
  projectId,
  activeFragment,
  setActiveFragment,
}: Props) {
  const [messages] = trpc.messages.getMany.useSuspenseQuery(
    {
      projectId,
    },
    { refetchInterval: 5000 }
  );

  const bottomRef = useRef<HTMLDivElement>(null);

  // useEffect(() => {
  //   const lastAssistantMessage = messages.findLast(
  //     (message) => message.role === "ASSISTANT" && !!message.Fragment
  //   );

  //   if (lastAssistantMessage) {
  //     setActiveFragment(lastAssistantMessage.Fragment);
  //   }
  // }, [messages, setActiveFragment]);

  // useEffect(() => {
  //   bottomRef.current?.scrollIntoView();
  // }, [messages.length]);

  const lastMessage = messages[messages.length - 1];
  const isLastMessageUser = lastMessage?.role === "USER";

  return (
    <div className="flex flex-col min-h-0 ">
      <div className="flex-1 min-h-0 overflow-y-auto">
        <div className="pt-2 pr-1">
          {messages.map((message) => (
            <MessageCard
              key={message.id}
              content={message.content}
              role={message.role}
              fragment={message.Fragment}
              createdAt={message.createdAt}
              isActiveFragment={
                activeFragment?.id === message.Fragment?.id
              }
              onFragmentClick={() => {}}
              type={message.type}
            />
          ))}
          {isLastMessageUser && <MessageLoading />}
          <div ref={bottomRef} />
        </div>
      </div>
      <div className="relative p-3 pt-1">
        <div className="absolute -top-6 left-0 right-0 h-6 bg-gradient-to-b from-transparent to-background/70 pointer-events-auto" />
        <MessageForm projectId={projectId} />
      </div>
    </div>
  );
}
