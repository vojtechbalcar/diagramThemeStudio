import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/cn";
import { ArrowTile } from "./arrow-tile";
import { ARROW_TILE_STATES, buttonClass, type ButtonStyleOptions } from "./button-styles";

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & ButtonStyleOptions;

export function Button({
  variant = "primary",
  size,
  arrow = false,
  type = "button",
  className,
  children,
  ...rest
}: ButtonProps) {
  const withArrow = arrow && variant === "primary";
  return (
    <button type={type} className={cn(buttonClass({ variant, size, arrow: withArrow }), className)} {...rest}>
      {children}
      {withArrow ? (
        <ArrowTile inverted className={ARROW_TILE_STATES} />
      ) : null}
    </button>
  );
}
