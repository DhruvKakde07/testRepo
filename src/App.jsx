import { useState } from "react";

// Injected at build time by CodeBuild (VITE_API_URL = Lambda Function URL).
const API_URL = import.meta.env.VITE_API_URL;

export default function App() {
  const [name, setName] = useState("");
  const [status, setStatus] = useState("idle"); // idle | loading | done | error
  const [reply, setReply] = useState("");

  // Lambda is called only from here, i.e. when the user clicks the button.
  async function handleClick() {
    if (!API_URL) {
      setStatus("error");
      setReply("API URL is not configured (VITE_API_URL is missing).");
      return;
    }
    setStatus("loading");
    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "button_click",
          name: name.trim(),
          page: window.location.pathname,
        }),
      });
      if (!res.ok) throw new Error(`Request failed (${res.status})`);
      const data = await res.json();
      setReply(data.message);
      setStatus("done");
    } catch (err) {
      setReply(err.message);
      setStatus("error");
    }
  }

  return (
    <main className="card">
      <h1>React on AWS</h1>
      <p className="muted">
        Hosted on S3 + CloudFront, deployed by CodePipeline. The Lambda below
        runs only when you click.
      </p>

      <input
        type="text"
        placeholder="Your name (optional)"
        value={name}
        maxLength={40}
        onChange={(e) => setName(e.target.value)}
      />
      <button onClick={handleClick} disabled={status === "loading"}>
        {status === "loading" ? "Calling Lambda…" : "Say hello to Lambda"}
      </button>

      {reply && <p className={`reply ${status}`}>{reply}</p>}
    </main>
  );
}
