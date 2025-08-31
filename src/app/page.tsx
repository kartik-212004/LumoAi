import prisma from "@/lib/db";
import { trpc } from "@/trpc/client";
import { caller } from "@/trpc/server";

export default async function Page() {
  const data = await caller.hello({ text: "kartik bhatt" });
  const user = await prisma.user.findMany();
  const posts = await prisma.post.findMany();
  return (
    <div>
      {JSON.stringify(user)} {JSON.stringify(posts)}
      {JSON.stringify(data)}
    </div>
  );
}

// "use client";

// import { trpc } from "@/trpc/client";

// export default function Page() {
//   const { data, isLoading } = trpc.hello.useQuery({ text: "world" });

//   if (isLoading) return <div>Loading...</div>;
//   return <div>{JSON.stringify(data)}</div>;
// }
