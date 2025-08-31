import prisma from "@/lib/db";
import { Jost } from "next/font/google";

export default async function Page() {
  const user = await prisma.user.findMany();
  const posts = await prisma.post.findMany();
  return (
    <div>
      {JSON.stringify(user)} {JSON.stringify(posts)}
    </div>
  );
}
