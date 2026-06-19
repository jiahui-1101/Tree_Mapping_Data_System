import { useMemo, useState } from "react";
import Card from "../../components/common/Card.jsx";
import StatusPill from "../../components/common/StatusPill.jsx";
import { SUPPORT_TICKETS } from "../../data/itSupport.js";
import TicketFilters from "./TicketFilters.jsx";

export default function IncidentTicketsPage({ showToast }) {
  const [tickets, setTickets] = useState(SUPPORT_TICKETS);
  const [status, setStatus] = useState("all");
  const [priority, setPriority] = useState("all");
  const [category, setCategory] = useState("all");

  const filtered = useMemo(() => tickets.filter((ticket) => {
    if (status !== "all" && ticket.status !== status) return false;
    if (priority !== "all" && ticket.priority !== priority) return false;
    return category === "all" || ticket.category === category;
  }), [category, priority, status, tickets]);

  const updateTicket = (id, patch, message) => {
    setTickets((current) => current.map((ticket) => ticket.id === id ? { ...ticket, ...patch } : ticket));
    showToast(message);
  };

  return (
    <Card title="Incident Tickets" subtitle="Mock support queue for IT Support follow-up">
      <TicketFilters
        status={status}
        priority={priority}
        category={category}
        onStatusChange={setStatus}
        onPriorityChange={setPriority}
        onCategoryChange={setCategory}
      />
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
