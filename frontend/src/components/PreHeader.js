"use client";
import { useEffect, useState } from "react";

export const INDIAN_LANGUAGES = [
  { value: "en", label: "English", native: "English" },
  { value: "hi", label: "Hindi", native: "हिन्दी" },
  { value: "or", label: "Odia", native: "ଓଡ଼ିଆ" },
  { value: "bn", label: "Bengali", native: "বাংলা" },
  { value: "te", label: "Telugu", native: "తెలుగు" },
  { value: "mr", label: "Marathi", native: "मराठी" },
  { value: "ta", label: "Tamil", native: "தமிழ்" },
  { value: "gu", label: "Gujarati", native: "ગુજરાતી" },
  { value: "kn", label: "Kannada", native: "ಕನ್ನಡ" },
  { value: "ml", label: "Malayalam", native: "മലയാളം" },
  { value: "pa", label: "Punjabi", native: "ਪੰਜਾਬੀ" },
  { value: "as", label: "Assamese", native: "অসমীয়া" },
  { value: "ur", label: "Urdu", native: "اردو" },
  { value: "sa", label: "Sanskrit", native: "संस्कृतम्" },
  { value: "ne", label: "Nepali", native: "नेपाली" },
  { value: "sd", label: "Sindhi", native: "سنڌي" },
  { value: "ks", label: "Kashmiri", native: "کٲشُر" },
  { value: "mai", label: "Maithili", native: "मैथिली" },
  { value: "sat", label: "Santali", native: "संथाली" },
  { value: "brx", label: "Bodo", native: "बड़ो" },
  { value: "doi", label: "Dogri", native: "डोगरी" },
];

const EN_LABELS = {
  en: "English",
  hi: "Hindi",
  or: "Odia",
  bn: "Bengali",
  te: "Telugu",
  mr: "Marathi",
  ta: "Tamil",
  gu: "Gujarati",
  kn: "Kannada",
  ml: "Malayalam",
  pa: "Punjabi",
  as: "Assamese",
  ur: "Urdu",
  sa: "Sanskrit",
  ne: "Nepali",
  sd: "Sindhi",
  ks: "Kashmiri",
  mai: "Maithili",
  sat: "Santali",
  brx: "Bodo",
  doi: "Dogri",
};

export default function PreHeader({ included = "en,as,bn,gu,hi,kn,ml,mr,ne,or,pa,sa,sd,ta,te,ur,ks,mai,brx,sat,doi" }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [langs, setLangs] = useState(INDIAN_LANGUAGES);
  const [currentCode, setCurrentCode] = useState("en");

  // Load saved language code on mount from cookie or localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem("lang");
      if (saved) {
        setCurrentCode(saved);
      } else {
        const m = document.cookie.match(/googtrans=\/en\/([a-zA-Z_-]+)/);
        if (m && m[1]) setCurrentCode(m[1]);
      }
    } catch (_) {}
  }, []);

  useEffect(() => {
    const initTranslate = () => {
      if (window.google?.translate?.TranslateElement) {
        try {
          const existing = document.querySelector('.translateHost .goog-te-combo');
          if (!existing) {
            new window.google.translate.TranslateElement(
              { pageLanguage: "en", includedLanguages: included, autoDisplay: false },
              "google_element"
            );
          }
        } catch (_) {}
      }
    };

    if (window.google?.translate) {
      initTranslate();
    } else {
      window.__gr_loadGoogleTranslate = function () {
        initTranslate();
      };
      if (!document.getElementById("google-translate-script")) {
        const script = document.createElement("script");
        script.id = "google-translate-script";
        script.src = "https://translate.google.com/translate_a/element.js?cb=__gr_loadGoogleTranslate";
        document.body.appendChild(script);
      }
    }

    const populateLangs = () => {
      const sel = document.querySelector('.translateHost .goog-te-combo');
      if (!sel) return false;
      const opts = Array.from(sel.options || [])
        .map(o => {
          const value = o.value;
          if (!value) return null;
          const match = INDIAN_LANGUAGES.find(il => il.value === value);
          const label = match ? match.label : (EN_LABELS[value] || o.textContent || value.toUpperCase());
          const native = match ? match.native : label;
          return { value, label, native };
        })
        .filter(Boolean);

      // Only merge if Google loaded more than 3 options (prevent placeholder from wiping list)
      if (opts.length > 3) {
        const merged = [...opts];
        INDIAN_LANGUAGES.forEach(il => {
          if (!merged.find(m => m.value === il.value)) {
            merged.push(il);
          }
        });
        setLangs(merged);
      }
      if (sel.value) {
        setCurrentCode(sel.value);
      }
      return opts.length > 3;
    };

    let tries = 0;
    const t = setInterval(() => {
      if (populateLangs() || tries++ > 20) clearInterval(t);
    }, 500);

    // On mobile, aggressively remove Google's green overlay menu iframe if it appears
    if (window.matchMedia && window.matchMedia('(max-width: 640px)').matches) {
      const mo = new MutationObserver(() => {
        const frame = document.querySelector('iframe.goog-te-menu-frame');
        if (frame && frame.parentNode && frame.isConnected) {
          try {
            frame.parentNode.removeChild(frame);
          } catch (_) {}
        }
      });
      mo.observe(document.body, { childList: true, subtree: true });
      window.addEventListener('beforeunload', () => mo.disconnect());
    }

    return () => clearInterval(t);
  }, [included]);

  // Aggressively hide Google top banner if it appears after a language is selected
  useEffect(() => {
    const hideBanner = () => {
      const iframe = document.querySelector('iframe.goog-te-banner-frame');
      if (iframe) {
        iframe.style.display = 'none';
        try {
          if (iframe.parentNode && iframe.isConnected) iframe.parentNode.removeChild(iframe);
        } catch (_) {}
      }
      const banner = document.querySelector('.goog-te-banner-frame');
      if (banner) {
        banner.style.display = 'none';
        try {
          if (banner.parentNode && banner.isConnected) banner.parentNode.removeChild(banner);
        } catch (_) {}
      }
      const tt = document.getElementById('goog-gt-tt');
      if (tt) {
        tt.style.display = 'none';
        try {
          if (tt.parentNode && tt.isConnected) tt.parentNode.removeChild(tt);
        } catch (_) {}
      }
      document.documentElement.style.top = '0px';
      document.body.style.top = '0px';
    };
    hideBanner();
    const mo = new MutationObserver(() => hideBanner());
    mo.observe(document.documentElement, { childList: true, subtree: true });
    return () => mo.disconnect();
  }, []);

  const selectLanguage = (value) => {
    setCurrentCode(value);
    setMobileOpen(false);

    const sel = document.querySelector('.translateHost .goog-te-combo');
    if (sel) {
      sel.value = value;
      sel.dispatchEvent(new Event('change'));
    }

    try {
      const hostname = window.location.hostname;
      document.cookie = `googtrans=/en/${value}; path=/;`;
      document.cookie = `googtrans=/en/${value}; path=/; domain=${hostname};`;
      if (hostname.includes('.') && !hostname.startsWith('localhost') && !/^\d+\.\d+\.\d+\.\d+$/.test(hostname)) {
        const parts = hostname.split('.');
        if (parts.length >= 2) {
          const rootDomain = '.' + parts.slice(-2).join('.');
          document.cookie = `googtrans=/en/${value}; path=/; domain=${rootDomain};`;
        }
      }
      localStorage.setItem("googtrans", `/en/${value}`);
      localStorage.setItem("lang", value);
      window.dispatchEvent(new CustomEvent("language:change", { detail: value }));
    } catch (_) {}

    if (!sel || !sel.value) {
      setTimeout(() => {
        window.location.reload();
      }, 100);
    }
  };

  return (
    <div className="translateHost inline-flex items-center">
      <div id="google_element" className="text-sm" />

      {/* Mobile custom trigger button */}
      <button
        type="button"
        aria-label="Change language"
        className="mobile-globe-btn sm:hidden"
        onClick={() => setMobileOpen(v => !v)}
      >
        <span>🌐</span>
      </button>

      {mobileOpen && (
        <>
          <div className="mobile-lang-overlay sm:hidden" onClick={() => setMobileOpen(false)} />
          <div className="mobile-lang-menu notranslate sm:hidden" translate="no" data-no-translate="true">
            <div className="mobile-lang-header notranslate" translate="no">
              <span className="mobile-lang-title notranslate" translate="no">
                <span>🌐</span> Languages ({langs.length})
              </span>
              <button
                type="button"
                className="mobile-lang-close"
                onClick={() => setMobileOpen(false)}
                aria-label="Close"
              >
                ✕
              </button>
            </div>
            <div className="mobile-lang-list notranslate" translate="no">
              {langs.map((l) => {
                const isSelected = currentCode === l.value;
                return (
                  <button
                    key={l.value}
                    type="button"
                    className={`mobile-lang-item notranslate ${isSelected ? "selected" : ""}`}
                    translate="no"
                    onClick={() => selectLanguage(l.value)}
                  >
                    <span className="mobile-lang-name">{l.label}</span>
                    <span className="mobile-lang-native">{l.native && l.native !== l.label ? l.native : ""}</span>
                    {isSelected && <span className="mobile-lang-check">✓</span>}
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}

      <style jsx global>{`
        /* Keep banner hidden to avoid layout shift */
        iframe.goog-te-banner-frame { display: none !important; visibility: hidden !important; height: 0 !important; }
        .goog-te-banner-frame { display: none !important; visibility: hidden !important; height: 0 !important; }
        body { top: 0 !important; }
        html { top: 0 !important; }

        .translateHost .goog-te-gadget { font-size: 0; line-height: 0; margin: 0; }
        .translateHost .goog-te-gadget > span { display: none; }
        .goog-te-spinner-pos, .goog-te-spinner-animation { display: none !important; }
        .translateHost .goog-te-combo {
          font-size: 13px !important;
          line-height: 1 !important;
          padding: 6px 10px !important;
          border-radius: 8px !important;
          border: 1px solid var(--border, #d1d5db) !important;
          min-width: 160px;
          outline: none !important;
          background: var(--input-background, #f3f4f6);
          color: var(--foreground, #111827);
        }
        .translateHost { position: relative; display: inline-block; }
        .translateHost .goog-te-combo {
          padding-left: 34px !important;
          color: var(--foreground, #111827) !important;
          text-shadow: none !important;
        }

        /* On mobile screens, compact globe trigger and smaller modern popup */
        @media (max-width: 640px) {
          .translateHost {
            position: absolute;
            right: 8px;
            top: 8px;
            width: 36px;
            height: 32px;
            z-index: 10;
            display: inline-block;
          }
          .translateHost::before { display: none; }
          .mobile-globe-btn {
            position: absolute;
            right: 0;
            top: 0;
            width: 36px;
            height: 32px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            font-size: 15px;
            line-height: 1;
            border: 1px solid var(--border, #d1d5db);
            border-radius: 8px;
            background: var(--input-background, #f3f4f6);
            color: var(--foreground, #111827);
          }
          .translateHost .goog-te-combo {
            min-width: 36px !important;
            width: 36px !important;
            max-width: 36px !important;
            padding-left: 24px !important;
            color: transparent !important;
            background: var(--input-background, #f3f4f6) !important;
            opacity: 0;
            pointer-events: none;
          }
          .goog-te-menu-frame, .goog-te-menu2 { display: none !important; }

          /* Mobile compact menu */
          .mobile-lang-overlay {
            position: fixed;
            inset: 0;
            background: rgba(0, 0, 0, 0.25);
            z-index: 9998;
            backdrop-filter: blur(1px);
          }
          .mobile-lang-menu {
            position: fixed;
            right: 8px;
            top: 48px;
            width: 190px;
            max-width: calc(100vw - 20px);
            background: #ffffff;
            color: #0f172a;
            border: 1px solid #e2e8f0;
            border-radius: 12px;
            z-index: 9999;
            box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.18), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
            overflow: hidden;
            animation: mobileLangPop 0.15s cubic-bezier(0.16, 1, 0.3, 1);
            transform-origin: top right;
          }
          @keyframes mobileLangPop {
            from { opacity: 0; transform: scale(0.92); }
            to { opacity: 1; transform: scale(1); }
          }
          .mobile-lang-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 6px 10px;
            background: #f8fafc;
            border-bottom: 1px solid #e2e8f0;
          }
          .mobile-lang-title {
            font-size: 11px;
            font-weight: 700;
            color: #475569;
            display: flex;
            align-items: center;
            gap: 4px;
          }
          .mobile-lang-close {
            background: transparent;
            border: none;
            font-size: 11px;
            color: #94a3b8;
            padding: 2px 4px;
            cursor: pointer;
            line-height: 1;
          }
          .mobile-lang-list {
            max-height: 220px;
            overflow-y: auto;
            padding: 3px;
            overscroll-behavior: contain;
          }
          .mobile-lang-list::-webkit-scrollbar {
            width: 3px;
          }
          .mobile-lang-list::-webkit-scrollbar-thumb {
            background: #cbd5e1;
            border-radius: 3px;
          }
          .mobile-lang-item {
            width: 100%;
            text-align: left;
            padding: 5px 8px;
            margin: 1px 0;
            border-radius: 6px;
            border: none;
            background: transparent;
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 4px;
            cursor: pointer;
            font-size: 12px;
            color: #1e293b;
            transition: background 0.12s ease;
          }
          .mobile-lang-item:hover, .mobile-lang-item:active {
            background: #f1f5f9;
          }
          .mobile-lang-item.selected {
            background: #eff6ff;
            color: #4f46e5;
            font-weight: 700;
          }
          .mobile-lang-name {
            font-weight: 600;
            font-size: 11.5px;
            flex: 1;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }
          .mobile-lang-native {
            font-size: 10.5px;
            opacity: 0.6;
            white-space: nowrap;
          }
          .mobile-lang-check {
            font-size: 11px;
            font-weight: 800;
            color: #4f46e5;
            margin-left: 2px;
          }

          :root.dark .mobile-lang-menu {
            background: #0f172a;
            color: #f8fafc;
            border-color: #334155;
            box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.5);
          }
          :root.dark .mobile-lang-header {
            background: #1e293b;
            border-bottom-color: #334155;
          }
          :root.dark .mobile-lang-title {
            color: #94a3b8;
          }
          :root.dark .mobile-lang-list::-webkit-scrollbar-thumb {
            background: #475569;
          }
          :root.dark .mobile-lang-item {
            color: #f1f5f9;
          }
          :root.dark .mobile-lang-item:hover, :root.dark .mobile-lang-item:active {
            background: #1e293b;
          }
          :root.dark .mobile-lang-item.selected {
            background: #1e1b4b;
            color: #818cf8;
          }
          :root.dark .mobile-lang-check {
            color: #818cf8;
          }
        }

        :root.dark .translateHost .goog-te-combo {
          background: #0b0b0b;
          color: #f8fafc;
          border-color: #262626 !important;
        }
      `}</style>
    </div>
  );
}
