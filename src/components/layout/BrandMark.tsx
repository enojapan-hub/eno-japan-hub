export function BrandMark({ size = "sm" }: { size?: "sm" | "lg" }) {
  return (
    <span className="flex items-center gap-2">
      <span
        aria-hidden
        className={
          size === "lg"
            ? "grid size-12 place-items-center rounded-2xl gradient-primary text-2xl font-bold text-primary-foreground"
            : "grid size-8 place-items-center rounded-lg gradient-primary text-sm font-bold text-primary-foreground"
        }
      >
        <span lang="ja" className="font-jp">
          日
        </span>
      </span>
      <span
        className={
          size === "lg"
            ? "text-xl font-semibold tracking-tight"
            : "text-sm font-semibold tracking-tight"
        }
      >
        ENO JAPAN
      </span>
    </span>
  );
}
