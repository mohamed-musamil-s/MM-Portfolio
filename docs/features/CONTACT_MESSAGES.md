# Feature: Contact messages

Visitors write in through the form in the home page's Contact section. Each message is stored as a conversation, which the studio's chat module will list and answer. The backend is done; the chat module UI is not built yet.

## Flow

1. The form is told as a chat (`src/components/home/ChatForm.tsx`). When it first comes into view, the host greets the visitor and asks the first question; each line arrives after a short "typing" beat. The lines come from `contact.form.prompts`, and `{name}` is filled in.
2. The visitor answers in the composer: name, email, then a topic (quick replies from `contact.form.topics`, skipped when there are none), then the message. Enter sends an answer; Shift+Enter makes a new line in the message.
3. Each answer is checked with the same zod schema the server uses (`src/lib/shared/contact/contact-schema.ts`). A wrong one gets a reply from `contact.form.errors`, and the question stays.
4. At the end the composer becomes the send button, which posts to `POST /api/contact`. The impact plays while it sends; on a 201 the check and the full-screen celebration play, then the thank-you arrives as a chat line. A failure gets `errors.failed` (or `errors.rate` on 429) as a reply, and the button stays for a retry.
5. "Start over" in the header clears the chat.

## API

| Route                            | Access               | What it does                                                                                    |
| -------------------------------- | -------------------- | ----------------------------------------------------------------------------------------------- |
| `POST /api/contact`              | public, same-origin  | `{ name, email, topic, message, website, elapsedMs }` → 201 `{ id }`; 400 with `details.fields` |
| `GET /api/studio/messages`       | session              | `{ conversations: ConversationSummary[], unread }`, newest first, up to 200                     |
| `GET /api/studio/messages/:id`   | session              | the full conversation (messages, page, referrer); 404 if unknown                                |
| `PATCH /api/studio/messages/:id` | session, same-origin | `{ unread?, status? }`: mark read or unread, open or archived                                   |

## Data: `contact_conversations`

```
{
  visitor: { name, email },          // email trimmed and lowercased
  topic,
  status: "open" | "archived",
  unread: boolean,                   // true until the studio opens it
  messages: [{ from: "visitor" | "owner", body, at }],
  createdAt, lastMessageAt,
  meta: { ipHash, userAgent, page, referrer }
}
```

- The `messages` array is ready for replies: the chat module will append `{ from: "owner" }` entries and bump `lastMessageAt`.
- Indexes (`db/indexes.ts`): `conversation_recent` on `lastMessageAt` (descending) and `conversation_by_client` on `meta.ipHash` + `createdAt`.

## Abuse limits

- **Honeypot:** a hidden `website` field. When it is filled, the server answers a fake 201 and stores nothing.
- **Too fast:** `elapsedMs` (time from the first focus to the send) under 2.5 s gets the same fake 201.
- **Rate:** 5 messages per client per hour and 120 overall per hour. Over the limit gets 429 with `Retry-After`.
- **Privacy:** the client IP is never stored. Only `ipHash`, a SHA-256 of the IP keyed with `SESSION_SECRET`, is kept, for counting.
- **Request size:** `withApi` limits requests to same-origin JSON of at most 256 KB.

## Send button and effects

- `src/components/home/SendButton.tsx` (the chat's last step) is a real `<button type="submit">` in the site's pill style. It takes `state`: `idle | sending | done | error`.
  - **Press:** it squashes while pressed.
  - **sending:** one flash of signal, a tilt and a spring back, plus the impact.
  - **done:** the disc turns to a check, plus the celebration.
  - **error:** it shakes.
- `src/lib/motion/impact-fx.ts` draws the effects on one fixed, click-through canvas.
  - **Impact:** a burst star behind the button, speed lines and chips.
  - **Celebration:** focus lines across the screen, two shockwaves, a large burst, a wide spray of chips and glints.
  - Colours come from `--signal`, `--text-primary` and `--bg-primary`.
  - Marks meant to sit behind the button leave a cut-out around it.
  - The loop runs only while marks are alive.
- The beats are modelled on an anime impact frame (reference: the Sakuga VFX gallery); the drawing and styling are our own.
- **Reduced motion:** with `prefers-reduced-motion` nothing is drawn and the button's springs are skipped. The states and the check still change.

## Next: the chat module

- A studio page lists the conversations (unread first, a badge from `unread`) and opens one as a thread.
- Opening a conversation PATCHes `unread: false`.
- Replying needs an outbound email provider (not chosen yet) and a `POST /api/studio/messages/:id/replies` that appends an `owner` message.
