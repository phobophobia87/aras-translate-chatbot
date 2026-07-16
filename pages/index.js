import { useState, useRef, useEffect } from "react";

export default function Chat() {
  const [messages, setMessages] = useState([
    { role: "bot", text: "سلام! روزتون بخیر. به پشتیبانی هوشمند دارالترجمه رسمی ارس خوش آمدید. چطور می‌توانم کمکتان کنم؟" }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // اسکرول خودکار به پایین بعد از هر پیام
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };
  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

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
    <div style={{ fontFamily: "Tahoma, sans-serif", backgroundColor: "#f9fafb", height: "100vh", display: "flex", flexDirection: "column", direction: "rtl" }}>
      {/* هدر چت‌بات */}
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
            padding: "10px 15px",
            borderRadius: "15px",
            maxWidth: "80%",
            lineHeight: "1.6",
            borderBottomRightRadius: msg.role === "bot" ? "0" : "15px",
            borderBottomLeftRadius: msg.role === "user" ? "0" : "15px",
          }}>
            {msg.text}
          </div>
        ))}
        {loading && (
          <div style={{ alignSelf: "flex-end", backgroundColor: "#e9ecef", padding: "10px 15px", borderRadius: "15px", color: "#6c757d" }}>
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
          style={{ flex: 1, padding: "10px", border: "1px solid #ccc", borderRadius: "20px", outline: "none", direction: "rtl" }}
        />
        <button type="submit" disabled={loading} style={{
          backgroundColor: "#004085", color: "white", border: "none", borderRadius: "20px", padding: "0 20px", marginRight: "10px", cursor: loading ? "not-allowed" : "pointer"
        }}>
          ارسال
        </button>
      </form>
    </div>
  );
}