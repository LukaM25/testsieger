
export function Navbar() {
  return (
    <header className="border-b bg-white">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <img src="/logo.svg" alt="Prüfsiegel Zentrum" className="h-8" />
          <span className="font-semibold">Prüfsiegel Zentrum UG – Testsieger Check</span>
        </div>
        <nav className="flex items-center gap-4 text-sm">
          <a href="/" className="hover:underline">Start</a>
          <a href="/precheck" className="hover:underline">Pre‑Check</a>
          <a href="/packages" className="hover:underline">Pakete</a>
          <a href="/login" className="hover:underline">Login</a>
        </nav>
      </div>
    </header>
  );
}
