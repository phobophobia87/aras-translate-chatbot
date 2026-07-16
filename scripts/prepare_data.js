import { GoogleGenerativeAI } from "@google/generative-ai";
import fs from "fs";
import path from "path";

// 1. کلید API Gemini رو اینجا قرار بده
const GEMINI_API_KEY=process.env.GEMINI_API_KEY;

// 2. تابع برای خواندن فایلهای متنی از پوشه `data`
async function loadDocuments() {
  const dataDir = path.join(process.cwd(), "data");
  const files = fs.readdirSync(dataDir);

  let documents = [];
  for (const file of files) {
    if (file.endsWith(".txt")) {
      const filePath = path.join(dataDir, file);
      const content = fs.readFileSync(filePath, "utf-8");
      documents.push(content);
    }
  }

  return documents;
}

// 3. تابع برای تولید Embedding با Gemini
async function generateEmbeddings() {
  const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: "embedding-001" }); // مدل Embedding Gemini

  const documents = await loadDocuments();
  const embeddings = [];

  for (const doc of documents) {
    const result = await model.embedContent(doc);
    embeddings.push({
      content: doc,
      embedding: result.embedding.values,
    });
  }

  // 4. ذخیره Embeddingها در فایل JSON
  fs.writeFileSync(
    path.join(process.cwd(), "embeddings.json"),
    JSON.stringify(embeddings, null, 2)
  );
  console.log("✅ Embeddingها با موفقیت ذخیره شدند!");
}

// 5. اجرای تابع
generateEmbeddings().catch(console.error);