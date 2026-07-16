import { GoogleGenerativeAI } from "@google/generative-ai";
import fileData from "../../embeddings.json"; 

// ۱. تابع ریاضی برای مقایسه شباهت دو بردار
function cosineSimilarity(vecA, vecB) {
  let dotProduct = 0.0, normA = 0.0, normB = 0.0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const { message } = req.body;
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

    if (!message) return res.status(400).json({ error: "پیامی ارسال نشده است." });

    // راه‌اندازی SDK رسمی گوگل
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

    // ۲. تولید بردار برای سوال کاربر مستقیماً توسط SDK گوگل (بدون نیاز به Langchain)
    // ۲. تولید بردار برای سوال کاربر مستقیماً توسط SDK گوگل
    const embedModel = genAI.getGenerativeModel({ model: "gemini-embedding-001" }); // 👈 نام مدل آپدیت شد
    const embedResult = await embedModel.embedContent(message);
    const userVector = embedResult.embedding.values;

    // ۳. پیدا کردن ۳ تا از مرتبط‌ترین بخش‌های فایل دیتابیس
    const matchedDocs = fileData
      .map(item => ({
        pageContent: item.pageContent,
        similarity: cosineSimilarity(userVector, item.vector)
      }))
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, 3);

    const contextText = matchedDocs.map(doc => doc.pageContent).join("\n\n");

// ۴. راه‌اندازی پایدارترین مدل جمینای برای تولید جواب نهایی
    const chatModel = genAI.getGenerativeModel({ model: "gemini-pro" }); // 👈 تغییر به مدل پایدار و عمومی

    const prompt = `
تو پشتیبان هوشمند و سخنگوی دارالترجمه رسمی ارس هستی. با لحنی مودبانه، حرفه‌ای و صمیمی به زبان فارسی پاسخ کاربر را بده.
صرفاً از اطلاعات زیر (Context) استفاده کن. اگر در اطلاعات زیر نبود، بگو پاسخ را نمی‌دانی یا کاربر را به تماس با پشتیبانی راهنمایی کن و اطلاعات غلط نساز.

اطلاعات دارالترجمه:
"""
${contextText}
"""

سوال کاربر:
${message}
`;

    // ۵. ارسال درخواست به مدل و دریافت متن
    const result = await chatModel.generateContent(prompt);
    const botAnswer = result.response.text();

    return res.status(200).json({ answer: botAnswer });

  } catch (error) {
    console.error("Server Error:", error);
    return res.status(500).json({ error: error.message });
  }
}