import { GoogleGenerativeAI } from "@google/generative-ai";
import fs from "fs";
import path from "path";

// 1. کلید API Gemini
const GEMINI_API_KEY=process.env.GEMINI_API_KEY;

// 2. بارگذاری Embeddingها
const embeddings = JSON.parse(
  fs.readFileSync(path.join(process.cwd(), "embeddings.json"), "utf-8")
);

// 3. تابع برای محاسبه شباهت کسینوسی
function cosineSimilarity(vecA, vecB) {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }

  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

// 4. تابع برای پیدا کردن شبیه‌ترین سند
function findMostSimilar(queryEmbedding, embeddings) {
  let maxSimilarity = -1;
  let mostSimilarDoc = null;

  for (const doc of embeddings) {
    const similarity = cosineSimilarity(queryEmbedding, doc.embedding);
    if (similarity > maxSimilarity) {
      maxSimilarity = similarity;
      mostSimilarDoc = doc.content;
    }
  }

  return mostSimilarDoc;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const { question } = req.body;

  try {
    // 5. اتصال به Gemini برای تولید Embedding سوال کاربر
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const embeddingModel = genAI.getGenerativeModel({ model: "embedding-001" });
    const embeddingResult = await embeddingModel.embedContent(question);
    const queryEmbedding = embeddingResult.embedding.values;

    // 6. پیدا کردن شبیه‌ترین سند
    const context = findMostSimilar(queryEmbedding, embeddings);

    // 7. ساخت پرامپت با استفاده از Context
    const prompt = `
      تو یک دستیار هوشمند برای دارالترجمه ارس هستی.
      از اطلاعات زیر برای پاسخ به سوال کاربر استفاده کن:

      ${context}

      سوال کاربر: ${question}

      اگر پاسخی در اطلاعات بالا پیدا نکردی، بگو:
      "متأسفانه پاسخی برای این سوال ندارم. لطفاً با پشتیبانی تماس بگیرید."
    `;

    // 8. دریافت پاسخ از Gemini
    const chatModel = genAI.getGenerativeModel({ model: "gemini-pro" });
    const chatResult = await chatModel.generateContent(prompt);
    const response = await chatResult.response;
    const text = response.text();

    res.status(200).json({ answer: text });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ answer: "خطا در پردازش سوال. لطفاً دوباره تلاش کنید." });
  }
}
