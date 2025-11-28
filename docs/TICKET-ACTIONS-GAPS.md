## Ticket page automation gaps

This file tracks **actions available to an agent on the Kayako ticket page that are _not yet automated_** by the current Kayako Autotester stack (selectors + primitives + flows + tests).

- **Scope**: based on the 51‑item capability list you provided for the conversation/ticket page.
- **Definition of “not yet automated”**:
  - No selector and/or no dedicated primitive, or
  - Selector exists but there is **no flow/test** exercising it in a stable way.
- This is intentionally conservative: if something is only theoretically possible via a raw `click` but we don’t have a named step + test for it, it is listed here as a gap.

Roughly speaking, we currently automate **about 60%** of day‑to‑day ticket actions (reply/note, tags, status, assignee, brand, macros, custom fields, internal notes, quick assign, some navigation). The remaining ~40% are the features below.

---

### 1. Header / top toolbar gaps

- **Open customer journey from header**
  - Click customer name in the header to open the full journey view.
  - No dedicated selector/primitive/flow; only generic clicking is possible.

- **Open organization journey from header**
  - Click organization name in the header to open org timeline.
  - Not covered by any flow or assertion.

- **Set / change requester’s organization from the header**
  - “Set organization” control in the header.
  - No selectors or primitives; not exercisable via flows today.

- **Mark conversation as Complete via header checkmark**
  - `conversation.completeCaseButton` selectors exist but:
    - No primitive like `completeConversation()`.
    - No flow or test that clicks this and asserts status = Completed.

- **Trash conversation via header trash icon**
  - `conversation.trashCaseButton` selectors exist but:
    - No primitive or flow to move a ticket to Trash and verify it.

- **Open action menu (… menu) and run advanced actions**
  - **Merge conversations** (open merge dialog, search/select target, confirm merge).
  - **Hide/Show activities** toggle.
  - None of these are automated; we lack selectors, primitives, flows, and tests.

- **Change requester from header**
  - UI supports “Change requester” on the header.
  - No selectors or flows to drive this yet.

- **Time tracking widget (if enabled)**
  - Open time tracking popup, start/pause timer, manual time entry, mark as billable, save/view entries.
  - Not automated: no selectors, primitives, or flows.

---

### 2. Right‑side properties panel gaps

These are the Assignee / Status / Type / Priority / Tags / Form / custom fields area.

- **Change Type**
  - We don’t have selectors/primitives for the conversation Type field.
  - No flow or test that changes and asserts the Type value.

- **Change Priority**
  - Same as Type: no dedicated automation around the Priority field.

- **Remove tags explicitly**
  - `add-tags` sets tags and we assert presence, but:
    - There is no primitive or flow to **remove** a tag (via the “x” pill) and assert it is gone.

- **Change Form**
  - Form switcher in the properties panel (controlling which custom fields appear).
  - No selector or flow to:
    - Change form.
    - Assert which fields appear/disappear.

- **SLA timers and policy inspection**
  - SLA contract name + reply/resolution countdowns are read‑only UI.
  - We have no selectors/primitives/tests that read or assert SLA state.

---

### 3. Timeline / message‑level gaps

This is the middle column: messages, notes, activities, and per‑message actions.

- **Open attachments from a message**
  - No selectors or tests that click attachments and verify open/download behaviour.

- **Assert per‑message delivery status icons**
  - Icons like “sent / delivered / seen / bounced / failed / sending”.
  - No selectors or assertions around these icons or their hover tooltips.

- **Per‑message email menu**
  - “Show original email” vs “Show processed email”.
  - “View email headers” popup.
  - Not automated: no flows that open the message menu or assert these views.

- **Quote a message into the reply**
  - We _do_ have selectors for:
    - `timelineExtra.postMenu`
    - `timelineExtra.menuQuoteButton`
  - But there is **no primitive or flow** that:
    - Opens the per‑post menu, clicks Quote, and asserts that quoted text appears in the composer.

- **Copy/share direct link to a specific message**
  - `timelineExtra.menuShareLink` selectors exist.
  - No primitive or assertion that:
    - Activates “Share a link”.
    - Verifies that a permalink is generated/copied.

- **Pin/unpin a note**
  - UI pin icon is not wired into selectors or flows.
  - No ability to pin a note or assert its pinned state.

---

### 4. Composer / reply & note gaps

We already support:

- Switching between **Reply** and **Internal note**.
- Inserting text, clicking **Send**, and asserting timeline contents.
- Setting **status**, **tags**, **assignee**, and **custom fields** alongside a send.
- Applying one specific macro (“Send to Customer”).
- Basic formatting via bold/italic/bulleted/numbered lists.

Remaining gaps:

- **Choose reply channel / sending address**
  - Channel dropdown (e.g., which email address or social channel is used to send).
  - We do not yet:
    - Select specific channels.
    - Assert which “from” address is active.

- **Note context (Conversation / User / Organization)**
  - In Note mode, choosing whether a note applies to:
    - Only this conversation.
    - The user’s journey (all active conversations).
    - The organization journey (all active conversations).
  - No selectors or flows for this context switch.

- **CC recipients (header or bottom CC line)**
  - UI supports adding/removing CC recipients.
  - We have no primitives or tests that:
    - Populate CC.
    - Assert CC contents.

- **Rich‑text formatting coverage**
  - Current automation:
    - Uses toolbar buttons for **bold**, **italic**, **bulleted list**, and **numbered list**.
    - Confirms that the **plain text content** appears in the timeline.
  - Missing:
    - Assertions on the **actual HTML markup** (e.g., `<strong>`, `<em>`, `<ul>`, `<ol>`) to prove formatting is structurally correct.
    - Coverage for other toolbar options (headings, alignment, etc.) if available.

- **Emoji insertion**
  - We can type arbitrary Unicode (including emoji) as plain text, but:
    - There is no explicit primitive/flow/test that:
      - Opens an emoji picker (if any).
      - Asserts emoji rendering.

- **File attachments from the composer**
  - `composer.inlineAttachmentInput` selectors exist, but:
    - There is no primitive that calls `setInputFiles`.
    - No flows/tests that attach a file and verify it appears in the timeline.

- **Macros beyond “Send to Customer”**
  - We support a single macro flow (`apply-macro-send-to-customer`).
  - Missing pieces:
    - Generic “select macro by name and apply” primitive.
    - Tests that cover multiple macros and their side effects.

- **@mentions in notes**
  - UI supports `@` mentions for agents/collaborators in notes.
  - No selectors or flows that:
    - Type `@name`, select a suggestion, and assert that a mention appears in the note and/or triggers notifications.

---

### 5. Misc / global navigation gaps (from the ticket page)

- **Open customer journey from the right‑hand customer pane**
  - Same functional goal as header click, but initiated from the sidebar.
  - Not automated separately.

- **Open organization journey from the right‑hand pane**
  - Also not exercised by any flow.

- **Use the global “New” button to start a new conversation**
  - `shell.newButton` selectors exist, but:
    - No primitive or flow currently uses it.
    - No test that starts a brand‑new conversation and validates it.

- **Navigate to non‑core sections from the ticket page**
  - We have navigation flows/selectors for:
    - Inbox/Conversations.
    - Users.
    - Settings/Administration.
  - Not yet automated:
    - Insights, Knowledge Base Manager, Help Center, and any other app‑level modules accessible from the ticket page header.

---

### 6. Summary & next steps

- **Estimated coverage**:
  - **~60%** of the agent actions in the ticket page capability list are already automated:
    - All core reply/note flows.
    - Status/tags/assignee/custom fields changes.
    - Brand changes.
    - Quick assign, internal notes, key macros.
  - The remaining **~40%** are tracked above and cluster around:
    - **Advanced header tools** (merge, hide activities, requester/org changes, time tracking).
    - **Per‑message tools** (quote, share link, original/processed email, headers, pinning).
    - **Composer extras** (channels, CC, attachments, @mentions, generic macros, rich‑text assertions).
    - **Navigation to journeys and non‑core modules**, and **new conversation** creation.

As we add primitives/flows/tests for each gap, we should:

- Update this file to move items from “gap” status into the main capabilities docs.
- Add matching entries in `docs/SELECTORS.md` and `docs/CAPABILITIES.md`.
- Ensure each new capability has:
  - A **selector (or small selector group)**.
  - A **named primitive** in `selectors/index.ts`.
  - At least one **flow + generated spec** that uses it with assertions.


