import type { UserContext, ChatMessage, Coach } from "../types/zodSchemas.js";

export function buildSystemPrompt(
  coach: Coach,
  userContext: UserContext | null,
  recentMessages: ChatMessage[]
): string {
  let systemPrompt = coach.system_prompt;

  // Add user context if available
  if (userContext) {
    const contextStr = `
User Context: 
- Role: ${userContext.role || "Not specified"}
- Goals: ${userContext.goals || "Not specified"}
- Tools: ${userContext.tools.join(", ") || "Not specified"}
- Preferences: ${JSON.stringify(userContext.preferences || {})}
`;
    systemPrompt += "\n" + contextStr;
  }

  return systemPrompt;
}

export function buildMessagesForOpenAI(
  systemPrompt: string,
  recentMessages: ChatMessage[]
): Array<{ role: "system" | "user" | "assistant"; content: string }> {
  const messages: Array<{
    role: "system" | "user" | "assistant";
    content: string;
  }> = [
    {
      role: "system",
      content: systemPrompt,
    },
  ];

  // Add last 20 messages
  for (const msg of recentMessages.slice(-20)) {
    messages.push({
      role: msg.role as "user" | "assistant",
      content: msg.content,
    });
  }

  return messages;
}
