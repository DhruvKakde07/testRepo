import { useEffect, useState } from "react";
import { listItems, addItem, deleteItem } from "./api.js";

export default function Items({ email, signOut }) {
  const [items, setItems] = useState([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  // Runs right after sign-in: load this user's items from DynamoDB.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await listItems();
        if (!cancelled) setItems(data.items);
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleAdd(e) {
    e.preventDefault();
    const value = text.trim();
    if (!value) return;
    setBusy(true);
    setError("");
    try {
      const { item } = await addItem(value);
      setItems((prev) => [item, ...prev]);
      setText("");
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete(id) {
    setBusy(true);
    setError("");
    try {
      await deleteItem(id);
      setItems((prev) => prev.filter((item) => item.id !== id));
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="card">
      <header className="top">
        <div>
          <h1>My items</h1>
          {email && <p className="muted">Signed in as {email}</p>}
        </div>
        <button className="secondary" onClick={signOut}>
          Sign out
        </button>
      </header>

      <form className="add-row" onSubmit={handleAdd}>
        <input
          type="text"
          placeholder="Add something…"
          value={text}
          maxLength={200}
          onChange={(e) => setText(e.target.value)}
        />
        <button type="submit" disabled={busy || !text.trim()}>
          Add
        </button>
      </form>

      {error && <p className="error">{error}</p>}

      {loading ? (
        <p className="muted">Loading…</p>
      ) : items.length === 0 ? (
        <p className="muted">Nothing here yet. Add your first item above.</p>
      ) : (
        <ul className="list">
          {items.map((item) => (
            <li key={item.id}>
              <div>
                <span>{item.text}</span>
                <small>{new Date(item.createdAt).toLocaleString()}</small>
              </div>
              <button
                className="danger"
                disabled={busy}
                onClick={() => handleDelete(item.id)}
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
