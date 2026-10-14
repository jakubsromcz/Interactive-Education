/**
 * Dočasné ukládání postupu cvičení (dokončené kroky) do sessionStorage.
 * Platí jen v aktuální relaci prohlížeče – po zavření prohlížeče / vypnutí PC zmizí.
 * Neukládá odpovědi ani stav uvnitř kroků – jen čísla hotových kroků.
 * Na home se progress nezobrazuje.
 */
(function (global) {
  const KEY = "inf-zskanice-progress-v1";

  function storage() {
    try {
      return sessionStorage;
    } catch (_) {
      return null;
    }
  }

  function read() {
    try {
      const s = storage();
      if (!s) return {};
      const raw = s.getItem(KEY);
      if (!raw) return {};
      const data = JSON.parse(raw);
      return data && typeof data === "object" ? data : {};
    } catch (_) {
      return {};
    }
  }

  function write(data) {
    try {
      const s = storage();
      if (!s) return;
      s.setItem(KEY, JSON.stringify(data));
    } catch (_) {
      /* private mode / quota */
    }
  }

  function normalize(entry) {
    const steps = Array.isArray(entry && entry.steps)
      ? entry.steps.map(Number).filter((n) => n >= 1)
      : [];
    const uniq = [...new Set(steps)].sort((a, b) => a - b);
    const total = Number((entry && entry.total) || 0) || 0;
    return { steps: uniq, total };
  }

  const InfProgress = {
    getAll() {
      return read();
    },

    get(id) {
      return normalize(read()[id]);
    },

    /** Označí krok jako dokončený (1-based). */
    completeStep(id, step, total) {
      if (!id) return normalize(null);
      const all = read();
      const cur = normalize(all[id]);
      if (total) cur.total = Number(total);
      const n = Number(step);
      if (n >= 1 && !cur.steps.includes(n)) cur.steps.push(n);
      cur.steps.sort((a, b) => a - b);
      all[id] = cur;
      write(all);
      return cur;
    },

    /** Označí kroky 1..count jako hotové. */
    setCompletedCount(id, count, total) {
      if (!id) return normalize(null);
      const all = read();
      const cur = normalize(all[id]);
      if (total) cur.total = Number(total);
      const n = Math.max(0, Math.min(Number(count) || 0, cur.total || Number(total) || count));
      cur.steps = [];
      for (let i = 1; i <= n; i++) cur.steps.push(i);
      all[id] = cur;
      write(all);
      return cur;
    },

    completedCount(id) {
      return this.get(id).steps.length;
    },

    isFullyDone(id, total) {
      const cur = this.get(id);
      const t = Number(total || cur.total || 0);
      return t > 0 && cur.steps.length >= t;
    },

    /** První nedokončený krok, nebo `total` když je vše hotové. */
    nextStep(id, total) {
      const cur = this.get(id);
      const t = Number(total || cur.total || 0);
      for (let i = 1; i <= t; i++) {
        if (!cur.steps.includes(i)) return i;
      }
      return t || 1;
    },

    reset(id) {
      const all = read();
      if (id) delete all[id];
      else Object.keys(all).forEach((k) => delete all[k]);
      write(all);
    },
  };

  // Starší trvalé uložení už nepoužíváme
  try {
    localStorage.removeItem(KEY);
  } catch (_) {
    /* ignore */
  }

  global.InfProgress = InfProgress;
})(typeof window !== "undefined" ? window : globalThis);
