export function BrandMark({ size = "sm" }: { size?: "sm" | "lg" }) {
  return (
    <span className="flex items-center gap-2.5">
      <span
        aria-hidden
        className={
          size === "lg"
            ? "grid size-12 place-items-center rounded-xl bg-primary text-[22px] font-bold text-primary-foreground"
            : "grid size-9 place-items-center rounded-lg bg-primary text-[16px] font-bold text-primary-foreground"
        }
      >
        <span lang="ja" className="font-jp">日</span>
      </span>
      <span className={size === "lg" ? "text-[22px] font-semibold tracking-tight" : "text-[15px] font-semibold tracking-tight"}>
        enonihongo
      </span>
    </span>
  );
}
