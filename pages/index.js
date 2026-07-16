import { useState, useRef, useEffect } from "react";

export default function Chat() {
  const [messages, setMessages] = useState([
    { role: "bot", text: "سلام! روزتون بخیر. به پشتیبانی هوشمند دارالترجمه رسمی ارس خوش آمدید. چطور می‌توانم کمکتان کنم؟" }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };
  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  // تابع برای تبدیل **متن** به حالت توپر (Bold)
  const formatText = (text) => {
    if (!text) return "";
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return <strong key={i}>{part.slice(2, -2)}</strong>;
      }
      return part;
    });
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMsg = input;
    setMessages((prev) => [...prev, { role: "user", text: userMsg }]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMsg }),
      });
      const data = await res.json();
      setMessages((prev) => [...prev, { role: "bot", text: data.answer || "مشکلی پیش آمد." }]);
    } catch (err) {
      setMessages((prev) => [...prev, { role: "bot", text: "ارتباط با سرور قطع شد. لطفاً دوباره تلاش کنید." }]);
    }
    setLoading(false);
  };

  return (
    <div style={{ backgroundColor: "#f9fafb", height: "100vh", display: "flex", flexDirection: "column", direction: "rtl" }}>
      
      {/* اعمال فونت وزیرمتن به کل بخش‌های چت‌بات */}
      <style>{`
        @import url('https://cdn.jsdelivr.net/gh/rastikerdar/vazirmatn@v33.003/Vazirmatn-font-face.css');
        * {
          font-family: 'Vazirmatn', Tahoma, sans-serif !important;
        }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #ccc; border-radius: 10px; }
      `}</style>

      {/* هدر */}
      <div style={{ backgroundColor: "#004085", color: "white", padding: "15px", textAlign: "center", fontWeight: "bold", boxShadow: "0 2px 4px rgba(0,0,0,0.1)" }}>
        پشتیبانی هوشمند دارالترجمه ارس
      </div>

      {/* محیط پیام‌ها */}
      <div style={{ flex: 1, overflowY: "auto", padding: "20px", display: "flex", flexDirection: "column", gap: "10px" }}>
        {messages.map((msg, index) => (
          <div key={index} style={{
            alignSelf: msg.role === "user" ? "flex-start" : "flex-end",
            backgroundColor: msg.role === "user" ? "#007bff" : "#e9ecef",
            color: msg.role === "user" ? "white" : "black",
            padding: "12px 18px",
            borderRadius: "15px",
            maxWidth: "85%",
            lineHeight: "1.8",
            borderBottomRightRadius: msg.role === "bot" ? "0" : "15px",
            borderBottomLeftRadius: msg.role === "user" ? "0" : "15px",
          }}>
            {formatText(msg.text)}
          </div>
        ))}
        {loading && (
          <div style={{ alignSelf: "flex-end", backgroundColor: "#e9ecef", padding: "12px 18px", borderRadius: "15px", color: "#6c757d" }}>
            در حال پردازش...
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* فرم ارسال */}
      <form onSubmit={sendMessage} style={{ display: "flex", padding: "10px", backgroundColor: "white", borderTop: "1px solid #ddd" }}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="سوال خود را بپرسید..."
          style={{ flex: 1, padding: "12px", border: "1px solid #ccc", borderRadius: "20px", outline: "none", direction: "rtl" }}
        />
        <button type="submit" disabled={loading} style={{
          backgroundColor: "#004085", color: "white", border: "none", borderRadius: "20px", padding: "0 25px", marginRight: "10px", cursor: loading ? "not-allowed" : "pointer"
        }}>
          ارسال
        </button>
      </form>
    </div>
  );
}