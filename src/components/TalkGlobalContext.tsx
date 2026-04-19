import { useEffect } from "react";
import { getUser } from "../lib/auth";

/**
 * TalkGlobalContext — sets window.DASM_TALK globally for the investor portal.
 *
 * Investor is a personal dashboard (not a per-listing surface), so the Talk
 * widget opens a support conversation with the DASM team. When the user is
 * signed in, we bind the conversation to an actor-scoped entity so the same
 * investor always lands in the same thread across sessions; otherwise the
 * widget falls back to the generic support queue.
 *
 * mode "text+voice" enables the LiveKit voice room overlay so the investor
 * can call DASM support from inside the chat panel (room = "actor:investor:{id}").
 *
 * role "participant" gives mic-publish capability without admin grants.
 */
export default function TalkGlobalContext() {
  const user = getUser();
  const userId =
    user && typeof user === "object"
      ? String((user as Record<string, unknown>).user_id ?? (user as Record<string, unknown>).id ?? "")
      : "";

  useEffect(() => {
    const prev =
      (window as unknown as { DASM_TALK?: Record<string, unknown> }).DASM_TALK ?? {};
    const next: Record<string, unknown> = {
      ...prev,
      mode: "text+voice",
      role: "participant",
    };
    if (userId) {
      next.entity_type = "actor";
      next.entity_id = `investor:${userId}`;
    }
    (window as unknown as { DASM_TALK?: Record<string, unknown> }).DASM_TALK = next;
    window.dispatchEvent(new CustomEvent("dasm-talk:update"));
  }, [userId]);

  return null;
}
