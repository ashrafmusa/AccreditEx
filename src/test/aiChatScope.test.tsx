import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import React from "react";
import type { User } from "@/types";
import type { ChatResponse } from "@/services/aiAgentService";
import type { AIGrounding } from "@/services/aiGroundingService";

jest.mock("@/stores/useUserStore", () => {
  const { create } = jest.requireActual("zustand");
  return { useUserStore: create(() => ({ currentUser: null })) };
});
jest.mock("@/stores/useTenantStore", () => {
  const { create } = jest.requireActual("zustand");
  return { useTenantStore: create(() => ({ organizationId: "" })) };
});
jest.mock("@/services/aiAgentService", () => ({
  aiAgentService: { chat: jest.fn(), healthCheck: jest.fn(), resetThread: jest.fn() },
}));
jest.mock("@/hooks/useTranslation", () => ({
  useTranslation: () => ({ t: (key: string) => key, lang: "en", dir: "ltr" }),
}));
jest.mock("@/hooks/useToast", () => ({
  useToast: () => ({ success: jest.fn(), error: jest.fn() }),
}));
jest.mock("@/components/ai/AIResponseView", () => ({
  __esModule: true,
  default: ({ content, grounding }: { content: string; grounding?: AIGrounding }) => (
    <div>{content}{grounding?.sources.map((source) => <p key={source.ref}>{source.excerpt}</p>)}</div>
  ),
}));

import { AIAssistant } from "@/components/ai/AIAssistant";
import { aiAgentService } from "@/services/aiAgentService";
import { useAIChatStore } from "@/stores/useAIChatStore";
import { useUserStore } from "@/stores/useUserStore";
import { useTenantStore } from "@/stores/useTenantStore";

const user = (id: string, organizationId = "org-a") => ({
  id, email: `${id}@example.com`, organizationId,
}) as User;
const response: ChatResponse = {
  response: "Prior answer",
  thread_id: "old-thread",
  timestamp: "2026-10-10T00:00:00Z",
  grounding: {
    schema: "ai-grounding/1",
    organizationId: "org-a",
    sources: [{
      ref: "document:old",
      kind: "document",
      id: "old",
      organizationId: "org-a",
      title: "Prior policy",
      excerpt: "Private old evidence",
      excerptTruncated: false,
      links: [],
    }],
    coverage: { available: 1, selected: 1, omitted: 0, limitations: [] },
  },
};
const transition = (kind: string) => {
  if (kind === "tenant") useTenantStore.setState({ organizationId: "org-b" });
  else if (kind === "logout") useUserStore.setState({ currentUser: null });
  else if (kind === "user organization") useUserStore.setState({ currentUser: user("alice", "org-b") });
  else useUserStore.setState({ currentUser: user("bob") });
};
const sendLocal = () => {
  fireEvent.change(screen.getByRole("textbox"), { target: { value: "Question" } });
  fireEvent.click(screen.getByRole("button", { name: "sendMessage" }));
};

describe("AI chat evidence scope", () => {
  beforeEach(() => {
    useUserStore.setState({ currentUser: user("alice") });
    useTenantStore.setState({ organizationId: "org-a" });
    useAIChatStore.getState().clearChat();
    jest.clearAllMocks();
    jest.mocked(aiAgentService.chat).mockResolvedValue(response);
    jest.mocked(aiAgentService.healthCheck).mockResolvedValue(true);
    Element.prototype.scrollIntoView = jest.fn();
    jest.spyOn(console, "log").mockImplementation(() => undefined);
  });
  afterEach(() => jest.restoreAllMocks());

  it.each(["tenant", "user", "logout", "user organization"])(
    "clears local and shared evidence on a %s transition",
    async (kind) => {
      // Arrange
      render(<AIAssistant defaultOpen />);
      await useAIChatStore.getState().sendMessage("Stored question");
      sendLocal();
      await screen.findByText("Private old evidence");
      expect(useAIChatStore.getState().messages[1].grounding).toEqual(response.grounding);
      fireEvent.change(screen.getByRole("textbox"), { target: { value: "Unsaved private question" } });

      // Act
      act(() => transition(kind));

      // Assert
      expect(screen.queryByText("Private old evidence")).not.toBeInTheDocument();
      expect(screen.queryByText("Prior answer")).not.toBeInTheDocument();
      expect(screen.getByRole("textbox")).toHaveValue("");
      expect(useAIChatStore.getState()).toMatchObject({ messages: [], threadId: null, error: null, isLoading: false });
      expect(aiAgentService.resetThread).toHaveBeenCalled();
    },
  );

  it("retains evidence and conversation when the same scope is refreshed", async () => {
    // Arrange
    render(<AIAssistant defaultOpen />);
    await useAIChatStore.getState().sendMessage("Stored question");
    sendLocal();
    await screen.findByText("Private old evidence");

    // Act
    act(() => {
      useUserStore.setState({ currentUser: { ...user("alice"), name: "Updated name" } });
      useTenantStore.setState({ organizationId: "org-a", loading: true });
    });

    // Assert
    expect(screen.getByText("Private old evidence")).toBeInTheDocument();
    expect(useAIChatStore.getState().messages[1].grounding).toEqual(response.grounding);
    expect(useAIChatStore.getState().threadId).toBe("old-thread");
    expect(aiAgentService.resetThread).not.toHaveBeenCalled();
  });

  it.each(["resolve", "reject"])("discards late %s results after a scope transition", async (outcome) => {
    // Arrange
    let resolve!: (value: ChatResponse) => void;
    let reject!: (reason: Error) => void;
    const pending = new Promise<ChatResponse>((done, fail) => { resolve = done; reject = fail; });
    jest.mocked(aiAgentService.chat).mockReturnValue(pending);
    render(<AIAssistant defaultOpen />);
    const storedRequest = useAIChatStore.getState().sendMessage("Stored question");
    sendLocal();

    // Act
    act(() => transition("tenant"));
    await act(async () => {
      if (outcome === "resolve") resolve(response);
      else reject(new Error("Old private error"));
      await storedRequest;
    });

    // Assert
    expect(screen.queryByText("Private old evidence")).not.toBeInTheDocument();
    expect(screen.queryByText(/Old private error/)).not.toBeInTheDocument();
    expect(useAIChatStore.getState()).toMatchObject({ messages: [], threadId: null, error: null, isLoading: false });
    await waitFor(() => expect(screen.getByRole("textbox")).not.toBeDisabled());
  });
});
