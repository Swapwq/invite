const fs = require("fs");
const path = require("path");

// Load variables from .env.local manually to maintain zero dependencies
function loadEnv() {
  try {
    const envPath = path.join(__dirname, "..", ".env.local");
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, "utf8");
      envContent.split(/\r?\n/).forEach((line) => {
        const matched = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
        if (matched) {
          const key = matched[1];
          let value = matched[2] || "";
          if (value.length > 0 && value.charAt(0) === '"' && value.charAt(value.length - 1) === '"') {
            value = value.substring(1, value.length - 1);
          }
          process.env[key] = value;
        }
      });
      console.log("✅ Настройки из .env.local успешно загружены.");
    } else {
      console.warn("⚠️ Файл .env.local не найден. Бот будет использовать переменные окружения системы.");
    }
  } catch (e) {
    console.error("❌ Ошибка чтения .env.local:", e.message);
  }
}

loadEnv();

const token = process.env.TELEGRAM_BOT_TOKEN;
const baseUrl = process.env.NODE_ENV === "development" ? "http://localhost:3000" : "https://www.sinowaycargo.com";

if (!token) {
  console.error("\n❌ ОШИБКА: TELEGRAM_BOT_TOKEN не задан!");
  console.error("Создайте файл .env.local в корне проекта и добавьте туда:");
  console.error('TELEGRAM_BOT_TOKEN="ваш_токен_бота"\n');
  process.exit(1);
}

// In-memory session store
const sessions = {};

// Helper to send message via Telegram Bot API
async function sendMessage(chatId, text, replyMarkup = null) {
  const url = `https://api.telegram.org/bot${token}/sendMessage`;
  const body = {
    chat_id: chatId,
    text: text,
    parse_mode: "HTML",
  };
  if (replyMarkup) {
    body.reply_markup = replyMarkup;
  }

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      console.error(`Telegram API error: ${response.status} ${await response.text()}`);
    }
  } catch (err) {
    console.error("Failed to send message:", err.message);
  }
}

// Handle incoming message
async function handleMessage(message) {
  const chatId = message.chat.id;
  const text = (message.text || "").trim();

  console.log(`[Message] From ${message.from.username || message.from.first_name} (${chatId}): "${text}"`);

  if (text.startsWith("/start")) {
    sessions[chatId] = { step: "name" };
    await sendMessage(
      chatId,
      "Привет! Я помогу тебе создать красивое интерактивное приглашение на свидание. 💖\n\n" +
        "Напиши <b>имя получателя приглашения</b> (например: <i>Даруся</i>):"
    );
    return;
  }

  const session = sessions[chatId];
  if (!session) {
    await sendMessage(chatId, "Напиши /start, чтобы начать создание приглашения.");
    return;
  }

  if (session.step === "name") {
    if (!text) {
      await sendMessage(chatId, "Пожалуйста, введи имя получателя:");
      return;
    }
    session.targetName = text;
    session.step = "activities";

    await sendMessage(
      chatId,
      `Принято: <b>${text}</b>\n\n` +
        "Теперь давай определимся с занятиями. Напиши <b>4 варианта занятий через запятую</b>.\n" +
        "<i>Пример: Ужин в ресторане, Прогулка под луной, Кофе и десерт, Вечер-сюрприз</i>\n\n" +
        'Или напиши слово <b>"стандартные"</b>, чтобы использовать стандартный набор вариантов.'
    );
    return;
  }


  if (session.step === "activities") {
    let activities = [];
    if (text.toLowerCase() === "стандартные") {
      activities = ["Кофе и десерт", "Ужин в ресторане", "Прогулка под луной", "Вечер-сюрприз"];
    } else {
      activities = text.split(",").map(a => a.trim()).filter(Boolean);
    }
    if (activities.length < 1) {
      await sendMessage(chatId, "⚠️ Пожалуйста, введите хотя бы 1 вариант занятия через запятую (или напишите 'стандартные'):");
      return;
    }
    session.activities = activities;
    session.step = "customTitle";
    await sendMessage(chatId, "Введите заголовок приглашения (или напишите 'по умолчанию'):");
    return;
  }

  if (session.step === "customTitle") {
    session.customTitle = text.toLowerCase() === "по умолчанию" ? undefined : text;
    session.step = "customDescription";
    await sendMessage(chatId, "Введите описание приглашения (или напишите 'по умолчанию'):");
    return;
  }

  if (session.step === "customDescription") {
    session.customDescription = text.toLowerCase() === "по умолчанию" ? undefined : text;
    session.step = "allowDateTime";
    await sendMessage(chatId, "Разрешить получателю выбрать дату и время? (да/нет):");
    return;
  }

  if (session.step === "allowDateTime") {
    const yes = ["да", "yes", "y"];
    session.allowDateTimeSelection = yes.includes(text.toLowerCase());
    // Create invitation
    await sendMessage(chatId, "⏳ Создаю приглашение, секунду...");
    try {
      const response = await fetch(`${baseUrl}/api/invitations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          creatorChatId: chatId,
          targetName: session.targetName,
          activities: session.activities,
          ...(session.customTitle && { customTitle: session.customTitle }),
          ...(session.customDescription && { customDescription: session.customDescription }),
          ...(session.allowDateTimeSelection !== undefined && { allowDateTimeSelection: session.allowDateTimeSelection })
        })
      });
      if (!response.ok) {
        throw new Error(`API responded with ${response.status}`);
      }
      const data = await response.json();
      const inviteUrl = `${baseUrl}/invite/${data.invitation.id}`;
      await sendMessage(
        chatId,
        `✨ <b>Приглашение для ${session.targetName} успешно создано!</b>\n\nОтправь ей эту ссылку:\n<code>${inviteUrl}</code>\n\nЯ пришлю тебе уведомление сюда, как только она примет приглашение! 🥰`
      );
      delete sessions[chatId];
    } catch (err) {
      console.error("API error:", err.message);
      await sendMessage(chatId,
        "❌ Не удалось подключиться к серверу сайта.\n\nУбедись, что твой Next.js сервер запущен локально (выполнена команда <code>npm run dev</code>)."
      );
    }
    return;
  }
}


// Polling loop
let offset = 0;
async function startPolling() {
  console.log(`🤖 Бот запущен! Опрашиваю сервер Telegram...`);
  console.log(`🔗 Базовый URL для ссылок: ${baseUrl}`);

  while (true) {
    const url = `https://api.telegram.org/bot${token}/getUpdates?offset=${offset}&timeout=30`;
    try {
      const response = await fetch(url);
      if (!response.ok) {
        console.error(`Telegram getUpdates error: ${response.status}`);
        await new Promise((resolve) => setTimeout(resolve, 5000));
        continue;
      }

      const data = await response.json();
      if (data.ok && data.result.length > 0) {
        for (const update of data.result) {
          offset = update.update_id + 1;
          if (update.message) {
            await handleMessage(update.message);
          }
        }
      }
    } catch (err) {
      console.error("Polling fetch error:", err.message);
      await new Promise((resolve) => setTimeout(resolve, 5000));
    }
  }
}

startPolling();
