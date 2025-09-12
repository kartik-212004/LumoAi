import { NextRequest, NextResponse } from "next/server";
import { inngest } from "@/inngest/client";
import { auth } from "@clerk/nextjs/server";

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const body = await request.json();
    const { type = "debug", projectId } = body;
    
    if (type === "debug") {
      // Trigger debug function
      const result = await inngest.send({
        name: "debug/run",
        data: { userId }
      });
      
      return NextResponse.json({ 
        success: true, 
        message: "Debug function triggered",
        eventId: result.ids[0]
      });
    }
    
    if (type === "simple" && projectId) {
      // Trigger simple test function
      const result = await inngest.send({
        name: "test/simple",
        data: { projectId, userId }
      });
      
      return NextResponse.json({ 
        success: true, 
        message: "Simple test triggered",
        eventId: result.ids[0]
      });
    }
    
    return NextResponse.json({ error: "Invalid test type or missing projectId" }, { status: 400 });
    
  } catch (error) {
    console.error("Debug API error:", error);
    return NextResponse.json({ 
      error: "Failed to trigger test",
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
