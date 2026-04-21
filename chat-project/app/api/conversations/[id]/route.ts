import { NextResponse } from "next/server";
import { deleteConversation } from "@/lib/db/conversations";
import { isMongoConfigured } from "@/lib/db/mongodb";

type Params = { params: Promise<{ id: string }> };

export async function DELETE(_req: Request, { params }: Params) {
  try {
    if (!isMongoConfigured()) {
      return NextResponse.json(
        { error: "未配置 MONGODB_URI" },
        { status: 503 },
      );
    }
    const { id } = await params;
    await deleteConversation(id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "无法删除会话" }, { status: 500 });
  }
}
