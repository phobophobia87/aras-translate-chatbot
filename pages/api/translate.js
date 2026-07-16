// api/translate.js

export default async function handler(req, res) {
  // تنظیمات CORS برای اجازه دادن به وردپرس جهت برقراری ارتباط با ورسل
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*'); // در صورت تمایل می‌توانید آدرس سایت خود را جایگزین * کنید
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  // پاسخ به درخواست‌های پیش‌فرض مرورگر (Preflight)
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'فقط متد POST مجاز است.' });
  }

  const { text, target_lang } = req.body;

  if (!text || !target_lang) {
    return res.status(400).json({ error: 'متن یا زبان مقصد ارسال نشده است.' });
  }

  // کلید API را از تنظیمات امن ورسل می‌خوانیم
  // کد جدید:
  const apiKey = process.env.GEMINI_API_KEY_TRANSLATOR;
  const model = 'gemini-2.5-flash'; // یا gemini-2.5-flash

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
  const prompt = `You are an expert translator for an official translation agency. Translate the following text into ${target_lang}. Provide ONLY the final translation. Do not add any intros, explanations, greetings, or notes. Keep the exact paragraphs and formatting.\n\nText:\n${text}`;

  try {
    const googleRes = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      })
    });

    const data = await googleRes.json();
    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json({ error: 'خطا در ارتباط با سرورهای گوگل' });
  }
}
