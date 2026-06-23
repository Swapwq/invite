import { NextResponse } from "next/server";
import { Invitation, readDb } from "@/lib/db";

/**
 * POST /api/invitations/accept
 * Accepts an invitation either by explicit `id` (if provided) or by the `creatorChatId`
 * that created the pending invitation. No persistent DB write – Vercel's filesystem is read‑only.
 */
export async function POST(request: Request) {
  try {
    const { id, creatorChatId, activity, date, time, message, notifyChatId } = await request.json();

    const invitations = await readDb();
    let invitation: Invitation | undefined = undefined;

    if (id) {
      invitation = invitations[id];
    } else if (creatorChatId) {
      // Find first pending invitation created by this chat ID
      invitation = Object.values(invitations).find(
        (inv) => inv.creatorChatId === String(creatorChatId) && inv.status === "pending"
      );
    }

    if (!invitation) {
      return NextResponse.json({ error: "Invitation not found" }, { status: 404 });
    }

    // Update status in‑memory (no persistent write on Vercel)
    invitation.status = "accepted";
    invitation.acceptedDetails = {
      activity: String(activity),
      date: String(date),
      time: String(time),
      message: String(message || "").trim(),
    };

    // Send Telegram notification if token present
    const token = process.env.TELEGRAM_BOT_TOKEN;
    // Determine which chat should receive the notification
    const targetChatId = notifyChatId || invitation.creatorChatId;
    if (token) {
      const formattedDate = new Date(date).toLocaleDateString("ru-RU", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });

      const activityLabels: Record<string, string> = {
        cafe: "Кофе и десерт ☕",
        dinner: "Ужин в ресторане 🍷",
        walk: "Прогулка под луной 🌙",
        surprise: "Вечер‑сюрприз 🎁",
      };
      const activityText = activityLabels[activity] || activity;

      const messageText = `🎉 <b>${invitation.targetName} приняла ваше приглашение на свидание!</b>\n\n` +
        `📍 <b>Формат:</b> ${activityText}\n` +
        `📅 <b>Дата:</b> ${formattedDate}\n` +
        `⏰ <b>Время:</b> ${time}\n` +
        (message ? `💬 <b>Пожелания:</b> <i>"${message}"</i>\n` : "");

      try {
        const resp = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: targetChatId,
            text: messageText,
            parse_mode: "HTML",
          }),
        });
        if (!resp.ok) {
          console.error("Telegram API error", await resp.text());
        }
      } catch (e) {
        console.error("Failed to send Telegram notification", e);
      }
    } else {
      console.warn("TELEGRAM_BOT_TOKEN not set – notification not sent");
    }

    return NextResponse.json({ success: true, invitation });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: "Failed to accept invitation", details: message }, { status: 500 });
  }
}
