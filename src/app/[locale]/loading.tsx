export default function RouteLoading() {
  return (
    <section
      className="route-loading section-y bg-slate-50"
      aria-busy="true"
      role="progressbar"
    >
      <div className="route-loading-bar" />
      <div className="container-page animate-pulse space-y-8">
        <div className="space-y-4">
          <div className="h-4 w-28 rounded bg-orange-200" />
          <div className="h-10 max-w-2xl rounded bg-slate-200" />
          <div className="h-5 max-w-xl rounded bg-slate-200" />
        </div>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
          {Array.from({ length: 6 }, (_, index) => (
            <div
              key={index}
              className="aspect-[4/3] rounded-md border border-slate-200 bg-white"
            />
          ))}
        </div>
      </div>
    </section>
  );
}
