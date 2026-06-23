import fs from "fs/promises";
import path from "path";

export interface Invitation {
  id: string;
  creatorChatId: string;
  targetName: string;
  activities: string[];
  status: "pending" | "accepted";
  acceptedDetails: {
    activity: string;
    date: string;
    time: string;
    message: string;
  } | null;
  customTitle?: string; // Full invitation title, can replace default
  customDescription?: string; // Full invitation description text
  allowDateSelection?: boolean; // If true, invitee can select a date
  allowTimeSelection?: boolean; // If true, invitee can select a time
  fixedDate?: string;
  fixedTime?: string;
}


const DB_PATH = path.join(process.cwd(), "data", "db.json");

export async function readDb(): Promise<Record<string, Invitation>> {
  try {
    const data = await fs.readFile(DB_PATH, "utf-8");
    const parsed = JSON.parse(data);
    return parsed.invitations || {};
  } catch {
    // Return empty if file not found or corrupted
    return {};
  }
}

export async function writeDb(invitations: Record<string, Invitation>): Promise<void> {
  const dir = path.dirname(DB_PATH);
  // Ensure the directory exists
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(DB_PATH, JSON.stringify({ invitations }, null, 2), "utf-8");
}
