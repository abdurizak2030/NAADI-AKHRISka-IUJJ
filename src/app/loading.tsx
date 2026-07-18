export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50 dark:bg-[#06140c]">
      <div className="w-10 h-10 rounded-full border-[3px] border-emerald-100 border-t-emerald-800 animate-spin" role="status" aria-label="Loading" />
    </div>
  );
}
