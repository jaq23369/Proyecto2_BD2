import { cx } from "../utils/format";

export default function EmptyState({ icon: Icon, title, hint, action, className }) {
  return (
    <div className={cx("ig-card p-10 text-center", className)}>
      {Icon && (
        <div className="w-14 h-14 rounded-full mx-auto mb-3 grid place-items-center bg-ig-elevated border ig-border">
          <Icon size={26} className="ig-text-soft" />
        </div>
      )}
      {title && <h3 className="text-base font-semibold mb-1">{title}</h3>}
      {hint && <p className="ig-text-soft text-sm mb-4">{hint}</p>}
      {action}
    </div>
  );
}
