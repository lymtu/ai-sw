import { NextResponse } from "next/server";
import { createConversation, listConversations } from "@/lib/db/conversations";
import { isMongoConfigured } from "@/lib/db/mongodb";

export async function GET() {
  try {
    if (!isMongoConfigured()) {
      return NextResponse.json(
        { error: "未配置 MONGODB_URI" },
        { status: 503 },
      );
    }
    const conversations = await listConversations();
    return NextResponse.json({ conversations });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "无法读取会话列表" },
      { status: 500 },
    );
  }
}

export async function POST() {
  try {
    if (!isMongoConfigured()) {
      return NextResponse.json(
        { error: "未配置 MONGODB_URI" },
        { status: 503 },
      );
    }
    const c = await createConversation();
    return NextResponse.json(c);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "无法创建会话" }, { status: 500 });
  }
}
