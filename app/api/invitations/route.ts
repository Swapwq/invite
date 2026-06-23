import { NextResponse } from "next/server";
import crypto from "crypto";
import { readDb, writeDb, Invitation } from "@/lib/db";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      creatorChatId,
      targetName,
      activities,
      customTitle,
      customDescription,
      allowDateSelection,
      allowTimeSelection,
      allowDateTimeSelection,
      fixedDate,
      fixedTime,
    } = body;

    if (!creatorChatId || !targetName || !Array.isArray(activities)) {
      return NextResponse.json(
        { error: "Missing required fields: creatorChatId, targetName, activities" },
        { status: 400 }
      );
    }

    const invitations = await readDb();
    const id = crypto.randomUUID();

    const canSelectDate = typeof allowDateSelection === "boolean" ? allowDateSelection : allowDateTimeSelection;
    const canSelectTime = typeof allowTimeSelection === "boolean" ? allowTimeSelection : allowDateTimeSelection;

    const newInvitation: Invitation = {
      id,
      creatorChatId: String(creatorChatId),
      targetName: String(targetName).trim(),
      activities: activities.map(a => String(a).trim()),
      status: "pending",
      acceptedDetails: null,
      allowDateSelection: typeof canSelectDate === "boolean" ? canSelectDate : true,
      allowTimeSelection: typeof canSelectTime === "boolean" ? canSelectTime : true,
    };

    if (customTitle && String(customTitle).trim()) {
      newInvitation.customTitle = String(customTitle).trim();
    }
    if (customDescription && String(customDescription).trim()) {
      newInvitation.customDescription = String(customDescription).trim();
    }
    if (fixedDate && String(fixedDate).trim()) {
      newInvitation.fixedDate = String(fixedDate).trim();
    }
    if (fixedTime && String(fixedTime).trim()) {
      newInvitation.fixedTime = String(fixedTime).trim();
    }

    invitations[id] = newInvitation;
    await writeDb(invitations);

    return NextResponse.json({ success: true, invitation: newInvitation });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Failed to create invitation", details: message },
      { status: 500 }
    );
  }
}
