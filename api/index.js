import { RetrievalQAChain } from "langchain/chains";
import { FaissStore } from "langchain/vectorstores/faiss";
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";

const GEMINI_API_KEY=process.env.GEMINI_API_KEY;

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const { question } = req.body;

  try {
    // بارگذاری دیتابیس برداری
    const embeddings = new GoogleGenerativeAIEmbeddings({
      apiKey: ***
      modelName: "embedding-001",
    });
    const vectorStore = await FaissStore.load(
      "./faiss_index",
      embeddings
    );

    // ساخت زنجیره RAG با Gemini
    const model = new ChatGoogleGenerativeAI({
      apiKey: process.env.GEMINI_API_KEY
      modelName: "gemini-pro", // مدل Gemini برای چت
      temperature: 0.3, // کنترل خلاقیت پاسخها
    });

    const chain = RetrievalQAChain.fromLLM(model, vectorStore.asRetriever());

    // پاسخ به سوال
    const response = await chain.call({
      query: question,
    });

    res.status(200).json({ answer: response.text });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ answer: "خطا در پردازش سوال. لطفاً دوباره تلاش کنید." });
  }
}