export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-linear-to-br from-[#FF5A5F] to-[#FF8042] text-white p-8">
      <div className="max-w-2xl text-center space-y-6">
        <div className="text-7xl">💬</div>
        <h1 className="text-6xl font-extrabold tracking-tight">Suno</h1>
        <p className="text-2xl text-white/90">Konuş, gül, öğren.</p>
        <p className="text-base text-white/80 max-w-md mx-auto">
          Gerçek aksanlı AI öğretmenle, günlük 10 dakikada İngilizce, İspanyolca veya Almanca konuşmaya başla.
        </p>
        <div className="flex gap-3 justify-center pt-4">
          <a
            href="#"
            className="bg-white text-[#FF5A5F] px-6 py-3 rounded-full font-semibold hover:bg-white/90 transition"
          >
            App Store&apos;da yakında
          </a>
        </div>
      </div>
      <footer className="absolute bottom-6 text-sm text-white/70">
        © 2026 Suno ·{" "}
        <a href="/api/health" className="underline">
          /api/health
        </a>
      </footer>
    </main>
  );
}
