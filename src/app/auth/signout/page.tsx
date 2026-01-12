import Link from "next/link";

export default function SignOut() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-slate-900 px-4">
      <div className="w-full max-w-md rounded-lg border bg-background p-6 text-center shadow">
        <h1 className="text-xl font-semibold">Authentication Disabled</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Sign-out is disabled for local use.
        </p>
        <Link
          className="mt-4 inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground"
          href="/presentation"
        >
          Go to Presentation
        </Link>
      </div>
    </div>
  );
}
