function AdminPlaceholder({ title, description }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
      <div className="max-w-xl">
        <span className="inline-flex rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
          Coming Soon
        </span>

        <h2 className="mt-4 text-2xl font-bold text-slate-950">{title}</h2>

        <p className="mt-3 leading-7 text-slate-500">{description}</p>
      </div>

      <div className="mt-8 flex min-h-72 items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50">
        <p className="text-sm text-slate-400">
          Konten halaman akan dibuat pada tahap berikutnya.
        </p>
      </div>
    </div>
  );
}

export default AdminPlaceholder;
