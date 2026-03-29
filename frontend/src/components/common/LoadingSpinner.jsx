export default function LoadingSpinner({ fullScreen = true }) {
  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-slate-50 flex items-center justify-center z-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-4 border-primary-600/30 border-t-primary-500 animate-spin" />
          <p className="text-slate-600 font-medium">Loading EduSpace...</p>
        </div>
      </div>
    );
  }
  return (
    <div className="flex items-center justify-center py-12">
      <div className="w-8 h-8 rounded-full border-4 border-primary-600/30 border-t-primary-500 animate-spin" />
    </div>
  );
}
