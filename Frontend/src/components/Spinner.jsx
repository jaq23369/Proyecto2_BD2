import { cx } from "../utils/format";

export default function Spinner({ size = 22, className }) {
  return (
    <span
      style={{ width: size, height: size, borderWidth: Math.max(2, size / 12) }}
      className={cx(
        "inline-block rounded-full border-ig-border border-t-ig-link animate-spin",
        className
      )}
    />
  );
}
