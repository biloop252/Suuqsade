# Support API Documentation

This document describes the Support Ticket API endpoints and how to use them from the customer interface.

## API Endpoints

### 1. Get Support Categories
**Endpoint:** `GET /api/customers/support/categories`

**Description:** Retrieves all available support ticket categories.

**Authentication:** Not required (public endpoint)

**Response:**
```json
{
  "items": [
    {
      "id": "uuid",
      "name": "General Inquiry",
      "slug": "general_inquiry",
      "description": "General questions and inquiries"
    },
    // ... more categories
  ]
}
```

---

### 2. Get Support Tickets
**Endpoint:** `GET /api/customers/support/tickets`

**Description:** Retrieves all support tickets for the authenticated user.

**Authentication:** Required (user must be logged in)

**Query Parameters:**
- `status` (optional): Filter by status (`open`, `in_progress`, `waiting_customer`, `waiting_staff`, `resolved`, `closed`)
- `limit` (optional): Number of tickets to return (default: 50, max: 100)

**Example:** `GET /api/customers/support/tickets?status=open&limit=20`

**Response:**
```json
{
  "items": [
    {
      "id": "uuid",
      "ticket_number": "SUP-1234567890-ABC123",
      "user_id": "uuid",
      "category_id": "uuid",
      "subject": "Order Issue",
      "description": "My order hasn't arrived",
      "status": "open",
      "priority": "medium",
      "order_id": "uuid",
      "product_id": null,
      "is_urgent": false,
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-01-01T00:00:00Z",
      "category": {
        "id": "uuid",
        "name": "Order Issues",
        "slug": "order_issue"
      }
    }
  ]
}
```

---

### 3. Create Support Ticket
**Endpoint:** `POST /api/customers/support/tickets`

**Description:** Creates a new support ticket.

**Authentication:** Required (user must be logged in)

**Request Body:**
```json
{
  "subject": "Order Issue",              // Required: string
  "description": "My order hasn't arrived", // Required: string
  "category_id": "uuid",                  // Optional: UUID of support category
  "priority": "medium",                   // Optional: "low" | "medium" | "high" | "urgent" (default: "medium")
  "order_id": "uuid",                     // Optional: UUID of related order
  "product_id": "uuid",                   // Optional: UUID of related product
  "is_urgent": false                      // Optional: boolean (default: false)
}
```

**Response (201 Created):**
```json
{
  "ticket": {
    "id": "uuid",
    "ticket_number": "SUP-1234567890-ABC123",
    "user_id": "uuid",
    "category_id": "uuid",
    "subject": "Order Issue",
    "description": "My order hasn't arrived",
    "status": "open",
    "priority": "medium",
    "order_id": "uuid",
    "product_id": null,
    "is_urgent": false,
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-01T00:00:00Z",
    "category": {
      "id": "uuid",
      "name": "Order Issues",
      "slug": "order_issue"
    }
  }
}
```

**Error Responses:**
- `400 Bad Request`: Missing required fields (`subject` or `description`)
- `401 Unauthorized`: User not authenticated
- `500 Internal Server Error`: Server error

---

### 4. Get Ticket Messages
**Endpoint:** `GET /api/customers/support/tickets/[id]/messages`

**Description:** Retrieves all messages for a specific support ticket.

**Authentication:** Required (user must own the ticket)

**Response:**
```json
{
  "items": [
    {
      "id": "uuid",
      "ticket_id": "uuid",
      "user_id": "uuid",
      "message": "Hello, I need help with my order",
      "attachments": [],
      "created_at": "2024-01-01T00:00:00Z"
    }
  ]
}
```

**Error Responses:**
- `401 Unauthorized`: User not authenticated
- `403 Forbidden`: User doesn't own the ticket
- `404 Not Found`: Ticket not found

---

### 5. Send Message to Ticket
**Endpoint:** `POST /api/customers/support/tickets/[id]/messages`

**Description:** Adds a new message to an existing support ticket.

**Authentication:** Required (user must own the ticket)

**Request Body:**
```json
{
  "message": "Thank you for your help!",  // Required: string
  "attachments": []                        // Optional: array of attachment URLs
}
```

**Response (201 Created):**
```json
{
  "message": {
    "id": "uuid",
    "ticket_id": "uuid",
    "user_id": "uuid",
    "message": "Thank you for your help!",
    "attachments": [],
    "created_at": "2024-01-01T00:00:00Z"
  }
}
```

**Error Responses:**
- `400 Bad Request`: Missing `message` field
- `401 Unauthorized`: User not authenticated
- `403 Forbidden`: User doesn't own the ticket
- `404 Not Found`: Ticket not found

---

## Customer Interface Implementation

### Example: Creating a Support Ticket

```typescript
'use client';

import { useState } from 'react';

interface SupportTicketForm {
  subject: string;
  description: string;
  category_id?: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  order_id?: string;
  product_id?: string;
  is_urgent?: boolean;
}

export default function CreateSupportTicket() {
  const [form, setForm] = useState<SupportTicketForm>({
    subject: '',
    description: '',
    priority: 'medium',
    is_urgent: false
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/customers/support/tickets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subject: form.subject,
          description: form.description,
          category_id: form.category_id || null,
          priority: form.priority || 'medium',
          order_id: form.order_id || null,
          product_id: form.product_id || null,
          is_urgent: form.is_urgent || false,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create ticket');
      }

      const data = await response.json();
      console.log('Ticket created:', data.ticket);
      
      // Reset form
      setForm({
        subject: '',
        description: '',
        priority: 'medium',
        is_urgent: false
      });

      // Show success message or redirect
      alert('Support ticket created successfully!');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label htmlFor="subject">Subject *</label>
        <input
          id="subject"
          type="text"
          value={form.subject}
          onChange={(e) => setForm({ ...form, subject: e.target.value })}
          required
        />
      </div>

      <div>
        <label htmlFor="description">Description *</label>
        <textarea
          id="description"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          required
          rows={5}
        />
      </div>

      <div>
        <label htmlFor="priority">Priority</label>
        <select
          id="priority"
          value={form.priority}
          onChange={(e) => setForm({ ...form, priority: e.target.value as any })}
        >
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
          <option value="urgent">Urgent</option>
        </select>
      </div>

      {error && <div style={{ color: 'red' }}>{error}</div>}

      <button type="submit" disabled={loading}>
        {loading ? 'Creating...' : 'Create Ticket'}
      </button>
    </form>
  );
}
```

### Example: Fetching Support Tickets

```typescript
'use client';

import { useState, useEffect } from 'react';

interface SupportTicket {
  id: string;
  ticket_number: string;
  subject: string;
  description: string;
  status: string;
  priority: string;
  created_at: string;
  category?: {
    id: string;
    name: string;
    slug: string;
  };
}

export default function SupportTicketsList() {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('');

  useEffect(() => {
    fetchTickets();
  }, [statusFilter]);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const url = statusFilter
        ? `/api/customers/support/tickets?status=${statusFilter}`
        : '/api/customers/support/tickets';
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error('Failed to fetch tickets');
      }

      const data = await response.json();
      setTickets(data.items || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading tickets...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <select
        value={statusFilter}
        onChange={(e) => setStatusFilter(e.target.value)}
      >
        <option value="">All Statuses</option>
        <option value="open">Open</option>
        <option value="in_progress">In Progress</option>
        <option value="waiting_customer">Waiting for Customer</option>
        <option value="resolved">Resolved</option>
        <option value="closed">Closed</option>
      </select>

      <div>
        {tickets.map((ticket) => (
          <div key={ticket.id}>
            <h3>{ticket.subject}</h3>
            <p>Ticket #: {ticket.ticket_number}</p>
            <p>Status: {ticket.status}</p>
            <p>Priority: {ticket.priority}</p>
            <p>Category: {ticket.category?.name || 'N/A'}</p>
            <p>Created: {new Date(ticket.created_at).toLocaleString()}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
```

### Example: Sending a Message to a Ticket

```typescript
'use client';

import { useState } from 'react';

interface SendMessageProps {
  ticketId: string;
  onMessageSent?: () => void;
}

export default function SendMessage({ ticketId, onMessageSent }: SendMessageProps) {
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!message.trim()) {
      setError('Message cannot be empty');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/customers/support/tickets/${ticketId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: message.trim(),
          attachments: [], // Add attachment URLs if needed
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to send message');
      }

      const data = await response.json();
      console.log('Message sent:', data.message);
      
      setMessage('');
      onMessageSent?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Type your message..."
        rows={4}
        required
      />
      
      {error && <div style={{ color: 'red' }}>{error}</div>}
      
      <button type="submit" disabled={loading || !message.trim()}>
        {loading ? 'Sending...' : 'Send Message'}
      </button>
    </form>
  );
}
```

### Example: Fetching Ticket Messages

```typescript
'use client';

import { useState, useEffect } from 'react';

interface SupportMessage {
  id: string;
  ticket_id: string;
  user_id: string;
  message: string;
  attachments: string[];
  created_at: string;
}

interface TicketMessagesProps {
  ticketId: string;
}

export default function TicketMessages({ ticketId }: TicketMessagesProps) {
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchMessages();
  }, [ticketId]);

  const fetchMessages = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/customers/support/tickets/${ticketId}/messages`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch messages');
      }

      const data = await response.json();
      setMessages(data.items || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading messages...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      {messages.map((msg) => (
        <div key={msg.id}>
          <p>{msg.message}</p>
          <small>{new Date(msg.created_at).toLocaleString()}</small>
          {msg.attachments && msg.attachments.length > 0 && (
            <div>
              Attachments:
              {msg.attachments.map((url, idx) => (
                <a key={idx} href={url} target="_blank" rel="noopener noreferrer">
                  Attachment {idx + 1}
                </a>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
```

---

## Support Ticket Status Values

- `open`: Ticket is newly created and waiting for staff response
- `in_progress`: Staff is actively working on the ticket
- `waiting_customer`: Waiting for customer response
- `waiting_staff`: Waiting for staff response
- `resolved`: Issue has been resolved
- `closed`: Ticket is closed

## Support Ticket Priority Values

- `low`: Low priority issue
- `medium`: Medium priority (default)
- `high`: High priority issue
- `urgent`: Urgent issue requiring immediate attention

---

## Notes

1. **Authentication**: All ticket-related endpoints require the user to be authenticated. The API automatically extracts the user ID from the session.

2. **Ticket Ownership**: Users can only access their own tickets. Attempting to access another user's ticket will return a 403 Forbidden error.

3. **Ticket Number**: The ticket number is automatically generated in the format: `SUP-{timestamp}-{random}`

4. **Categories**: Categories are optional but recommended for better ticket organization.

5. **Attachments**: Currently, attachments are stored as an array of URLs. You'll need to handle file upload separately and pass the URLs in the attachments array.

