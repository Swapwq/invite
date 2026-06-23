import { NextResponse } from "next/server";
import { Invitation, readDb } from "@/lib/db";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { id, creatorChatId, activity, date, time, message } = body;

    const invitations = await readDb();

    // Find invitation either by explicit id or by creatorChatId (first pending)
    let invitation: Invitation | undefined = undefined;
    if (id) {
      invitation = invitations[id];
    } else if (creatorChatId) {
      invitation = Object.values(invitations).find(
        (inv) => inv.creatorChatId === String(creatorChatId) && inv.status === "pending"
      );
    }

    if (!invitation) {
      return NextResponse.json({ error: "Invitation not found" }, { status: 404 });
    }

    // In production (read‑only FS) we cannot persist the acceptance. The invitation is updated in memory and the telegram notification is sent.
    // If persistence is required, migrate to a DB or Vercel KV.

    invitation.status = "accepted";
    invitation.acceptedDetails = {
      activity: String(activity),
      date: String(date),
      time: String(time),
      message: String(message || "").trim(),
    };

    // No writeDb call – read‑only file system on Vercel.

    // Send Telegram Notification if token is available
    const token = process.env.TELEGRAM_BOT_TOKEN;
    if (token) {
      const formattedDate = new Date(date).toLocaleDateString("ru-RU", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });

      // Map activity ID to human readable name
      const activityLabels: Record<string, string> = {
        cafe: "Кофе и десерт ☕",
        dinner: "Ужин в ресторане 🍷",
        walk: "Прогулка под луной 🌙",
        surprise: "Вечер-сюрприз 🎁",
      };
      const activityText = activityLabels[activity] || activity;

      const messageText = `🎉 <b>${invitation.targetName} приняла ваше приглашение на свидание!</b>\n\n` +
        `📍 <b>Формат:</b> ${activityText}\n` +
        `📅 <b>Дата:</b> ${formattedDate}\n` +
        `⏰ <b>Время:</b> ${time}\n` +
        (message ? `💬 <b>Пожелания:</b> <i>"${message}"</i>\n` : "");

      const url = `https://api.telegram.org/bot${token}/sendMessage`;

      try {
        const response = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: invitation.creatorChatId,
            text: messageText,
            parse_mode: "HTML",
          }),
        });

        if (!response.ok) {
          console.error("Telegram API response was not OK", await response.text());
        }
      } catch (err) {
        console.error("Failed to send Telegram notification:", err);
      }
    } else {
      console.warn("TELEGRAM_BOT_TOKEN is not set in environment variables.");
    }

    return NextResponse.json({ success: true, invitation });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Failed to accept invitation", details: message },
      { status: 500 }
    );
  }
}
