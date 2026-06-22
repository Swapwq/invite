import { NextResponse } from "next/server";
import { readDb, writeDb } from "@/lib/db";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { activity, date, time, message } = body;

    const invitations = await readDb();
    const invitation = invitations[id];

    if (!invitation) {
      return NextResponse.json({ error: "Invitation not found" }, { status: 404 });
    }

    // Update status and details
    invitation.status = "accepted";
    invitation.acceptedDetails = {
      activity: String(activity),
      date: String(date),
      time: String(time),
      message: String(message || "").trim(),
    };

    await writeDb(invitations);

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
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to accept invitation", details: error.message },
      { status: 500 }
    );
  }
}
