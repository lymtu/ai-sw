import { ObjectId } from "mongodb";
import type { ChatMessage } from "@/lib/chat-types";
import { getDb } from "./mongodb";

const CONV = "conversations";
const MSG = "messages";

function convColl() {
  return getDb().then((db) => db.collection(CONV));
}

function msgColl() {
  return getDb().then((db) => db.collection(MSG));
}

export async function listConversations() {
  const col = await convColl();
  const rows = await col
    .find({})
    .sort({ updatedAt: -1 })
    .limit(100)
    .toArray();
  return rows.map((d) => ({
    id: String(d._id),
    title: String(d.title ?? "新对话"),
    updatedAt:
      d.updatedAt instanceof Date
        ? d.updatedAt.toISOString()
        : new Date().toISOString(),
  }));
}

export async function createConversation(title = "新对话") {
  const col = await convColl();
  const now = new Date();
  const { insertedId } = await col.insertOne({
    title,
    createdAt: now,
    updatedAt: now,
  });
  return { id: insertedId.toHexString(), title };
}

export async function deleteConversation(id: string) {
  const oid = new ObjectId(id);
  const c = await convColl();
  const m = await msgColl();
  await m.deleteMany({ conversationId: oid });
  await c.deleteOne({ _id: oid });
}

export async function touchConversation(id: string) {
  const col = await convColl();
  await col.updateOne(
    { _id: new ObjectId(id) },
    { $set: { updatedAt: new Date() } },
  );
}

export async function setConversationTitleIfDefault(
  id: string,
  firstUserText: string,
) {
  const col = await convColl();
  const oid = new ObjectId(id);
  const doc = await col.findOne({ _id: oid });
  if (!doc) return;
  const title = String(doc.title ?? "");
  if (title && title !== "新对话") return;
  const trimmed = firstUserText.replace(/\s+/g, " ").trim().slice(0, 48);
  if (!trimmed) return;
  await col.updateOne(
    { _id: oid },
    { $set: { title: trimmed || "新对话", updatedAt: new Date() } },
  );
}

export async function getMessages(
  conversationId: string,
): Promise<ChatMessage[]> {
  const col = await msgColl();
  const oid = new ObjectId(conversationId);
  const rows = await col
    .find({ conversationId: oid })
    .sort({ createdAt: 1 })
    .toArray();
  return rows.map((r) => ({
    id: r.messageId as string,
    role: r.role as ChatMessage["role"],
    parts: r.parts as ChatMessage["parts"],
  }));
}

export async function upsertMessage(
  conversationId: string,
  message: ChatMessage,
) {
  const col = await msgColl();
  const oid = new ObjectId(conversationId);
  const now = new Date();
  await col.updateOne(
    { conversationId: oid, messageId: message.id },
    {
      $set: {
        conversationId: oid,
        messageId: message.id,
        role: message.role,
        parts: message.parts,
        createdAt: now,
      },
    },
    { upsert: true },
  );
  await touchConversation(conversationId);
}
