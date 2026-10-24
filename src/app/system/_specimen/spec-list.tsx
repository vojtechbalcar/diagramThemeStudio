import { cn } from "@/lib/cn";

export type SpecListProps = {
  items: readonly { term: string; value: string; mono?: boolean }[];
  className?: string;
};

/** Ruled list of measurements: labels in small muted, values in small or mono (both 13/16). */
export function SpecList({ items, className }: SpecListProps) {
  return (
    <dl className={cn("border-t border-rule", className)}>
      {items.map((item) => (
        <div key={item.term} className="flex items-baseline gap-4 border-b border-rule py-3">
          <dt className="w-24 shrink-0 type-small text-muted">{item.term}</dt>
          <dd className={item.mono ? "type-mono" : "type-small"}>{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}
