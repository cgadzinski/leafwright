import { auth } from "@/auth";
import { FeedbackSchema } from "@/lib/chat/conversation";
import { db } from "@/lib/db";

export async function POST(request: Request): Promise<Response> {
  const parsed = FeedbackSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Invalid rating." }, { status: 400 });
  const { conversationId, messageId, value } = parsed.data;

  const conversation = await db.conversations.getById(conversationId);
  if (!conversation) return Response.json({ error: "Conversation not found." }, { status: 404 });
  const session = await auth();
  if (conversation.userId && conversation.userId !== session?.user?.id) {
    return Response.json({ error: "Conversation not found." }, { status: 404 });
  }
  if (
    !conversation.messages.some(
      (message) => message.id === messageId && message.role === "assistant",
    )
  ) {
    return Response.json({ error: "Message not found." }, { status: 404 });
  }

  const ratings = conversation.ratings.filter((rating) => rating.messageId !== messageId);
  ratings.push({ messageId, value, createdAt: new Date().toISOString() });
  await db.conversations.save({ ...conversation, ratings });
  return Response.json({ ok: true, value });
}
