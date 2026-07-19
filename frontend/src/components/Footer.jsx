export default function Footer() {
  return (
    <footer className="mt-20 px-4 sm:px-8 pb-10">
      <div className="max-w-6xl mx-auto glass-card px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-white/50">
        <p>© {new Date().getFullYear()} LockDrop. No accounts. No tracking. Just files.</p>
        <p>Built with ❤️ by Atanu Das</p>
      </div>
    </footer>
  );
}
