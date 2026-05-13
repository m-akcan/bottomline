import { LinkButton } from "@/components/ui/Button";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[40vh] text-center gap-4">
      <span className="text-[11px] uppercase tracking-[0.18em] text-muted">404</span>
      <h1 className="text-3xl tracking-tight font-medium">Nothing here.</h1>
      <p className="text-sm text-muted max-w-md">
        The page you&rsquo;re looking for can&rsquo;t be found.
      </p>
      <LinkButton href="/" variant="primary">
        Back to dashboard
      </LinkButton>
    </div>
  );
}
