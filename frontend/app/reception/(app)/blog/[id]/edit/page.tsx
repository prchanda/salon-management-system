import { notFound } from "next/navigation";
import { api } from "@/lib/api";
import { PostEditor } from "@/components/reception/PostEditor";
import type { Post } from "@/lib/types";

export const dynamic = "force-dynamic";

interface Props {
  params: { id: string };
}

async function safeGet(id: number): Promise<Post | null> {
  try {
    return await api.getAdminPostById(id);
  } catch {
    return null;
  }
}

export default async function EditPostPage({ params }: Props) {
  const id = Number(params.id);
  if (!Number.isFinite(id) || id <= 0) notFound();

  const post = await safeGet(id);
  if (!post) notFound();

  return (
    <div>
      <h1 className="font-serif text-3xl text-ink-900">Edit post</h1>
      <p className="mt-1 text-sm text-ink-500">/blog/{post.slug}</p>
      <div className="mt-8">
        <PostEditor initial={post} />
      </div>
    </div>
  );
}
