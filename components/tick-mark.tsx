// tanda centang ala tick mark auditor, dipakai di logo dan penanda sitasi
export function TickMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      <path d="M2.5 8.5 6 12l7.5-8.5" />
    </svg>
  );
}
