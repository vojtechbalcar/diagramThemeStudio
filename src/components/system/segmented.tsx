import { cn } from "@/lib/cn";

export type SegmentedOption<V extends string> = { value: V; label: string };

export type SegmentedProps<V extends string> = {
  /** Shared radio-group name; must be unique on the page. */
  name: string;
  /** Accessible group label. */
  legend: string;
  options: readonly SegmentedOption<V>[];
  /** Controlled value; pass `onValueChange` with it. */
  value?: V;
  defaultValue?: V;
  onValueChange?: (value: V) => void;
  disabled?: boolean;
  className?: string;
};

/**
 * Joined segments in one 2px ink frame; the selected one is inverted.
 * Native radios, so arrow keys move the selection with no script.
 * The focus ring is inset and takes on-ink on the selected segment.
 */
export function Segmented<V extends string>({
  name,
  legend,
  options,
  value,
  defaultValue,
  onValueChange,
  disabled,
  className,
}: SegmentedProps<V>) {
  return (
    <fieldset
      disabled={disabled}
      className={cn("group inline-flex h-12 border-2 border-ink disabled:border-rule", className)}
    >
      <legend className="sr-only">{legend}</legend>
      {options.map((option, index) => (
        <label
          key={option.value}
          className={cn(
            "relative inline-flex cursor-pointer select-none items-center px-4 text-ink type-body font-bold",
            index > 0 && "border-l-2 border-ink group-disabled:border-rule",
            "group-enabled:not-has-checked:hover:bg-recess",
            "has-checked:bg-ink has-checked:text-on-ink has-checked:[--lw-focus:var(--lw-on-ink)]",
            "has-focus-visible:outline-2 has-focus-visible:-outline-offset-4 has-focus-visible:outline-focus",
            "group-disabled:cursor-not-allowed group-disabled:text-muted",
            "group-disabled:has-checked:bg-rule group-disabled:has-checked:text-muted",
          )}
        >
          <input
            type="radio"
            className="sr-only"
            name={name}
            value={option.value}
            {...(value !== undefined
              ? { checked: value === option.value, onChange: () => onValueChange?.(option.value) }
              : {
                  defaultChecked: defaultValue === option.value,
                  onChange: onValueChange ? () => onValueChange(option.value) : undefined,
                })}
          />
          {option.label}
        </label>
      ))}
    </fieldset>
  );
}
