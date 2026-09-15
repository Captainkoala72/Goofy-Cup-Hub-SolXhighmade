"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import {
  Bot,
  BrainCircuit,
  Check,
  Copy,
  Globe2,
  MessageSquare,
  Plus,
  RotateCcw,
  Send,
  Sparkles,
  Trash2,
  UserRound,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ChatMarkdown } from "@/components/chat-markdown";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import type {
  ChatMessage,
  ChatSource,
  LeagueSnapshot,
} from "@/lib/types";

type DisplayMessage = ChatMessage & {
  id: string;
  sources?: ChatSource[];
};

type StoredChat = {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  messages: DisplayMessage[];
};

const CHATS_STORAGE_KEY = "goofy-cup:assistant-chats:v1";
const MAX_STORED_CHATS = 50;
const MAX_STORED_MESSAGES = 200;
const COPY_FEEDBACK_MS = 2000;

const suggestions = [
  "Who has the strongest roster right now?",
  "Give me three waiver priorities for this week.",
  "Preview this week's closest matchup.",
  "Rank every team for the rest of the season.",
  "Set the best starting lineup for each team this week.",
  "Which bench players deserve a starting spot this week?",
  "Find three fair trades that would help both teams.",
  "Who are the best buy-low and sell-high players in our league?",
  "Flag every starter with an injury or role concern.",
  "Project this week's highest-scoring team.",
  "Which team has the clearest path to the championship?",
  "Give every manager one move to improve their roster.",
];

function starterMessage(isDemo: boolean): DisplayMessage {
  return {
    id: "welcome",
    role: "assistant",
    content: isDemo
      ? "I’m ready for Goofy Cup questions. This preview is using sample teams until the private ESPN credentials are added."
      : "I’m synced with the Goofy Cup. Ask me about a matchup, roster, trade, waiver target, or the latest NFL news.",
  };
}

function chatTitleFrom(text: string): string {
  const clean = text.replace(/\s+/g, " ").trim();
  if (!clean) return "New chat";
  return clean.length > 44 ? `${clean.slice(0, 44)}…` : clean;
}

function formatRelativeTime(timestamp: number): string {
  const minutes = Math.round((Date.now() - timestamp) / 60_000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(timestamp).toLocaleDateString();
}

function isDisplayMessage(value: unknown): value is DisplayMessage {
  if (typeof value !== "object" || value === null) return false;
  const message = value as Record<string, unknown>;
  return (
    (message.role === "user" || message.role === "assistant") &&
    typeof message.content === "string" &&
    typeof message.id === "string"
  );
}

function loadStoredChats(): StoredChat[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(CHATS_STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((entry): entry is StoredChat => {
        if (typeof entry !== "object" || entry === null) return false;
        const chat = entry as Record<string, unknown>;
        return (
          typeof chat.id === "string" &&
          typeof chat.title === "string" &&
          typeof chat.createdAt === "number" &&
          typeof chat.updatedAt === "number" &&
          Array.isArray(chat.messages) &&
          chat.messages.every(isDisplayMessage)
        );
      })
      .sort((a, b) => b.updatedAt - a.updatedAt)
      .slice(0, MAX_STORED_CHATS);
  } catch {
    return [];
  }
}

export function AssistantClient({ league }: { league: LeagueSnapshot }) {
  return (
    <SidebarProvider
      className="min-h-[calc(100svh-4rem)]"
      style={{ "--sidebar-width": "18rem" } as React.CSSProperties}
    >
      <AssistantWorkspace league={league} />
    </SidebarProvider>
  );
}

function AssistantWorkspace({ league }: { league: LeagueSnapshot }) {
  const { setOpenMobile } = useSidebar();
  // Chats live in localStorage only (this browser); activeId === null means a
  // fresh unsaved chat. The welcome message is derived, never stored.
  const [chats, setChats] = useState<StoredChat[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const copyTimerRef = useRef<number | null>(null);

  // Restoring localStorage after mount keeps the server-rendered HTML and the
  // first client render identical; a render-time read would mismatch hydration.
  useEffect(() => {
    const stored = loadStoredChats();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setChats(stored);
     
    if (stored.length > 0) setActiveId(stored[0].id);
     
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    const timer = window.setTimeout(() => {
      const trimmed = [...chats]
        .sort((a, b) => b.updatedAt - a.updatedAt)
        .slice(0, MAX_STORED_CHATS)
        .map((chat) => ({
          ...chat,
          messages: chat.messages.slice(-MAX_STORED_MESSAGES),
        }));
      try {
        window.localStorage.setItem(CHATS_STORAGE_KEY, JSON.stringify(trimmed));
      } catch {
        try {
          window.localStorage.setItem(
            CHATS_STORAGE_KEY,
            JSON.stringify(trimmed.slice(0, 20)),
          );
        } catch {
          // Storage unavailable or full — the chat stays usable in memory.
        }
      }
    }, 300);
    return () => window.clearTimeout(timer);
  }, [chats, hydrated]);

  const sortedChats = useMemo(
    () => [...chats].sort((a, b) => b.updatedAt - a.updatedAt),
    [chats],
  );

  const activeMessages = activeId
    ? (chats.find((chat) => chat.id === activeId)?.messages ?? [])
    : [];
  const displayMessages = [starterMessage(league.isDemo), ...activeMessages];

  function appendToChat(chatId: string, message: DisplayMessage) {
    setChats((current) =>
      current.map((chat) =>
        chat.id === chatId
          ? {
              ...chat,
              updatedAt: Date.now(),
              messages: [...chat.messages, message],
            }
          : chat,
      ),
    );
  }

  function patchChatMessage(
    chatId: string,
    messageId: string,
    patch: Partial<DisplayMessage>,
  ) {
    setChats((current) =>
      current.map((chat) =>
        chat.id === chatId
          ? {
              ...chat,
              updatedAt: Date.now(),
              messages: chat.messages.map((message) =>
                message.id === messageId ? { ...message, ...patch } : message,
              ),
            }
          : chat,
      ),
    );
  }

  function insertTeam(teamName: string) {
    const textarea = textareaRef.current;
    const start = textarea?.selectionStart ?? draft.length;
    const end = textarea?.selectionEnd ?? draft.length;
    const before = draft.slice(0, start);
    const after = draft.slice(end);
    const prefix = before && !before.endsWith(" ") ? " " : "";
    const suffix = after && !after.startsWith(" ") ? " " : "";
    const inserted = `${prefix}${teamName}${suffix}`;
    const next = `${before}${inserted}${after}`;
    const cursor = before.length + inserted.length;
    setDraft(next);
    requestAnimationFrame(() => {
      textareaRef.current?.focus();
      textareaRef.current?.setSelectionRange(cursor, cursor);
    });
  }

  async function copyMessage(message: DisplayMessage) {
    let copied = false;
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(message.content);
        copied = true;
      }
    } catch {
      copied = false;
    }
    if (!copied) {
      // Fallback for non-secure contexts where the clipboard API is blocked.
      try {
        const scratch = document.createElement("textarea");
        scratch.value = message.content;
        scratch.setAttribute("readonly", "");
        scratch.style.position = "fixed";
        scratch.style.opacity = "0";
        document.body.appendChild(scratch);
        scratch.select();
        copied = document.execCommand("copy");
        scratch.remove();
      } catch {
        copied = false;
      }
    }
    if (!copied) return;
    setCopiedId(message.id);
    if (copyTimerRef.current) window.clearTimeout(copyTimerRef.current);
    copyTimerRef.current = window.setTimeout(
      () => setCopiedId(null),
      COPY_FEEDBACK_MS,
    );
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    const content = draft.trim();
    if (!content || busy) return;

    const now = Date.now();
    const chatId = activeId ?? crypto.randomUUID();
    const userMessage: DisplayMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content,
    };

    if (activeId === null) {
      setChats((current) => [
        {
          id: chatId,
          title: chatTitleFrom(content),
          createdAt: now,
          updatedAt: now,
          messages: [userMessage],
        },
        ...current,
      ]);
    } else {
      setChats((current) =>
        current.map((chat) =>
          chat.id === chatId
            ? {
                ...chat,
                updatedAt: now,
                messages: [...chat.messages, userMessage],
              }
            : chat,
        ),
      );
    }
    setActiveId(chatId);
    setDraft("");
    setBusy(true);
    setError("");

    const history = [...activeMessages, userMessage]
      .slice(-48)
      .map(({ role, content: messageContent }) => ({ role, content: messageContent }));

    const assistantId = crypto.randomUUID();
    let assistantStarted = false;
    let streamedText = "";
    let streamedSources: ChatSource[] = [];

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history }),
      });

      if (!response.ok) {
        const payload = (await response.json()) as { error?: string };
        throw new Error(payload.error ?? "The assistant could not answer.");
      }
      if (!response.body) throw new Error("The assistant returned no stream.");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        buffer += decoder.decode(value, { stream: !done });
        const lines = buffer.split(/\r?\n/);
        buffer = done ? "" : (lines.pop() ?? "");

        for (const line of lines) {
          if (!line.trim()) continue;
          const event = JSON.parse(line) as
            | { type: "delta"; content: string }
            | { type: "sources"; sources: ChatSource[] }
            | { type: "done" }
            | { type: "error"; error: string };

          if (event.type === "error") throw new Error(event.error);
          if (event.type === "sources") streamedSources = event.sources;
          if (event.type === "delta") streamedText += event.content;
          if (event.type === "done") continue;

          if (!assistantStarted && streamedText) {
            assistantStarted = true;
            appendToChat(chatId, {
              id: assistantId,
              role: "assistant",
              content: streamedText,
              sources: streamedSources,
            });
          } else if (assistantStarted) {
            patchChatMessage(chatId, assistantId, {
              content: streamedText,
              sources: streamedSources,
            });
          }
        }
        if (done) break;
      }

      if (!streamedText.trim()) {
        throw new Error("The assistant returned an empty answer.");
      }
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "The assistant could not answer.",
      );
    } finally {
      setBusy(false);
    }
  }

  function startNewChat() {
    setActiveId(null);
    setDraft("");
    setError("");
    setOpenMobile(false);
    textareaRef.current?.focus();
  }

  function selectChat(chatId: string) {
    setActiveId(chatId);
    setDraft("");
    setError("");
    setOpenMobile(false);
    requestAnimationFrame(() => textareaRef.current?.focus());
  }

  function deleteChat(chatId: string) {
    setChats((current) => current.filter((chat) => chat.id !== chatId));
    if (activeId === chatId) setActiveId(null);
  }

  function clearAllChats() {
    if (chats.length === 0) return;
    if (!window.confirm("Delete all saved chats from this browser?")) return;
    setChats([]);
    setActiveId(null);
    setDraft("");
    setError("");
    setOpenMobile(false);
  }

  return (
    <>
      <Sidebar
        collapsible="offcanvas"
        className="border-r border-[#463a73] bg-sidebar"
      >
        <SidebarHeader className="border-b border-sidebar-border p-5">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-[#dfff5b]">
            Goofy Cup
          </p>
          <h2 className="text-xl font-black tracking-tight">Fantasy assistant</h2>
          <p className="text-sm leading-5 text-white/55">
            Chats save in this browser only. Tap a team to insert its name.
          </p>
        </SidebarHeader>
        <SidebarContent className="p-2">
          <SidebarGroup>
            <div className="flex items-center justify-between">
              <SidebarGroupLabel className="text-white/45">
                Chat history
              </SidebarGroupLabel>
              {sortedChats.length > 0 && (
                <button
                  type="button"
                  onClick={clearAllChats}
                  className="mr-1 rounded-md px-1.5 py-0.5 text-[0.65rem] font-black uppercase tracking-wide text-white/40 transition hover:bg-white/10 hover:text-white"
                >
                  Clear all
                </button>
              )}
            </div>
            <SidebarGroupContent>
              {sortedChats.length === 0 ? (
                <p className="px-2 py-1.5 text-xs leading-5 text-white/40">
                  Saved chats will appear here. Nothing is uploaded anywhere.
                </p>
              ) : (
                <SidebarMenu className="gap-1">
                  {sortedChats.map((chat) => (
                    <SidebarMenuItem key={chat.id}>
                      <div className="flex items-center gap-1">
                        <SidebarMenuButton
                          size="lg"
                          onClick={() => selectChat(chat.id)}
                          isActive={chat.id === activeId}
                          title={chat.title}
                          className="h-auto min-w-0 flex-1 rounded-xl px-2.5 py-2 hover:bg-white/10"
                        >
                          <MessageSquare className="size-4 shrink-0 text-white/45" />
                          <span className="min-w-0">
                            <span className="block truncate text-sm font-bold">
                              {chat.title}
                            </span>
                            <span className="block text-[0.7rem] text-white/40">
                              {formatRelativeTime(chat.updatedAt)}
                            </span>
                          </span>
                        </SidebarMenuButton>
                        <button
                          type="button"
                          onClick={() => deleteChat(chat.id)}
                          aria-label={`Delete chat: ${chat.title}`}
                          className="grid size-8 shrink-0 place-items-center rounded-lg text-white/35 transition hover:bg-white/10 hover:text-[#ff8ba0]"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      </div>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              )}
            </SidebarGroupContent>
          </SidebarGroup>

          <SidebarGroup>
            <SidebarGroupLabel className="text-white/45">
              Quick insert · All {league.teams.length} teams
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="gap-1.5">
                {league.teams.map((team) => (
                  <SidebarMenuItem key={team.id}>
                    <SidebarMenuButton
                      size="lg"
                      onClick={() => insertTeam(team.name)}
                      className="h-auto rounded-xl px-3 py-2.5 hover:bg-white/10"
                    >
                      <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-white/10 text-[0.7rem] font-black text-[#dfff5b]">
                        {team.abbreviation.slice(0, 3)}
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate font-extrabold">
                          {team.name}
                        </span>
                        <span className="block truncate text-xs text-white/45">
                          {team.manager}
                        </span>
                      </span>
                      <Plus className="ml-auto size-4 text-white/35" />
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter className="border-t border-sidebar-border p-4 text-xs leading-5 text-white/45">
          League data refreshes with each question.
        </SidebarFooter>
      </Sidebar>

      <SidebarInset className="min-h-0 bg-transparent">
        <div className="border-b bg-white/70 px-4 py-4 backdrop-blur sm:px-6">
          <div className="mx-auto flex max-w-4xl items-center gap-4">
            <SidebarTrigger
              className="-ml-1 md:hidden"
              aria-label="Toggle chat history"
            />
            <span className="grid size-11 place-items-center rounded-2xl bg-primary text-white shadow-[3px_3px_0_#dfff5b]">
              <BrainCircuit className="size-5" aria-hidden="true" />
            </span>
            <div className="min-w-0 flex-1">
              <h1 className="text-xl font-black tracking-tight sm:text-2xl">
                Fantasy assistant
              </h1>
              <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-bold text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Sparkles className="size-3" /> GLM-5.3 Flash · Max
                </span>
                <span className="flex items-center gap-1">
                  <Globe2 className="size-3" /> Live search · Streaming
                </span>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={startNewChat}
              className="rounded-xl bg-white"
            >
              <RotateCcw className="size-3.5" />
              <span className="hidden sm:inline">New chat</span>
            </Button>
          </div>
        </div>

        <div className="flex min-h-0 flex-1 flex-col">
          <div className="scrollbar-thin flex-1 overflow-y-auto px-4 py-6 sm:px-6">
            <div className="mx-auto max-w-4xl space-y-5">
              {displayMessages.map((message) => (
                <article
                  key={message.id}
                  className={`flex gap-3 ${message.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  {message.role === "assistant" && (
                    <span className="grid size-8 shrink-0 place-items-center rounded-xl bg-primary text-white">
                      <Bot className="size-4" aria-hidden="true" />
                    </span>
                  )}
                  <div
                    className={`max-w-[min(42rem,86%)] rounded-2xl px-4 py-3 text-[0.96rem] leading-7 shadow-sm ${
                      message.role === "user"
                        ? "rounded-br-md bg-[#201a38] text-white"
                        : "rounded-bl-md border bg-white"
                    }`}
                  >
                    {message.role === "assistant" ? (
                      <ChatMarkdown content={message.content} />
                    ) : (
                      <div className="whitespace-pre-wrap">{message.content}</div>
                    )}
                    {message.role === "assistant" && message.id !== "welcome" && (
                      <div className="mt-2 flex justify-end">
                        <button
                          type="button"
                          onClick={() => copyMessage(message)}
                          aria-label="Copy assistant message"
                          className={`flex items-center gap-1 rounded-lg px-2 py-1 text-[0.7rem] font-black uppercase tracking-wide transition ${
                            copiedId === message.id
                              ? "bg-secondary/40 text-primary"
                              : "text-muted-foreground hover:bg-accent hover:text-primary"
                          }`}
                        >
                          {copiedId === message.id ? (
                            <Check className="size-3" />
                          ) : (
                            <Copy className="size-3" />
                          )}
                          {copiedId === message.id ? "Copied" : "Copy"}
                        </button>
                      </div>
                    )}
                    {!!message.sources?.length && (
                      <div className="mt-3 border-t pt-3">
                        <p className="mb-2 text-xs font-black uppercase tracking-wider text-muted-foreground">
                          Web sources
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {message.sources.map((source) => (
                            <a
                              key={source.url}
                              href={source.url}
                              target="_blank"
                              rel="noreferrer"
                              className="max-w-full truncate rounded-lg bg-accent px-2.5 py-1 text-xs font-bold text-primary hover:underline"
                            >
                              {source.title}
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  {message.role === "user" && (
                    <span className="grid size-8 shrink-0 place-items-center rounded-xl bg-[#dfff5b] text-[#17122b]">
                      <UserRound className="size-4" aria-hidden="true" />
                    </span>
                  )}
                </article>
              ))}

              {busy && (
                <div className="flex items-center gap-3" aria-live="polite">
                  <span className="grid size-8 place-items-center rounded-xl bg-primary text-white">
                    <Bot className="size-4" />
                  </span>
                  <div className="rounded-2xl rounded-bl-md border bg-white px-4 py-3 text-sm font-semibold text-muted-foreground shadow-sm">
                    Checking the league and the web…
                  </div>
                </div>
              )}
              {error && (
                <div
                  role="alert"
                  className="rounded-xl border border-destructive/25 bg-destructive/8 px-4 py-3 text-sm font-semibold text-destructive"
                >
                  {error}
                </div>
              )}

              {activeMessages.length === 0 && !busy && (
                <div className="grid gap-2 pt-2 sm:grid-cols-3">
                  {suggestions.map((suggestion) => (
                    <button
                      key={suggestion}
                      type="button"
                      onClick={() => {
                        setDraft(suggestion);
                        textareaRef.current?.focus();
                      }}
                      className="rounded-2xl border bg-white p-3 text-left text-sm font-bold leading-5 text-muted-foreground transition hover:-translate-y-0.5 hover:border-primary/30 hover:text-foreground hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="border-t bg-white/88 px-4 py-3 backdrop-blur sm:px-6 sm:py-4">
            <div className="scrollbar-none mx-auto mb-3 flex max-w-4xl gap-2 overflow-x-auto md:hidden">
              {league.teams.map((team) => (
                <button
                  key={team.id}
                  type="button"
                  onClick={() => insertTeam(team.name)}
                  className="shrink-0 rounded-full border bg-white px-3 py-1.5 text-xs font-black text-primary shadow-sm"
                >
                  + {team.name}
                </button>
              ))}
            </div>
            <form
              onSubmit={submit}
              className="mx-auto flex max-w-4xl items-end gap-2 rounded-2xl border bg-white p-2 shadow-[0_8px_28px_rgba(48,38,83,0.1)] focus-within:border-primary/45 focus-within:ring-4 focus-within:ring-primary/8"
            >
              <Textarea
                ref={textareaRef}
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    event.currentTarget.form?.requestSubmit();
                  }
                }}
                placeholder="Ask about a team, player, trade, or matchup…"
                aria-label="Message the fantasy assistant"
                rows={1}
                maxLength={12_000}
                disabled={busy}
                className="max-h-40 min-h-11 resize-none border-0 px-3 py-2.5 text-base shadow-none focus-visible:ring-0"
              />
              <Button
                type="submit"
                size="icon"
                disabled={busy || !draft.trim()}
                className="size-11 rounded-xl"
                aria-label="Send message"
              >
                <Send className="size-4" />
              </Button>
            </form>
            <p className="mx-auto mt-2 max-w-4xl text-center text-[0.7rem] font-semibold text-muted-foreground">
              AI can make mistakes. Verify news before setting a lineup.
            </p>
          </div>
        </div>
      </SidebarInset>
    </>
  );
}
