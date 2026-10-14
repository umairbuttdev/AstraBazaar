import { signOut } from "@/app/auth/actions";

export function SignOutButton() {
  return (
    <form action={signOut}>
      <button
        type="submit"
        className="text-sm text-ink-soft transition-colors hover:text-ink"
      >
        Logout
      </button>
    </form>
  );
}
