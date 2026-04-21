import { NextResponse } from "next/server";
import { getMessages } from "@/lib/db/conversations";
import { isMongoConfigured } from "@/lib/db/mongodb";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Params) {
  try {
    if (!isMongoConfigured()) {
      return NextResponse.json(
        { error: "未配置 MONGODB_URI" },
        { status: 503 },
      );
    }
    const { id } = await params;
    const messages = await getMessages(id);
    return NextResponse.json({ messages });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "无法读取消息" }, { status: 500 });
  }
}
