import { PostEditor } from "@/components/reception/PostEditor";

export const metadata = {
  title: "New post · Reception",
};

export default function NewPostPage() {
  return (
    <div>
      <h1 className="font-serif text-3xl text-ink-900">New post</h1>
      <p className="mt-1 text-sm text-ink-500">
        Save as draft any time, or publish when ready.
      </p>
      <div className="mt-8">
        <PostEditor />
      </div>
    </div>
  );
}
