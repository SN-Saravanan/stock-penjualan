function EmployeePlaceholder({ title, description }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
      <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
        Area Karyawan
      </span>

      <h2 className="mt-4 text-2xl font-bold text-slate-950">{title}</h2>

      <p className="mt-3 max-w-xl leading-7 text-slate-500">{description}</p>

      <div className="mt-8 flex min-h-72 items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50">
        <p className="text-sm text-slate-400">
          Fitur akan diaktifkan pada tahap berikutnya.
        </p>
      </div>
    </div>
  );
}

export default EmployeePlaceholder;
