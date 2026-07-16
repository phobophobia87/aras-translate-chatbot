import { useState } from "react";

export default function Home() {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const response = await fetch("/api", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ question }),
    });
    const data = await response.json();
    setAnswer(data.answer);
    setLoading(false);
  };

  return (
    <div style={{ maxWidth: "600px", margin: "0 auto", padding: "20px", direction: "rtl" }}>
      <h1>پشتیبانی هوشمند دارالترجمه ارس</h1>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="سوال خود را وارد کنید..."
          style={{ width: "100%", padding: "10px", margin: "10px 0" }}
        />
        <button type="submit" disabled={loading}>
          {loading ? "در حال پردازش..." : "ارسال"}
        </button>
      </form>
      {answer && (
        <div style={{ marginTop: "20px", padding: "10px", backgroundColor: "#f0f0f0", borderRadius: "5px" }}>
          <strong>پاسخ:</strong>
          <p>{answer}</p>
        </div>
      )}
    </div>
  );
}