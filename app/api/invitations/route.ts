import { NextResponse } from "next/server";
import crypto from "crypto";
import { readDb, writeDb, Invitation } from "@/lib/db";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { creatorChatId, targetName, activities, customTitle, customDescription, allowDateSelection, allowTimeSelection } = body;

    if (!creatorChatId || !targetName || !Array.isArray(activities)) {
      return NextResponse.json(
        { error: "Missing required fields: creatorChatId, targetName, activities" },
        { status: 400 }
      );
    }

    const invitations = await readDb();
    const id = crypto.randomUUID();

    const newInvitation: Invitation = {
      id,
      creatorChatId: String(creatorChatId),
      targetName: String(targetName).trim(),
      activities: activities.map(a => String(a).trim()),
      status: "pending",
      acceptedDetails: null,
      allowDateSelection: typeof allowDateSelection === "boolean" ? allowDateSelection : undefined,
      allowTimeSelection: typeof allowTimeSelection === "boolean" ? allowTimeSelection : undefined,
    };

    invitations[id] = newInvitation;
    await writeDb(invitations);

    return NextResponse.json({ success: true, invitation: newInvitation });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to create invitation", details: error.message },
      { status: 500 }
    );
  }
}
