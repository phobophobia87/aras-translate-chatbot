import fs from "fs";
import path from "path";
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { GoogleGenAI } from "@google/generative-ai";

// ۱. تابع ریاضی برای مقایسه شباهت دو بردار (هر چقدر خروجی به ۱ نزدیک‌تر باشد، شباهت بیشتر است)
function cosineSimilarity(vecA, vecB) {
  let dotProduct = 0.0;
  let normA = 0.0;
  let normB = 0.0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

export default async function handler(req, res) {
  // فقط درخواست‌های POST را قبول می‌کنیم
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { message } = req.body; // سوالی که کاربر در کادر چت تایپ کرده
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

    if (!message) {
      return res.status(400).json({ error: "پیامی ارسال نشده است." });
    }

    // ۲. تبدیل سوال کاربر به بردار (اعداد ریاضی)
    const embeddings = new GoogleGenerativeAIEmbeddings({
      apiKey: GEMINI_API_KEY,
      modelName: "models/text-embedding-004",
    });
    const userVector = await embeddings.embedQuery(message);

    // ۳. خواندن فایل دیتابیس برداری ما (embeddings.json) از روی دیسک
    const filePath = path.join(process.cwd(), "embeddings.json");
    if (!fs.existsSync(filePath)) {
      return res.status(500).json({ error: "فایل دیتابیس embeddings.json پیدا نشد. ابتدا scripts/prepare_data.js را اجرا کنید." });
    }
    const fileData = JSON.parse(fs.readFileSync(filePath, "utf8"));

    // ۴. محاسبه شباهت سوال کاربر با تک‌تک جملات پی‌دی‌اف و انتخاب ۳ مورد شبیه‌تر
    const matchedDocs = fileData
      .map(item => ({
        pageContent: item.pageContent,
        similarity: cosineSimilarity(userVector, item.vector)
      }))
      .sort((a, b) => b.similarity - a.similarity) // مرتب‌سازی از بیشترین شباهت به کمترین
      .slice(0, 3); // جدا کردن ۳ تا از شبیه‌ترین بخش‌ها

    // چسباندن متن‌های پیدا شده به هم برای ساخت "کانتکست"
    const contextText = matchedDocs.map(doc => doc.pageContent).join("\n\n");

    // ۵. تعریف و راه‌اندازی مدل چت جمینای برای تولید پاسخ نهایی
    const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
    
    const prompt = `
تو پشتیبان هوشمند و سخنگوی دارالترجمه رسمی ارس هستی. با لحنی مودبانه، حرفه‌ای و صمیمی به زبان فارسی پاسخ کاربر را بده.
برای پاسخ دادن به سوال کاربر، صرفاً از اطلاعات زیر (Context) استفاده کن. اگر پاسخ در اطلاعات زیر وجود ندارد، خیلی محترمانه بگو که پاسخ این سوال را نمی‌دانی یا از کاربر بخواه با پشتیبانی تلفنی تماس بگیرد و اطلاعات غلط از خودت نساز.

اطلاعات دارالترجمه ارس (حصار امن اطلاعات تو):
"""
${contextText}
"""

سوال کاربر:
${message}
`;

    // ارسال درخواست تولید متن به مدل Gemini 1.5 Flash (سریع و ارزان)
    const response = await ai.models.generateContent({
      model: "gemini-1.5-flash",
      contents: prompt,
    });

    const botAnswer = response.text;

    // ۶. بازگرداندن پاسخ نهایی به فرانت‌اند (کادر چت کاربر)
    return res.status(200).json({ answer: botAnswer });

  } catch (error) {
    console.error("Error in chat API:", error);
    return res.status(500).json({ error: "خطایی در سرور رخ داد: " + error.message });
  }
}