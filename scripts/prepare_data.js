import "dotenv/config";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import fs from "fs";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

async function prepareData() {
  // ۱. خواندن مستقیم فایل متنی فارسی
  const rawText = fs.readFileSync("./data/aras_knowledge.txt", "utf-8");

  // ۲. تقسیم متن به بخش‌های کوچک‌تر
  const textSplitter = new RecursiveCharacterTextSplitter({
    chunkSize: 600,
    chunkOverlap: 100,
  });
  
  // شبیه‌سازی ساختار سند برای سازگاری با بقیه کدها
  const texts = await textSplitter.createDocuments([rawText]);

  // ۳. ساخت امبدینگ‌ها با مدل جدید جمینای
  const embeddings = new GoogleGenerativeAIEmbeddings({
    apiKey: GEMINI_API_KEY,
    modelName: "gemini-embedding-001",
  });

  console.log("🔄 در حال تولید وکتورها برای متون فارسی...");
  const dataToSave = [];

  for (const doc of texts) {
    const vector = await embeddings.embedQuery(doc.pageContent);
    dataToSave.push({
      pageContent: doc.pageContent,
      vector: vector
    });
  }

  // ۴. ذخیره به صورت فایل JSON
  fs.writeFileSync("./embeddings.json", JSON.stringify(dataToSave, null, 2));
  console.log("✅ دیتابیس برداری متنی با موفقیت ساخته شد!");
}

prepareData().catch(console.error);