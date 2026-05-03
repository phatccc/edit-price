export default function ControlGroup({ label, children, hint }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-semibold uppercase tracking-wider text-muted">
        {label}
      </label>
      {children}
      {hint && <span className="text-[11px] text-muted/60">{hint}</span>}
    </div>
  );
}
