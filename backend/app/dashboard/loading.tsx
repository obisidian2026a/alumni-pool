export default function DashboardLoading() {
  return (
    <main className="min-h-screen bg-[#f5f7fb]">
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-brand-line border-t-brand-primary" aria-label="Loading" />
      </div>
    </main>
  );
}
