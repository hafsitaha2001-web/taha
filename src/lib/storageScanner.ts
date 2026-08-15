// Scan all localStorage keys for any stored arrays or objects from previous sessions
export function scanAndRecoverAllLocalStorage() {
  if (typeof window === 'undefined') return {};
  const recovered: {
    documents?: any[];
    clients?: any[];
    expenses?: any[];
    directRevenues?: any[];
    profile?: any;
  } = {};

  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key) continue;
      const rawVal = localStorage.getItem(key);
      if (!rawVal) continue;

      try {
        const parsed = JSON.parse(rawVal);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Check if documents
          if (parsed.some((item) => item && (item.type === 'DEVIS' || item.type === 'FACTURE' || item.number || item.items))) {
            recovered.documents = [...(recovered.documents || []), ...parsed];
          }
          // Check if direct revenues
          else if (parsed.some((item) => item && (item.amountMAD !== undefined || item.frequency || item.category))) {
            recovered.directRevenues = [...(recovered.directRevenues || []), ...parsed];
          }
          // Check if clients
          else if (parsed.some((item) => item && (item.company !== undefined || item.ice !== undefined || item.phone))) {
            recovered.clients = [...(recovered.clients || []), ...parsed];
          }
          // Check if expenses
          else if (parsed.some((item) => item && (item.category !== undefined && item.date && item.amount !== undefined))) {
            recovered.expenses = [...(recovered.expenses || []), ...parsed];
          }
        } else if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
          if (parsed.filmmakerName || parsed.ice === '003142194000066' || parsed.bankName) {
            recovered.profile = parsed;
          }
        }
      } catch {
        // Not JSON, continue
      }
    }
  } catch (e) {
    console.warn('Scan localStorage error:', e);
  }

  return recovered;
}
