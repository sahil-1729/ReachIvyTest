import { NextResponse } from "next/server";
import { database } from "@/lib/database";

export async function GET() {
  try {
    const entries = await database.getAllEntries();
    // console.log("entries api route /form-entries ", entries);

    return NextResponse.json({ entries });
  } catch (error) {
    console.error("Error fetching form entries:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
