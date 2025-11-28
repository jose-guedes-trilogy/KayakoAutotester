# Background Processes

## Synopsis

A `Process` is a long lived object that is generally associated with a tab within the agent area (although doesn't need to be) and that is responsible for
maintaining state, running async tasks and being able to be stashed in local storage and then restored. 

## Motivation

While the current implementation of the agent area looks like it supports tabs, it's really a very simplistic implementation. For instance, when you `cmd +
click` a conversation from the conversation view, a new non-active tab appears however, nothing more happens - the conversation is not loaded and no KRE
channels are subscribed to. It is not until the user transitions to the actual conversation screen that all these things start to happen. Combine that with the
fact that when the user moves away from that particular conversation, all those things are lost.

With this in mind, we want to be able to provide a better experience, something akin to Chrome browser tabs, where each conversation (and anything really, such
as a user, advanced search etc) is backed by a long lived process that is created at the moment the conversation is opened, and destroyed the moment it's
closed. This process should be able to run async tasks in the background no matter if it is associated with the conversation currently being view or not.
Likewise, if a user refreshes the browser, the processes should be able to be restored and re-subscribe themselves to realtime tasks and request any data that
they require. And finally, when a conversation is opened in the background from the conversation list, it should start requesting the data needed in the
background so that it's available when the user decides to view the tab. 

## Implementation Details

Currently, this is implemented with two new objects - `Process` and `ProcessManager`.

The `Process` class is used to create instances of the background processes, while the `ProcessManager` is used to store the current collection of `Process`
instances, stash and restore them from session storage and perform operations on them.

Currently, there are only two places where a process will be created - when a user selects a conversation from the conversation list and in the conversation
route when a user navigates directly to the conversation. 

## Restoring processes

Certain details of a `Process` are stashed in session storage by the `ProcessManager` which means that they can be restored in the future. This
restoration will happen on the `SessionRoute` which means as soon as a user navigates to a page on our app, the `Process` objects will be restored and their
respective `restore` tasks will be run. This means that by the time the user gets to the following use cases, the `ProcessManager` should have running
`Process` instances for any conversations that the user had opened previously.

## Use Case Scenarios

The following are the scenarios when processes should be created and how and when they are created.

> I am on the conversation list and I click on a conversation opening it up in the foreground (conversation is not already open)

- Conversation list click handler requests `ProcessManager` to create a new process
- `ProcessManager` checks to see if a process exists for the conversation - it does not
- `ProcessManager` creates process, saves process metadata to local storage, run's process `initialization` tasks
- Conversation list click handler transitions to conversation

> I am on conversation list and I click on a conversation opening it up in the foreground (conversation is already open)

- Conversation list click handler requests `ProcessManager` to create a new process
- `ProcessManager` checks to see if a process exists for the conversation - it does and does nothing more
- Conversation list click handler transitions to conversation

> I am on the conversation list and I cmd + click on a conversation, opening it up in the background (conversation is not already open)

- Conversation list click handler requests `ProcessManager` to create a new process
- `ProcessManager` checks to see if a process exists for the conversation - it does not
- `ProcessManager` creates process, saves process metadata to local storage, run's process `initialization` tasks

> I am on the conversation list and I cmd + click on a conversation, opening it up in the background (conversation is already open)

- Conversation list click handler requests `ProcessManager` to create a new process
- `ProcessManager` checks to see if a process exists for the conversation - it does and does nothing more

> I have no tabs open and I navigate to a conversation url

- `ConversationRoute` requests `ProcessManager` create a new process
- `ProcessManager` checks to see if a process exists for the conversation - it does not
- `ProcessManager` creates process, saves process metadata to local storage, run's process `initialization` tasks

> I have tabs open and I navigate to a conversation url for which I do not already have a tab

- `ConversationRoute` requests `ProcessManager` create a new process
- `ProcessManager` checks to see if a process exists for the conversation - it does not
- `ProcessManager` creates process, saves process metadata to local storage, run's process `initialization` tasks

> I have tabs open and I navigate to a conversation url for which I do already have a tab

- `ConversartionRoute` requests `ProcessManager` create a new process
- `ProcessManager` checks to see if a process exists for the conversation - it does and does nothing more

> I switch from one conversation to another (which has previously been opened this session) via the conversation tabs

- Click on tab transitions to conversation route
- `ConversationRoute` requests `ProcessManager` create a new process
- `ProcessManager` checks to see if a process exists for the conversation - it does and does nothing more

> I switch from one conversation to another (which has not been opened this session) via the conversation tabs

- Click on tab transitions to case route
- `ConversationRoute` requests `ProcessManager` create a new process
- `ProcessManager` checks to see if a process exists for the conversation - it does and does nothing more
