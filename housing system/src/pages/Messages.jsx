import { useMemo, useState } from "react";
import Topbar from "../components/Topbar.jsx";
import { Modal, ConfirmDialog, EmptyState, SearchBar, initials } from "./_shared.jsx";
import { useStore } from "../context/StoreContext.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { Plus, Send, Paperclip, Smile, Search, Pencil, Trash2 } from "lucide-react";

function ComposeForm({ tenants, onSubmit, onCancel }) {
  // The select carries the tenant's id (so we can persist a real tenantId
  // on the message for tenant-portal filtering); the display name is
  // resolved from that id in startNew() below.
  const [form, setForm] = useState({ tenantId: "", subject: "", text: "" });
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(form); }} className="space-y-4">
      <div><label className="label">From</label>
        <select className="input" value={form.tenantId} onChange={set("tenantId")} required>
          <option value="">Choose tenant...</option>
          {tenants.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
      </div>
      <div><label className="label">Subject</label><input className="input" placeholder="What's this about?" value={form.subject} onChange={set("subject")} required /></div>
      <div><label className="label">Message</label><textarea className="input min-h-[110px]" placeholder="Write your message..." value={form.text} onChange={set("text")} required /></div>
      <div className="flex justify-end gap-2 pt-2"><button type="button" onClick={onCancel} className="btn-ghost">Cancel</button><button type="submit" className="btn-primary">Start conversation</button></div>
    </form>
  );
}

export default function Messages() {
  const { state, dispatch, nextId } = useStore();
  const { user } = useAuth();
  const [q, setQ] = useState("");
  const [activeId, setActiveId] = useState(state.messages[0]?.id || null);
  const [draft, setDraft] = useState("");
  const [open, setOpen] = useState(false);
  const [confirm, setConfirm] = useState(null);

  const list = useMemo(() => state.messages
    .filter(m => !q || m.from.toLowerCase().includes(q.toLowerCase()) || m.subject.toLowerCase().includes(q.toLowerCase()))
    .sort((a,b) => Number(b.unread) - Number(a.unread)),
  [state.messages, q]);

  const active = list.find(m => m.id === activeId);

  function openThread(id) {
    setActiveId(id);
    const m = state.messages.find(x => x.id === id);
    if (m && m.unread) dispatch({ type: "MARK_READ", payload: id });
  }

  function send() {
    if (!draft.trim() || !activeId) return;
    // Shaped to match the backend's thread item schema ({text, from, at})
    // so it renders correctly for both the admin and the tenant.
    dispatch({
      type: "SEND_REPLY",
      payload: {
        id: activeId,
        reply: { from: user?.name || user?.email || "Admin", role: "admin", text: draft, at: new Date().toISOString() }
      }
    });
    setDraft("");
  }

  function startNew(payload) {
    const tenant = state.tenants.find(t => t.id === payload.tenantId);
    const fromName = tenant?.name || "Unknown tenant";
    const id = nextId("MSG", state.messages);
    const msg = {
      id,
      from: fromName,
      tenantId: payload.tenantId,
      subject: payload.subject,
      preview: payload.text,
      time: new Date().toISOString(),
      unread: true,
      thread: [{ from: fromName, role: "admin", text: payload.text, at: new Date().toISOString() }]
    };
    dispatch({ type: "ADD_MESSAGE", payload: msg });
    setOpen(false); setActiveId(id);
  }

  return (
    <>
      <Topbar title="Messages" subtitle="Communicate directly with tenants and staff." action={<button className="btn-primary" onClick={() => setOpen(true)}><Plus size={16} /> Compose</button>} />
      <main className="p-4 md:p-6">
        {list.length === 0 ? (
          <EmptyState icon={Send} title="No conversations" hint="Start a message to begin chatting." action={<button className="btn-primary" onClick={() => setOpen(true)}><Plus size={16} /> Compose</button>} />
        ) : (
          <div className="card overflow-hidden grid grid-cols-1 md:grid-cols-3 h-[calc(100vh-9rem)] border-none shadow-xl">
            <div className="border-r border-stone-100 dark:border-stone-800 flex flex-col bg-stone-50/50 dark:bg-stone-900/30">
              <div className="p-4 border-b border-stone-100 dark:border-stone-800">
                <SearchBar value={q} onChange={setQ} placeholder="Search conversations..." />
              </div>
              <div className="flex-1 overflow-y-auto">
                {list.map(m => (
                  <button key={m.id} onClick={() => openThread(m.id)} className={`w-full text-left px-4 py-4 border-b border-stone-50 dark:border-stone-800 transition-all ${activeId === m.id ? "bg-white dark:bg-stone-800 shadow-sm" : "hover:bg-stone-100/50 dark:hover:bg-stone-800/50"}`}>
                    <div className="flex items-start gap-3">
                      <div className="h-10 w-10 rounded-full bg-stone-800 dark:bg-stone-700 grid place-items-center text-stone-100 text-sm font-bold shrink-0 border border-stone-700 dark:border-stone-600">{initials(m.from)}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <div className="font-bold text-stone-900 dark:text-stone-100 truncate">{m.from}</div>
                          <div className="text-[10px] text-stone-400 shrink-0 ml-2">{m.time}</div>
                        </div>
                        <div className="text-xs text-stone-500 truncate font-medium">{m.subject}</div>
                        <div className="text-sm text-stone-600 dark:text-stone-400 truncate mt-0.5 font-light">{m.preview}</div>
                      </div>
                      {m.unread && <span className="h-2 w-2 rounded-full bg-stone-800 dark:bg-stone-200 mt-2" />}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="md:col-span-2 flex flex-col">
              {active ? (
                <>
                  <div className="p-4 border-b border-stone-100 dark:border-stone-800 flex items-center justify-between bg-white dark:bg-stone-900">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-stone-100 dark:bg-stone-800 grid place-items-center text-stone-600 dark:text-stone-400 font-bold text-xs">{initials(active.from)}</div>
                      <div>
                        <div className="font-bold text-stone-900 dark:text-stone-100">{active.subject}</div>
                        <div className="text-xs text-stone-500">with {active.from}</div>
                      </div>
                    </div>
                    <button onClick={() => setConfirm(active)} className="btn-ghost text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors"><Trash2 size={14} /> Delete</button>
                  </div>
                  <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-stone-50/30 dark:bg-stone-950/40">
                    {active.thread.map((msg, i) => {
                      // "Mine" (the admin's) is decided by the sender's
                      // actual role when we have it (every message sent
                      // since this was fixed carries one) — display names
                      // alone aren't reliable, since the same person can
                      // be both an admin and a tenant. Older messages
                      // without a stored role fall back to the old
                      // name-comparison behavior.
                      const isMine = msg.role ? msg.role === "admin" : msg.from !== active.from;
                      return (
                        <div key={i} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                          <div className={`max-w-[75%] rounded-3xl px-4 py-3 text-sm shadow-sm ${isMine ? "bg-stone-800 text-white rounded-br-sm" : "bg-white dark:bg-stone-800 text-stone-800 dark:text-stone-100 rounded-bl-sm border border-stone-200 dark:border-stone-700"}`}>
                            {msg.text}
                            <div className={`text-[10px] mt-1 opacity-60 ${isMine ? "text-stone-200" : "text-stone-500"}`}>{msg.at || msg.time}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="p-4 border-t border-stone-100 dark:border-stone-800 bg-white dark:bg-stone-900">
                    <div className="flex items-center gap-2">
                      <button className="h-10 w-10 grid place-items-center rounded-xl hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-500 transition-colors"><Paperclip size={16} /></button>
                      <input className="input flex-1" placeholder="Type your reply..." value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send()} />
                      <button className="h-10 w-10 grid place-items-center rounded-xl hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-500 transition-colors"><Smile size={16} /></button>
                      <button onClick={send} className="btn-primary shadow-md"><Send size={14} /> Send</button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex-1 grid place-items-center text-sm text-stone-500 italic">Select a conversation to start chatting</div>
              )}
            </div>
          </div>
        )}
      </main>

      <Modal open={open} onClose={() => setOpen(false)} title="New conversation">
        <ComposeForm tenants={state.tenants} onSubmit={startNew} onCancel={() => setOpen(false)} />
      </Modal>

      <ConfirmDialog open={!!confirm} onCancel={() => setConfirm(null)} onConfirm={() => { dispatch({ type: "DELETE_MESSAGE", payload: confirm.id }); setConfirm(null); setActiveId(state.messages.filter(m => m.id !== confirm.id)[0]?.id || null); }} title="Delete conversation?" message={`Conversation with ${confirm?.from} will be removed.`} />
    </>
  );
}
