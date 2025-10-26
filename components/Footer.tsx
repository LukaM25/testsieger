
export function Footer() {
  return (
    <footer className="border-t text-sm text-neutral-500">
      <div className="container mx-auto px-4 py-6 flex items-center justify-between">
        <p>© {new Date().getFullYear()} Prüfsiegel Zentrum UG</p>
        <p>Weiß / Gold / Anthrazit Design</p>
      </div>
    </footer>
  );
}
