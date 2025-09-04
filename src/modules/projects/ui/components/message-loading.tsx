import { useState, useEffect } from "react";
import Image from "next/image";

export default function ShimmerMessages() {
  const messages = [
    "Thinking...",
    "Loading components...",
    "Generating your layout...",
    "Crafting pixel-perfect design...",
    "Optimizing responsiveness...",
    "Polishing the UI...",
    "Writing clean, modern code...",
    "Assembling your website...",
    "Finalizing structure...",
    "Almost ready to launch ",
  ];

  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentMessageIndex((prev) => prev + 1);
    }, 2000);

    return () => clearInterval(interval);
  }, [messages.length]);

  return (
    <div className="flex items-center gap-2">
      <span className="text-base text-muted-foreground animate-pulse">
        {messages[currentMessageIndex]}
      </span>
    </div>
  );
}

export const MessageLoading = () => {
  return (
    <div className="flex flex-col group px-2 pb-4">
      <div className="flex items-center gap-2 pl-2 mb-2">
        <Image
          src="/logo.svg"
          alt="lumo"
          width={18}
          height={18}
          className="shrink-0"
        />
        <span className="text-sm font-medium">Lumo</span>
      </div>
      <div className="pl-8.5 flex flex-col gap-y-4">
        <ShimmerMessages />
      </div>
    </div>
  );
};
