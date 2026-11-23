import sys
root = sys.argv[1]

def rw(path, fn):
    s = open(path, encoding='utf-8').read()
    s = fn(s)
    open(path, 'w', encoding='utf-8').write(s)

# --- API: users route ---
def users(s):
    if 'CreateCustomerSchema' in s:
        return s
    s = s.replace("import { AdminRole } from '@prisma/client';",
                  "import crypto from 'crypto';\nimport bcrypt from 'bcryptjs';\nimport { z } from 'zod';\nimport { AdminRole } from '@prisma/client';", 1)
    s = s.replace("import { requireAdmin } from '@/lib/admin';",
                  "import { requireAdmin, logAdminAudit } from '@/lib/admin';\nimport { sendPasswordResetEmail } from '@/lib/email';\nimport { getPublicBaseUrl } from '@/lib/baseUrl';", 1)
    return s + open(root + '/tmp/users_post.ts', encoding='utf-8').read()
rw(root + '/app/api/admin/users/route.ts', users)

# --- Header: Button ---
def header(s):
    if 'onCreateCustomer' in s:
        return s
    s = s.replace("  onToggleSuper: () => void;\n", "  onToggleSuper: () => void;\n  onCreateCustomer?: () => void;\n", 1)
    s = s.replace("  onToggleSuper,\n  onRefresh,", "  onToggleSuper,\n  onCreateCustomer,\n  onRefresh,", 1)
    btn = '''          {isSuperAdmin && onCreateCustomer && (
            <button
              type="button"
              onClick={onCreateCustomer}
              className="inline-flex items-center gap-2 rounded-full border border-[#1d4ed8]/30 bg-white px-4 py-2 text-sm font-semibold text-[#1d4ed8] shadow-sm transition hover:bg-[#1d4ed8]/5"
            >
              <span aria-hidden className="text-base leading-none">+</span> Kunde anlegen
            </button>
          )}
'''
    marker = "          {isSuperAdmin && (\n            <Link"
    return s.replace(marker, btn + marker, 1)
rw(root + '/app/admin/components/AdminHeader.tsx', header)

# --- Superadmin panel: preset customer ---
def panel(s):
    if 'presetCustomer' in s:
        return s
    s = s.replace("  onProductsCreated?: () => void;\n};", "  onProductsCreated?: () => void;\n  presetCustomer?: AdminCustomerSummary | null;\n};", 1)
    s = s.replace("export default function SuperadminPanel({ isOpen, onProductsCreated }: Props) {",
                  "export default function SuperadminPanel({ isOpen, onProductsCreated, presetCustomer }: Props) {", 1)
    eff = '''  useEffect(() => {
    if (!presetCustomer) return;
    setSuperTab('products');
    setSelectedCustomer(presetCustomer);
    setCustomerResults([]);
    setCustomerEmail(presetCustomer.email);
  }, [presetCustomer]);

'''
    marker = "  if (!isOpen) return null;"
    return s.replace(marker, eff + marker, 1)
rw(root + '/app/admin/components/SuperadminPanel.tsx', panel)

# --- Page client ---
def page(s):
    if 'CreateCustomerDialog' in s:
        return s
    s = s.replace("import SuperadminPanel from './components/SuperadminPanel';",
                  "import SuperadminPanel from './components/SuperadminPanel';\nimport CreateCustomerDialog from './components/CreateCustomerDialog';", 1)
    s = s.replace("import { AdminAuthInfo, AdminPermissions,", "import { AdminAuthInfo, AdminCustomerSummary, AdminPermissions,", 1)
    s = s.replace("  const [showSuperControls, setShowSuperControls] = useState(false);",
                  "  const [showSuperControls, setShowSuperControls] = useState(false);\n  const [createCustomerOpen, setCreateCustomerOpen] = useState(false);\n  const [presetCustomer, setPresetCustomer] = useState<AdminCustomerSummary | null>(null);", 1)
    s = s.replace("          onRefresh={refreshProducts}\n          shownCount",
                  "          onCreateCustomer={() => setCreateCustomerOpen(true)}\n          onRefresh={refreshProducts}\n          shownCount", 1)
    s = s.replace("          onProductsCreated={refreshProducts}\n        />",
                  "          onProductsCreated={refreshProducts}\n          presetCustomer={presetCustomer}\n        />\n\n        <CreateCustomerDialog\n          open={createCustomerOpen}\n          onClose={() => setCreateCustomerOpen(false)}\n          onCreateProduct={(customer) => {\n            setPresetCustomer(customer);\n            setShowSuperControls(true);\n            window.setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 50);\n          }}\n        />", 1)
    return s
rw(root + '/app/admin/AdminPageClient.tsx', page)
print('ok')
