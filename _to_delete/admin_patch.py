import re, sys
p = sys.argv[1]
s = open(p, encoding='utf-8').read()

# 1) Login
a = s.index("  if (!authed) {\n    return (")
b = s.index("  return (\n    <div className=\"min-h-screen bg-slate-950/5 p-6\">")
login = '''  if (!authed) {
    return (
      <div className="flex min-h-[80vh] items-center justify-center bg-slate-50 px-4 py-12">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleLogin();
          }}
          className="w-full max-w-sm rounded-3xl border border-slate-200/80 bg-white p-8 shadow-[0_30px_80px_-50px_rgba(43,64,102,0.5)]"
        >
          <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-slate-500">DPI Admin</p>
          <h1 className="mt-2 text-2xl font-semibold text-[#2B4066]">Anmelden</h1>
          <label className="mt-6 block text-xs font-semibold text-slate-600">
            E-Mail
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value.toLowerCase())}
              className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-[#1d4ed8]/50 focus:bg-white focus:ring-4 focus:ring-[#1d4ed8]/10"
              autoComplete="email"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
            />
          </label>
          <label className="mt-4 block text-xs font-semibold text-slate-600">
            Passwort
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-[#1d4ed8]/50 focus:bg-white focus:ring-4 focus:ring-[#1d4ed8]/10"
              autoComplete="current-password"
            />
          </label>
          <button
            type="submit"
            className="mt-6 w-full rounded-full bg-gradient-to-r from-[#1d4ed8] to-[#16294d] px-4 py-3 text-sm font-semibold !text-white shadow-sm transition hover:brightness-110"
          >
            Anmelden
          </button>
          {message && <p className="mt-4 text-sm text-rose-600" role="alert">{message}</p>}
        </form>
      </div>
    );
  }

'''
s = s[:a] + login + s[b:]

# 2) Wrapper + idle warning
s = s.replace('<div className="min-h-screen bg-slate-950/5 p-6">\n      <div className="mx-auto max-w-6xl space-y-6">',
              '<div className="min-h-screen bg-slate-50 px-4 pb-20 pt-8">\n      <div className="mx-auto max-w-6xl space-y-6">')
s = s.replace('<div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 shadow-sm">',
              '<div className="fixed bottom-6 right-6 z-50 max-w-sm rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 shadow-xl" role="alert">')

# 3) Loading + empty + groups
a = s.index("        {loadingProducts ? (")
b = s.index("        {nextCursor ? (")
body = '''        {loadingProducts && products.length === 0 ? (
          <div className="space-y-3" aria-busy="true">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-28 animate-pulse rounded-3xl border border-slate-200/70 bg-white" />
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white/60 px-6 py-14 text-center">
            <p className="text-base font-semibold text-[#2B4066]">Keine Treffer</p>
            <p className="mt-1 text-sm text-slate-500">Passe Suche oder Filter an, oder aktualisiere die Liste.</p>
          </div>
        ) : (
          <div className={`space-y-8 transition-opacity duration-200 ${loadingProducts ? 'opacity-60' : 'opacity-100'}`}>
            {Object.entries(grouped).map(([date, userGroups]) => {
              const totalEntries = Object.values(userGroups).reduce((sum, group) => sum + group.items.length, 0);
              return (
                <section key={date} className="space-y-3">
                  <div className="flex items-center gap-3">
                    <h2 className="text-sm font-semibold text-[#2B4066]">{date}</h2>
                    <span className="rounded-full bg-slate-200/70 px-2 py-0.5 text-[11px] font-semibold tabular-nums text-slate-600">{totalEntries}</span>
                    <span className="h-px flex-1 bg-slate-200" />
                  </div>
                  {Object.entries(userGroups).map(([userKey, group]) => {
                    const userDisplayName = formatContactName(group.user.name, group.user.gender, group.user.email);
                    const title = group.user.company ? `${group.user.company} · ${userDisplayName}` : userDisplayName;
                    const initial = (group.user.company || group.user.name || '?').trim().charAt(0).toUpperCase();
                    return (
                      <details
                        key={userKey}
                        open
                        className="group rounded-3xl border border-slate-200/80 bg-white shadow-[0_20px_60px_-45px_rgba(43,64,102,0.35)]"
                      >
                        <summary className="flex cursor-pointer list-none items-center gap-4 rounded-3xl p-4 transition hover:bg-slate-50/70 [&::-webkit-details-marker]:hidden">
                          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#1d4ed8] to-[#16294d] text-sm font-semibold text-white">
                            {initial}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm font-semibold text-slate-900">{title}</span>
                            <span className="block truncate text-xs text-slate-500">{group.user.email}</span>
                          </span>
                          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold tabular-nums text-slate-600">
                            {group.items.length} {group.items.length === 1 ? 'Produkt' : 'Produkte'}
                          </span>
                          <svg viewBox="0 0 20 20" className="h-4 w-4 text-slate-400 transition-transform duration-200 group-open:rotate-180" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
                            <path d="m5 8 5 5 5-5" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </summary>
                        <div className="space-y-3 border-t border-slate-100 p-4">
                          {group.items.map((product) => (
                            <AdminProductRow
                              key={product.id}
                              product={product}
                              onUpdated={applyProductPatch}
                              onPreview={onPreviewClick}
                              isPreviewLoading={isPreviewLoading && activePreviewId === (product.certificate?.id || 'temp')}
                              permissions={permissions}
                            />
                          ))}
                        </div>
                      </details>
                    );
                  })}
                </section>
              );
            })}
          </div>
        )}
'''
s = s[:a] + body + s[b:]
s = s.replace('className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-800 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"',
              'className="rounded-full border border-slate-200 bg-white px-6 py-2.5 text-sm font-semibold text-[#2B4066] shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"')
s = s.replace("{loadingMore ? 'Lädt…' : 'Mehr laden / Load more'}", "{loadingMore ? 'Lädt…' : 'Mehr laden'}")
open(p, 'w', encoding='utf-8').write(s)
print('ok')
