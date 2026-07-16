import { PDFLoader } from "langchain/document_loaders/fs/pdf";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import fs from "fs";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

async function prepareData() {
  // ۱. بارگذاری فایل PDF
  const loader = new PDFLoader("./data/aras_knowledge_graph.pdf"); // مطمئن شوید نام فایل با پی‌دی‌اف شما یکی است
  const documents = await loader.load();

  // ۲. تقسیم متن
  const textSplitter = new RecursiveCharacterTextSplitter({
    chunkSize: 800,
    chunkOverlap: 150,
  });
  const texts = await textSplitter.splitDocuments(documents);

  // ۳. ساخت امبدینگ‌ها با جمینای
  // ۲. تولید بردار (اعداد) برای سوال کاربر
    const embeddings = new GoogleGenerativeAIEmbeddings({
      apiKey: GEMINI_API_KEY,
      modelName: "text-embedding-004", // ✅ فرمت صحیح
    });

  console.log("🔄 در حال تولید وکتورها...");
  const dataToSave = [];

  for (const doc of texts) {
    const vector = await embeddings.embedQuery(doc.pageContent);
    dataToSave.push({
      pageContent: doc.pageContent,
      metadata: doc.metadata,
      vector: vector
    });
  }

  // ۴. ذخیره به صورت یک فایل JSON تمیز و سبک
  fs.writeFileSync("./embeddings.json", JSON.stringify(dataToSave, null, 2));
  console.log("✅ دیتابیس برداری به صورت فایل JSON با موفقیت ساخته شد!");
}

prepareData().catch(console.error);