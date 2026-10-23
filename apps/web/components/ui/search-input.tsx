type SearchInputProps = {
  id?: string;
  defaultValue?: string;
  placeholder?: string;
  className?: string;
  action?: string;
  name?: string;
};

export function SearchInput({
  id = "site-search",
  defaultValue,
  placeholder = "Search products",
  className = "",
  action = "/search",
  name = "q",
}: SearchInputProps) {
  return (
    <form action={action} method="get" className={`relative ${className}`} role="search">
      <label htmlFor={id} className="sr-only">
        Search products
      </label>
      <input
        id={id}
        type="search"
        name={name}
        defaultValue={defaultValue}
        placeholder={placeholder}
        className="w-full rounded-md border border-border bg-surface px-4 py-2.5 pr-11 text-sm text-foreground outline-none transition placeholder:text-foreground-muted focus:border-primary"
      />
      <button
        type="submit"
        aria-label="Search"
        className="absolute top-1/2 right-2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md text-foreground-muted transition-colors hover:bg-surface-secondary hover:text-foreground"
      >
        <svg
          viewBox="0 0 24 24"
          className="h-4 w-4"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          aria-hidden
        >
          <circle cx="11" cy="11" r="7" />
          <path d="M20 20l-3.5-3.5" />
        </svg>
      </button>
    </form>
  );
}
