export function BrandMark({ size = "sm" }: { size?: "sm" | "lg" }) {
  return (
    <span className="flex items-center gap-2.5">
      <span
        aria-hidden
        className={
          size === "lg"
            ? "grid size-11 place-items-center rounded-xl bg-primary text-xl font-bold text-primary-foreground"
            : "grid size-8 place-items-center rounded-lg bg-primary text-sm font-bold text-primary-foreground"
        }
      >
        <span lang="ja" className="font-jp">日</span>
      </span>
      <span className={size === "lg" ? "text-xl font-semibold tracking-tight" : "text-sm font-semibold tracking-tight"}>
        enonihongo
      </span>
    </span>
  );
}
