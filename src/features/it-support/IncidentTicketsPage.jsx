import { useEffect, useMemo, useState } from "react";
import Card from "../../components/common/Card.jsx";
import StatusPill from "../../components/common/StatusPill.jsx";
import { SUPPORT_TICKETS } from "../../data/itSupport.js";
import { fetchItTicketsBackend, updateItTicketBackend } from "../../services/itSupportApiService.js";

export default function IncidentTicketsPage({ showToast }) {
  const [tickets, setTickets] = useState(SUPPORT_TICKETS);
  const [status, setStatus] = useState("all");
  const [priority, setPriority] = useState("all");
  const [category, setCategory] = useState("all");
  const [source, setSource] = useState("local fallback");

  useEffect(() => {
    let mounted = true;
    fetchItTicketsBackend().then((payload) => {
      if (mounted && payload?.ok) {
        setTickets(payload.data || []);
        setSource("backend API");
      }
    });
    return () => { mounted = false; };
  }, []);

  const filtered = useMemo(() => tickets.filter((ticket) => {
    if (status !== "all" && ticket.status !== status) return false;
    if (priority !== "all" && ticket.priority !== priority) return false;
    return category === "all" || ticket.category === category;
  }), [category, priority, status, tickets]);

  const updateTicket = async (id, patch, message) => {
    const backendResult = await updateItTicketBackend({ ticketId: id, patch });
    if (backendResult?.ticket) {
      setTickets((current) => current.map((ticket) => ticket.id === id ? backendResult.ticket : ticket));
      setSource("backend API");
      showToast(message.replace("demo", "backend"));
      return;
    }
    setTickets((current) => current.map((ticket) => ticket.id === id ? { ...ticket, ...patch } : ticket));
    showToast(`${message} Local fallback used.`);
  };

  return (
    <Card title="Incident Tickets" subtitle={`Support queue for IT Support follow-up · ${source}`}>
      <div className="page-toolbar">
        <div className="toolbar-actions">
          <select value={status} onChange={(event) => setStatus(event.target.value)}>
            <option value="all">All status</option><option value="open">Open</option><option value="investigating">Investigating</option><option value="resolved">Resolved</option>
          </select>
          <select value={priority} onChange={(event) => setPriority(event.target.value)}>
            <option value="all">All priority</option><option value="urgent">Urgent</option><option value="high">High</option><option value="normal">Normal</option>
          </select>
          <select value={category} onChange={(event) => setCategory(event.target.value)}>
            <option value="all">All category</option><option value="QR">QR</option><option value="Security">Security</option><option value="Map">Map</option><option value="AI">AI</option>
          </select>
        </div>
      </div>
      <div className="it-ticket-board">
        {filtered.map((ticket) => (
          <article className={`task-card priority-${ticket.priority}`} key={ticket.id}>
            <span><b>{ticket.id}</b><StatusPill status={ticket.status} /></span>
            <h3>{ticket.title}</h3>
            <p>{ticket.category} · {ticket.source}</p>
            <small>{ticket.detail}</small>
            <em>Owner: {ticket.owner}</em>
            <div className="button-row">
              <button className="button button-small" onClick={() => updateTicket(ticket.id, { owner: "Nur Izzati" }, `${ticket.id} assigned to IT Support.`)}>Assign to me</button>
              <button className="button button-small button-outline" onClick={() => updateTicket(ticket.id, { status: "investigating", owner: "Nur Izzati" }, `${ticket.id} marked investigating.`)}>Mark investigating</button>
              <button className="button button-small button-outline" onClick={() => updateTicket(ticket.id, { status: "resolved", owner: "Nur Izzati" }, `${ticket.id} resolved in demo queue.`)}>Resolve</button>
            </div>
          </article>
        ))}
      </div>
    </Card>
  );
}

