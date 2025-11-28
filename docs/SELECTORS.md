Selectors catalog (initial)

This document tracks the selector groups and keys defined in selectors/selectors.jsonc. Prefer the first candidates in each list; they are the most resilient. Update this file when adding new selectors.

- login
  - emailInput
  - passwordInput
  - submitButton
  - rememberMeCheckbox
  - forgotPasswordLink
  - errorInvalidCombo
- nav
  - conversationsLink
- conversations
  - heading
  - container
- inbox
  - sidebar
  - sidebarItem
  - sidebarActiveItem
  - sidebarSuspendedLink
  - sidebarCounter
  - firstItem
  - conversationSubject
  - mergeAction
  - rowStatus
  - rowRequester
  - rowAgo
  - rowPreview
  - filterAll
  - table
  - tableHeaderRow
  - bulkSelectCheckbox
  - rowContainer
  - rowCheckbox
  - firstTicketRow
  - pagination
  - paginationItem
  - paginationActiveItem
- conversation
  - subjectHeading
  - sideConversationsToggle
  - completeCaseButton
  - trashCaseButton
  - requester
  - statusPill
  - timelineEntry
  - timelineJumpBar
  - timelineLoadMore
  - updatePropertiesCancel
  - noteText
- composer
  - editor
  - sendAndSetTrigger
  - ccTrigger
  - ccContainer
  - ccSearchInput
  - ccSelectedPill
  - ccRemovePill
  - replyToggle
  - internalNoteToggle
  - sendButton
  - notePlaceholder
  - addNoteButton
- assign
  - openAssigneeMenu
  - assignToMeTrigger
  - assignToMeOptions
  - teamGeneral
  - teamVip
  - assigneeFieldTrigger
  - selfOption
  - confirmation
  - assigneeValueContainer
  - assigneeTeamValue
  - assigneeAgentValue
  - assigneeUnassigned
  - updatePropertiesButton
  - updatePropertiesSpan
  - updatePropertiesContainer
- search
  - input
  - resultItem
- users (user directory)
  - container
  - sidebar
  - sidebarHeading
  - logicOperatorTrigger
  - definitionList
  - definitionItem
  - definitionCheckboxWrap
  - definitionCheckbox
  - definitionLabelText
  - sidebarDetail
  - definitionTextInput
  - results
  - resultsHeading
  - firstRow
- macro
  - macroSelectorTrigger
  - macroOptionSendToCustomer
  - macroDropdownContainer
- status
  - statusFieldTrigger
  - statusOptionPending
- tags
  - tagsFieldTrigger
  - tagsInput
  - tagsOption
  - tagPill
- info (right-side properties)
  - panel
  - fieldContainer
  - fieldHeader
  - selectTrigger
  - dateFocus
  - dateDropdown
  - dateContainer
  - dateIcon
  - dateHeader
  - datePrev
  - dateNext
  - dateMonth
  - dateYear
  - dateDayCurrentMonth
  - dateDayAny
  - dateDayToday
  - dateActionsContainer
  - dateAction
  - dateContainerActive
  - dropdownOption
  - checkbox
  - checkboxGroup
  - checkboxLabel
  - checkboxHeader
  - textInput
  - textarea
  - dateInput
  - radio
- shell
  - newButton
  - trialBanner
  - notificationBell
  - profileMenuTrigger
  - headerSearch
- settings
  - triggersLink
  - newTriggerLink
  - triggerTitleInput
  - conditionFieldButton
  - operatorButton
  - conditionStatusValueButton
  - statusValueButton
  - actionFieldButton
  - saveTriggerButton

Notes
- Always add new selectors to selectors/selectors.jsonc using stable class-prefixes (e.g., [class*=ko-...]).
- Avoid duplicate candidates; place the most robust CSS first, then role=, then text= fallbacks.
## Selector Triage Workflow

1. Run `npm run capture:pipeline` to refresh sanitized HTML + hashes (stored under `artifacts/structure/<captureId>`).
2. Generate proposals with `npm run selectors:suggest [--crawl-id=<captureDir>]`. This populates `selectors/extracted/pending.json` with metadata (capture/crawl IDs, hashes, source files).
3. Review via `npm run selectors:triage`, choosing approve/reject/snooze. Decisions are logged in `selectors/extracted/history.json`; approved entries record the intended selector group/key for later promotion.
4. Promote approved selectors into `selectors/selectors.jsonc`, update this document, then run `npm run validate:selectors`.

Keep the pending queue near zero—CI should flag long-lived backlogs.
## Selectors Governance

- Single source of truth: `selectors/selectors.jsonc`.
- Use resilient selectors, preferring `[class*=` matches or stable attributes (e.g., `data-`, `role`, `aria-`).
- Every key must have a concise comment describing purpose.
- Provide fallback chains (array) ordered from most to least preferred.
- Run `npm run validate:selectors` to enforce schema, duplicates, and comment presence.






