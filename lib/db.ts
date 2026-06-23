import fs from "fs/promises";
import path from "path";
import { createClient } from "@supabase/supabase-js";

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

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = supabaseUrl && supabaseServiceRoleKey
  ? createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    })
  : null;

type InvitationRow = {
  id: string;
  invitation: Invitation;
};

export async function readDb(): Promise<Record<string, Invitation>> {
  if (supabase) {
    const { data, error } = await supabase
      .from("invitations")
      .select("id, invitation");

    if (error) {
      throw error;
    }

    return (data as InvitationRow[]).reduce<Record<string, Invitation>>((acc, row) => {
      acc[row.id] = row.invitation;
      return acc;
    }, {});
  }

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
  if (supabase) {
    const invitation = Object.values(invitations).at(-1);

    if (!invitation) {
      return;
    }

    const { error } = await supabase
      .from("invitations")
      .upsert({ id: invitation.id, invitation }, { onConflict: "id" });

    if (error) {
      throw error;
    }

    return;
  }

  const dir = path.dirname(DB_PATH);
  // Ensure the directory exists
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(DB_PATH, JSON.stringify({ invitations }, null, 2), "utf-8");
}
