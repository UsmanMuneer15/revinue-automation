"use client";

import {
  createContext,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { twMerge } from "tailwind-merge";

type Lang = "en" | "ar";
type Country = "AE" | "SA" | "KW" | "QA" | "BH" | "OM";
type Copy = { en: string; ar: string };

const GCC_MARKETS: {
  code: Country;
  flag: string;
  short: string;
  en: string;
  ar: string;
  currencyEn: string;
  currencyAr: string;
}[] = [
  { code: "AE", flag: "🇦🇪", short: "UAE", en: "United Arab Emirates", ar: "الإمارات", currencyEn: "AED", currencyAr: "د.إ" },
  { code: "SA", flag: "🇸🇦", short: "KSA", en: "Saudi Arabia", ar: "السعودية", currencyEn: "SAR", currencyAr: "ر.س" },
  { code: "KW", flag: "🇰🇼", short: "KWT", en: "Kuwait", ar: "الكويت", currencyEn: "KWD", currencyAr: "د.ك" },
  { code: "QA", flag: "🇶🇦", short: "QAT", en: "Qatar", ar: "قطر", currencyEn: "QAR", currencyAr: "ر.ق" },
  { code: "BH", flag: "🇧🇭", short: "BHR", en: "Bahrain", ar: "البحرين", currencyEn: "BHD", currencyAr: "د.ب" },
  { code: "OM", flag: "🇴🇲", short: "OMN", en: "Oman", ar: "عُمان", currencyEn: "OMR", currencyAr: "ر.ع" },
];

type Locale = {
  lang: Lang;
  country: Country;
  setLang: (lang: Lang) => void;
  setCountry: (country: Country) => void;
  t: (copy: Copy) => string;
  currency: string;
  money: (amount: number) => string;
  rtl: boolean;
};

const LocaleContext = createContext<Locale | null>(null);

function LocaleProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>("en");
  const [country, setCountry] = useState<Country>("AE");

  useEffect(() => {
    const root = document.documentElement;
    root.lang = lang;
    root.dir = lang === "ar" ? "rtl" : "ltr";
    return () => {
      root.dir = "ltr";
      root.lang = "en";
    };
  }, [lang]);

  const value = useMemo<Locale>(() => {
    const market = GCC_MARKETS.find((item) => item.code === country) ?? GCC_MARKETS[0];
    const currency = lang === "ar" ? market.currencyAr : market.currencyEn;
    return {
      lang,
      country,
      setLang,
      setCountry,
      t: (copy) => copy[lang],
      currency,
      money: (amount) => {
        const formatted = new Intl.NumberFormat(lang === "ar" ? "ar-AE" : "en-US").format(
          amount,
        );
        return lang === "ar" ? `${formatted} ${currency}` : `${currency} ${formatted}`;
      },
      rtl: lang === "ar",
    };
  }, [lang, country]);

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

function useLocale() {
  const locale = useContext(LocaleContext);
  if (!locale) throw Error("useLocale must be used inside LocaleProvider");
  return locale;
}

function cn(...classes: Array<string | false | null | undefined>) {
  return twMerge(classes.filter(Boolean).join(" "));
}

function Section({
  id,
  children,
  className,
  tone = "light",
}: {
  id?: string;
  children: ReactNode;
  className?: string;
  tone?: "light" | "sand" | "dark";
}) {
  return (
    <section
      id={id}
      className={cn(
        "w-full overflow-x-clip px-5 py-20 md:px-10 md:py-28",
        tone === "dark" && "bg-ink text-ink-foreground",
        tone === "sand" && "bg-sand text-foreground",
        className,
      )}
    >
      <div className="mx-auto w-full max-w-6xl">{children}</div>
    </section>
  );
}

function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <p className="mb-5 text-[0.72rem] font-semibold uppercase tracking-[0.22em] opacity-80">
      {children}
    </p>
  );
}

function SectionHeading({
  children,
  className,
  as: Tag = "h2",
}: {
  children: ReactNode;
  className?: string;
  as?: "h2" | "h3";
}) {
  const ref = useRef<HTMLHeadingElement>(null);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    let running = false;
    let queued = false;
    const fit = () => {
      if (running) {
        queued = true;
        return;
      }
      running = true;
      const max = 42;
      const floor = 15;
      const lines = el.querySelectorAll<HTMLElement>(".line");
      const section = el.closest("section");
      const pad = section ? getComputedStyle(section) : null;
      const sectionWidth = section
        ? section.clientWidth -
          parseFloat(pad?.paddingLeft || "0") -
          parseFloat(pad?.paddingRight || "0")
        : 0;
      const parentWidth = el.parentElement?.clientWidth ?? 0;
      const available = Math.min(
        ...[sectionWidth, parentWidth, 1152].filter((n) => n > 0),
      );
      el.style.whiteSpace = "nowrap";
      lines.forEach((node) => {
        node.style.whiteSpace = "nowrap";
      });
      el.style.fontSize = `${max}px`;
      const widest = el.scrollWidth;
      const fitted =
        !available || widest <= available + 1
          ? max
          : ((max * available) / widest) * 0.98;
      if (fitted < floor) {
        el.style.fontSize = `${floor}px`;
        el.style.whiteSpace = "normal";
        lines.forEach((node) => {
          node.style.whiteSpace = "normal";
        });
      } else {
        el.style.fontSize = `${fitted}px`;
        el.style.whiteSpace = "nowrap";
        lines.forEach((node) => {
          node.style.whiteSpace = "nowrap";
        });
      }
      running = false;
      if (queued) {
        queued = false;
        fit();
      }
    };
    fit();
    const parent = el.parentElement;
    const ro = new ResizeObserver(fit);
    if (parent) ro.observe(parent);
    return () => ro.disconnect();
  });
  return (
    <Tag
      ref={ref}
      className={cn(
        "w-full font-display font-bold leading-[1.16] tracking-[-0.03em] whitespace-nowrap [&_.line]:block [&_.line]:whitespace-nowrap",
        className,
      )}
    >
      {children}
    </Tag>
  );
}

function SectionText({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <p
      className={cn(
        "mt-5 max-w-3xl text-base leading-relaxed opacity-90 md:text-lg",
        className,
      )}
    >
      {children}
    </p>
  );
}

function Card({
  children,
  className,
  tone = "light",
}: {
  children: ReactNode;
  className?: string;
  tone?: "light" | "dark";
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border p-6 transition-colors",
        tone === "dark"
          ? "border-white/10 bg-white/[0.04] hover:border-white/25"
          : "border-border bg-card hover:border-foreground/25",
        className,
      )}
    >
      {children}
    </div>
  );
}

function Bullet({ children }: { children: ReactNode }) {
  return (
    <li className="flex items-start gap-3 text-sm leading-relaxed">
      <span className="mt-[0.35rem] inline-block size-1.5 shrink-0 rounded-full bg-accent-strong" />
      <span className="opacity-85">{children}</span>
    </li>
  );
}

function CtaLink({
  children,
  variant = "primary",
  href = "#audit",
  className,
}: {
  children: ReactNode;
  variant?: "primary" | "ghost" | "light";
  href?: string;
  className?: string;
}) {
  return (
    <a
      href={href}
      className={cn(
        "inline-flex items-center justify-center rounded-full px-6 py-3.5 text-sm font-semibold tracking-tight transition-all duration-200 hover:-translate-y-0.5",
        variant === "primary" &&
          "bg-foreground text-background hover:bg-foreground/90",
        variant === "ghost" &&
          "border border-current/25 bg-transparent hover:bg-foreground/[0.06]",
        variant === "light" && "bg-background text-foreground hover:bg-background/90",
        className,
      )}
    >
      {children}
    </a>
  );
}
const NAV_LINKS = [
  {
    id: "product",
    en: "Product",
    ar: "المنتج",
  },
  {
    id: "how",
    en: "How It Works",
    ar: "طريقة العمل",
  },
  {
    id: "features",
    en: "Features",
    ar: "المزايا",
  },
  {
    id: "solutions",
    en: "Solutions",
    ar: "القطاعات",
  },
  {
    id: "pricing",
    en: "Pricing",
    ar: "الأسعار",
  },
  {
    id: "faq",
    en: "FAQ",
    ar: "الأسئلة",
  },
];
function SiteHeader() {
  let { t: e, lang: t, setLang: n, country: a, setCountry: o } = useLocale(),
    [c, l] = useState(false),
    [u, d] = useState(false);
  useEffect(() => {
    let e = () => l(window.scrollY > 24);
    return (
      e(),
      window.addEventListener("scroll", e, {
        passive: true,
      }),
      () => window.removeEventListener("scroll", e)
    );
  }, []);
  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${c ? "border-b border-border bg-background/85 backdrop-blur-xl" : "border-b border-transparent"}`}
    >
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4 px-5 md:h-[4.5rem] md:px-10">
        <a href="#top" className="flex shrink-0 items-center gap-3">
          <img
            src="/spark-ai-mark.jpg?v=9"
            alt=""
            className="size-10 rounded-[13px] object-cover shadow-sm ring-1 ring-black/10"
          />
          <span className="font-display text-[1.05rem] font-semibold tracking-tight text-foreground">
            Spark AI Sales OS
          </span>
        </a>
        <nav className="hidden items-center gap-7 lg:flex">
          {NAV_LINKS.map((t) => (
            <a
              key={t.id}
              href={`#${t.id}`}
              className="text-[0.82rem] font-medium opacity-70 transition-opacity hover:opacity-100"
            >
              {e(t)}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <label className="hidden sm:block">
            <span className="sr-only">Country</span>
            <select
              value={a}
              onChange={(event) => o(event.target.value as Country)}
              className="rounded-full border border-border bg-card px-3 py-1.5 text-[0.72rem] font-semibold outline-none"
            >
              {GCC_MARKETS.map((market) => (
                <option key={market.code} value={market.code}>
                  {market.flag} {market.short} · {market.currencyEn}
                </option>
              ))}
            </select>
          </label>
          <button
            onClick={() => n(t === "en" ? "ar" : "en")}
            className="rounded-full border border-border px-3 py-1.5 text-[0.72rem] font-semibold transition-colors hover:bg-accent"
          >
            {t === "en" ? "العربية" : "EN"}
          </button>
          <CtaLink
            href="#audit"
            className="hidden px-4 py-2.5 text-[0.78rem] md:inline-flex"
          >
            {e({
              en: "Book a Demo",
              ar: "احجز عرضاً",
            })}
          </CtaLink>
          <button
            aria-label="Menu"
            onClick={() => d((e) => !e)}
            className="grid size-9 place-items-center rounded-full border border-border lg:hidden"
          >
            <span className="text-sm">{u ? "✕" : "☰"}</span>
          </button>
        </div>
      </div>
      {u && (
        <div className="border-t border-border bg-background px-5 py-4 lg:hidden">
          <div className="grid gap-1">
            {NAV_LINKS.map((t) => (
              <a
                key={t.id}
                href={`#${t.id}`}
                onClick={() => d(false)}
                className="rounded-lg px-2 py-2.5 text-sm font-medium hover:bg-accent"
              >
                {e(t)}
              </a>
            ))}
          </div>
          <label className="mt-3 block">
            <span className="sr-only">Country</span>
            <select
              value={a}
              onChange={(event) => o(event.target.value as Country)}
              className="w-full rounded-full border border-border bg-card px-3 py-2 text-xs font-semibold outline-none"
            >
              {GCC_MARKETS.map((market) => (
                <option key={market.code} value={market.code}>
                  {market.flag} {market.short} · {market.currencyEn}
                </option>
              ))}
            </select>
          </label>
        </div>
      )}
    </header>
  );
}
const LEAD_SOURCES = [
    {
      en: "Meta Ads",
      ar: "إعلانات ميتا",
    },
    {
      en: "Google Ads",
      ar: "إعلانات جوجل",
    },
    {
      en: "Instagram",
      ar: "إنستغرام",
    },
    {
      en: "WhatsApp",
      ar: "واتساب",
    },
    {
      en: "Website",
      ar: "الموقع الإلكتروني",
    },
    {
      en: "Landing Pages",
      ar: "الصفحات المقصودة",
    },
    {
      en: "Forms",
      ar: "النماذج",
    },
    {
      en: "Calls",
      ar: "المكالمات",
    },
  ],
  FLOW_STEPS = [
    {
      en: "Instant Response",
      ar: "رد فوري",
    },
    {
      en: "AI Qualification",
      ar: "تأهيل بالذكاء الاصطناعي",
    },
    {
      en: "Automated Follow-Up",
      ar: "متابعة تلقائية",
    },
    {
      en: "Appointment Booked",
      ar: "حجز موعد",
    },
    {
      en: "Sales Pipeline",
      ar: "مسار المبيعات",
    },
    {
      en: "Customer Won",
      ar: "عميل مكتسب",
    },
  ];
function FlowDiagram() {
  let { t: e, rtl: t } = useLocale(),
    [n, a] = useState(0);
  useEffect(() => {
    let e = setInterval(() => a((e) => (e + 1) % FLOW_STEPS.length), 1400);
    return () => clearInterval(e);
  }, []);
  return (
    <div className="relative overflow-hidden rounded-3xl border border-border bg-card p-5 shadow-[0_30px_80px_-40px_rgba(0,0,0,0.35)] md:p-8">
      <div className="grid-lines pointer-events-none absolute inset-0 opacity-60" />
      <div className="relative grid gap-6 md:grid-cols-[1fr_auto_1fr] md:items-center md:gap-4">
        <div>
          <h3 className="mb-4 font-display text-xl font-bold tracking-tight">
            {e({
              en: "Lead Sources",
              ar: "مصادر العملاء المحتملين",
            })}
          </h3>
          <div className="grid grid-cols-2 gap-2">
            {LEAD_SOURCES.map((t, n) => (
              <div
                key={t.en}
                className="rounded-lg border border-border bg-background px-3 py-2 text-[0.72rem] font-medium"
                style={{
                  animation: `rise 0.5s ${n * 0.06}s both`,
                }}
              >
                {e(t)}
              </div>
            ))}
          </div>
        </div>
        <div className="flex flex-col items-center gap-2 py-2">
          <div
            className={`hidden text-2xl opacity-30 md:block ${t ? "rotate-180" : ""}`}
          >
            →
          </div>
          <div className="relative">
            <div className="absolute -inset-4 animate-pulse-soft rounded-full bg-accent-strong/25 blur-2xl" />
            <div className="relative rounded-2xl bg-ink px-6 py-5 text-center text-ink-foreground">
              <p className="font-display text-sm font-bold leading-tight">
                Sales OS
              </p>
              <p className="mt-1 text-[0.6rem] tracking-wide opacity-60">
                {e({
                  en: "Managed",
                  ar: "مُدار بالكامل",
                })}
              </p>
            </div>
          </div>
          <div
            className={`hidden text-2xl opacity-30 md:block ${t ? "rotate-180" : ""}`}
          >
            →
          </div>
        </div>
        <div className="grid gap-1.5">
          {FLOW_STEPS.map((t, r) => (
            <div
              key={t.en}
              className={`flex items-center gap-3 rounded-lg border px-3 py-2 text-[0.75rem] font-medium transition-all duration-500 ${n === r ? "border-accent-strong bg-accent text-accent-foreground" : "border-border bg-background opacity-70"}`}
            >
              <span
                className={`grid size-5 shrink-0 place-items-center rounded-full text-[0.55rem] font-bold transition-colors ${n >= r ? "bg-whatsapp text-ink" : "bg-muted text-muted-foreground"}`}
              >
                {r + 1}
              </span>
              {e(t)}
            </div>
          ))}
        </div>
      </div>
      <p className="relative mt-6 border-t border-border pt-5 text-center text-[0.8rem] opacity-85">
        {e({
          en: "From first click to closed customer — without leads disappearing between tools.",
          ar: "من أول نقرة حتى إتمام الصفقة — دون أن يضيع أي عميل محتمل بين الأدوات.",
        })}
      </p>
    </div>
  );
}
function Hero() {
  let { t: e } = useLocale();
  return (
    <section
      id="top"
      className="relative w-full px-5 pb-16 pt-28 md:px-10 md:pb-24 md:pt-36"
    >
      <div className="mx-auto w-full max-w-6xl">
        <div className="mx-auto max-w-3xl text-center">
          <p className="mb-6 inline-flex rounded-full border border-border bg-card px-3.5 py-1.5 text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-foreground/80">
            {e({
              en: "For GCC Businesses",
              ar: "لشركات دول الخليج",
            })}
          </p>
          <h1 className="font-display text-[2.4rem] font-bold leading-[1.03] tracking-[-0.035em] md:text-[4.2rem]">
            {e({
              en: "Your Leads Are Coming In.",
              ar: "العملاء المحتملون يصلون إليك بالفعل.",
            })}
            <br />
            <span className="text-foreground/75">
              {e({
                en: "Your Follow-Up System Is Letting Them Down.",
                ar: "لكن نظام المتابعة لديك لا يستفيد منهم بالشكل الكافي.",
              })}
            </span>
          </h1>
          <p className="mx-auto mt-7 max-w-2xl text-base leading-relaxed text-foreground/90 md:text-lg">
            {e({
              en: "Connect your website, ads, WhatsApp, Instagram, forms and sales team into one AI-powered revenue system that responds to leads, follows up automatically, books appointments and shows you exactly what's happening across your pipeline.",
              ar: "اربط موقعك الإلكتروني، إعلاناتك، واتساب، إنستغرام وفريق المبيعات في نظام واحد مدعوم بالذكاء الاصطناعي — للرد على العملاء، متابعتهم، تأهيلهم وحجز المواعيد تلقائياً.",
            })}
          </p>
          <p className="mt-6 font-display text-lg font-bold tracking-tight md:text-2xl">
            {e({
              en: "Every lead. Every conversation. Every follow-up. One system.",
              ar: "كل عميل محتمل. كل محادثة. كل متابعة. في نظام واحد.",
            })}
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <CtaLink href="#product">
              {e({
                en: "See Sales OS in Action",
                ar: "شاهد نظام المبيعات أثناء العمل",
              })}
            </CtaLink>
            <CtaLink href="#audit" variant="ghost">
              {e({
                en: "Book a 20-Minute Demo",
                ar: "احجز عرضاً توضيحياً",
              })}
            </CtaLink>
          </div>
          <div className="mt-7 flex flex-wrap justify-center gap-x-6 gap-y-2 text-[0.78rem] text-foreground/85">
            {[
              {
                en: "Fully managed",
                ar: "إدارة كاملة للنظام",
              },
              {
                en: "WhatsApp-first",
                ar: "مصمم لواتساب",
              },
              {
                en: "English + Arabic",
                ar: "العربية والإنجليزية",
              },
              {
                en: "Built for GCC Businesses",
                ar: "مصمم لشركات الخليج",
              },
            ].map((t) => (
              <span key={t.en}>✓ {e(t)}</span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
const BROKEN_JOURNEY = [
    {
      a: {
        en: "Meta Ads",
        ar: "إعلانات ميتا",
      },
      b: {
        en: "Spreadsheet",
        ar: "ملف إكسل",
      },
    },
    {
      a: {
        en: "Website",
        ar: "الموقع",
      },
      b: {
        en: "Email inbox",
        ar: "بريد إلكتروني",
      },
    },
    {
      a: {
        en: "Instagram",
        ar: "إنستغرام",
      },
      b: {
        en: "DMs",
        ar: "الرسائل الخاصة",
      },
    },
    {
      a: {
        en: "WhatsApp",
        ar: "واتساب",
      },
      b: {
        en: "Salesperson's phone",
        ar: "هاتف الموظف",
      },
    },
    {
      a: {
        en: "Google Ads",
        ar: "إعلانات جوجل",
      },
      b: {
        en: "Form notification",
        ar: "إشعار نموذج",
      },
    },
    {
      a: {
        en: "Calls",
        ar: "المكالمات",
      },
      b: {
        en: "Somewhere else",
        ar: "مكان آخر",
      },
    },
    {
      a: {
        en: "CRM",
        ar: "نظام العملاء",
      },
      b: {
        en: "Barely updated",
        ar: "نادراً ما يُحدَّث",
      },
    },
  ],
  $e = [
    {
      t: {
        en: "Slow Lead Response",
        ar: "بطء الرد على العملاء",
      },
      b: {
        en: "A prospect submits an enquiry. Your team responds 45 minutes later. They've already contacted three competitors.",
        ar: "يرسل العميل استفساره، ويرد فريقك بعد ٤٥ دقيقة. في هذا الوقت تواصل مع ثلاثة منافسين.",
      },
    },
    {
      t: {
        en: "Inconsistent Follow-Up",
        ar: "متابعة غير منتظمة",
      },
      b: {
        en: "Salespeople naturally focus on today's hottest opportunities. Yesterday's leads quietly disappear.",
        ar: "يركّز فريق المبيعات على الفرص الأقرب للإغلاق، بينما تختفي عملاء الأمس بهدوء.",
      },
    },
    {
      t: {
        en: "Fragmented Conversations",
        ar: "محادثات مبعثرة",
      },
      b: {
        en: "WhatsApp is here. Instagram is there. Email somewhere else. Nobody sees the complete customer journey.",
        ar: "واتساب هنا، إنستغرام هناك، والبريد في مكان آخر. لا أحد يرى رحلة العميل كاملة.",
      },
    },
    {
      t: {
        en: "Wasted Marketing Spend",
        ar: "إنفاق تسويقي مهدور",
      },
      b: {
        en: "You're paying Meta and Google for leads that never receive a proper nurturing sequence.",
        ar: "تدفع لميتا وجوجل مقابل عملاء لا يحصلون على أي تسلسل متابعة حقيقي.",
      },
    },
    {
      t: {
        en: "No Sales Visibility",
        ar: "غياب الوضوح في المبيعات",
      },
      b: {
        en: "Management knows how many leads marketing generated. But not who responded, who followed up, which source converted, or where deals get stuck.",
        ar: "تعرف الإدارة عدد العملاء المحتملين فقط، لا من ردّ، ولا من تابع، ولا أي مصدر حقق مبيعات، ولا أين تتعطل الصفقات.",
      },
    },
    {
      t: {
        en: "Manual Sales Administration",
        ar: "أعمال إدارية يدوية",
      },
      b: {
        en: "Your team spends hours updating records, sending reminders, chasing prospects and scheduling appointments. Work that software should be doing.",
        ar: "يقضي فريقك ساعات في تحديث السجلات وإرسال التذكيرات وملاحقة العملاء وحجز المواعيد — وهي مهام يفترض أن يؤديها النظام.",
      },
    },
  ];
function ProblemSection() {
  let { t: e } = useLocale();
  return (
    <Section tone="sand">
      <SectionHeading>
        <span className="line">
          {e({
            en: "Most Businesses Don't Have a Lead Problem.",
            ar: "معظم الشركات لا تعاني من نقص العملاء المحتملين.",
          })}
        </span>
        <span className="line text-foreground/75">
          {e({
            en: "They Have a Revenue Infrastructure Problem.",
            ar: "بل من ضعف البنية التحتية للإيرادات.",
          })}
        </span>
      </SectionHeading>
      <SectionText>
        {e({
          en: "You're already paying to generate attention. But what happens after someone clicks?",
          ar: "أنت تدفع بالفعل لجذب الانتباه. لكن ماذا يحدث بعد أن ينقر العميل؟",
        })}
      </SectionText>
      <div className="mt-10 grid gap-3 md:grid-cols-2">
        {BROKEN_JOURNEY.map((t) => (
          <div
            key={t.a.en}
            className="flex items-center gap-3 rounded-2xl border border-border bg-card px-4 py-4 text-sm shadow-[0_12px_30px_-24px_rgba(0,0,0,0.45)]"
          >
            <span className="rounded-full bg-sand px-3 py-1.5 text-[0.75rem] font-semibold">
              {e(t.a)}
            </span>
            <span className="text-accent-strong">→</span>
            <span className="text-foreground/80">{e(t.b)}</span>
          </div>
        ))}
      </div>
      <SectionHeading as="h3" className="mt-12">
        {e({
          en: "Your customer journey is scattered across tools, tabs, inboxes and people.",
          ar: "رحلة عميلك موزعة بين أدوات ونوافذ وصناديق بريد وأشخاص.",
        })}
      </SectionHeading>
      <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {$e.map((t, index) => (
          <Card key={t.t.en} className="relative overflow-hidden">
            <span className="mb-4 grid size-9 place-items-center rounded-xl bg-sand font-display text-sm font-bold text-accent-strong">
              {String(index + 1).padStart(2, "0")}
            </span>
            <h3 className="font-display text-lg font-bold tracking-tight">
              {e(t.t)}
            </h3>
            <p className="mt-2.5 text-sm leading-relaxed text-foreground/85">{e(t.b)}</p>
          </Card>
        ))}
      </div>
      <div className="mt-12 rounded-2xl border border-foreground/15 bg-background p-8 md:p-12">
        <p className="font-display text-2xl font-bold leading-tight tracking-tight md:text-4xl">
          {e({
            en: "You don't necessarily need more leads. You need a better system for converting the leads you already have.",
            ar: "لست بحاجة دائماً إلى عملاء أكثر. أنت بحاجة إلى نظام أفضل لتحويل العملاء الذين لديك.",
          })}
        </p>
        <CtaLink className="mt-8">
          {e({
            en: "Fix My Lead Conversion System",
            ar: "أصلح نظام تحويل العملاء لدي",
          })}
        </CtaLink>
      </div>
    </Section>
  );
}
const CAPTURE_CHANNELS = [
  {
    en: "Capture",
    ar: "الالتقاط",
  },
  {
    en: "Respond",
    ar: "الرد",
  },
  {
    en: "Qualify",
    ar: "التأهيل",
  },
  {
    en: "Nurture",
    ar: "الرعاية",
  },
  {
    en: "Book",
    ar: "الحجز",
  },
  {
    en: "Close",
    ar: "الإغلاق",
  },
  {
    en: "Retain",
    ar: "الاحتفاظ",
  },
];
function ProductSection() {
  let { t: e, rtl: t } = useLocale();
  return (
    <Section id="product">
      <Eyebrow>
        {e({
          en: "Introducing",
          ar: "نقدّم لكم",
        })}
      </Eyebrow>
      <SectionHeading>Sales OS</SectionHeading>
      <p className="mt-4 font-display text-xl font-semibold tracking-tight opacity-90 md:text-2xl">
        {e({
          en: "One connected system between your marketing and your revenue.",
          ar: "نظام واحد يربط بين تسويقك وإيراداتك.",
        })}
      </p>
      <SectionText>
        {e({
          en: "We connect your existing digital assets — website, landing pages, Meta campaigns, Google Ads, WhatsApp, Instagram and sales channels — into one intelligent customer engagement infrastructure. Then we automate what happens next.",
          ar: "نربط أصولك الرقمية الحالية — الموقع، الصفحات المقصودة، حملات ميتا وجوجل، واتساب، إنستغرام وقنوات المبيعات — في بنية واحدة ذكية للتفاعل مع العملاء، ثم نُؤتمت ما يحدث بعد ذلك.",
        })}
      </SectionText>
      <div className="mt-12 flex flex-wrap items-center gap-2 rounded-2xl border border-border bg-card p-4 md:gap-1 md:p-6">
        {CAPTURE_CHANNELS.map((n, r) => (
          <div key={n.en} className="flex items-center gap-2 md:flex-1">
            <div className="flex-1 rounded-xl bg-sand px-3 py-3 text-center text-[0.72rem] font-bold uppercase tracking-[0.1em] md:text-[0.68rem]">
              {e(n)}
            </div>
            {r < CAPTURE_CHANNELS.length - 1 && (
              <span className={`text-xs opacity-30 ${t ? "rotate-180" : ""}`}>
                →
              </span>
            )}
          </div>
        ))}
      </div>
    </Section>
  );
}
const JOURNEY_STEPS = [
  {
    en: "Website forms",
    ar: "نماذج الموقع",
  },
  {
    en: "Landing pages",
    ar: "الصفحات المقصودة",
  },
  {
    en: "Facebook Lead Ads",
    ar: "إعلانات فيسبوك",
  },
  {
    en: "Instagram",
    ar: "إنستغرام",
  },
  {
    en: "Google Ads",
    ar: "إعلانات جوجل",
  },
  {
    en: "WhatsApp",
    ar: "واتساب",
  },
  {
    en: "Web chat",
    ar: "الدردشة على الموقع",
  },
  {
    en: "Phone calls",
    ar: "المكالمات الهاتفية",
  },
  {
    en: "Existing databases",
    ar: "قواعد بياناتك الحالية",
  },
  {
    en: "APIs / external applications",
    ar: "واجهات برمجية وتطبيقات خارجية",
  },
];
function CaptureSection() {
  let { t: e } = useLocale();
  return (
    <Section id="how" tone="sand">
      <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
        <div>
          <SectionHeading>
            {e({
              en: "01. Capture Every Opportunity",
              ar: "٠١. التقط كل فرصة",
            })}
          </SectionHeading>
          <p className="mt-5 text-sm leading-relaxed opacity-90">
            {e({
              en: "No downloading spreadsheets. No forwarding leads manually. No checking five different inboxes. Every enquiry enters one customer record and one revenue pipeline automatically.",
              ar: "لا تحميل لملفات إكسل، ولا تحويل يدوي للعملاء، ولا تفقّد لخمسة صناديق بريد. كل استفسار يدخل تلقائياً إلى سجل عميل واحد ومسار إيرادات واحد.",
            })}
          </p>
          <ul className="mt-7 grid gap-2.5 sm:grid-cols-2">
            {JOURNEY_STEPS.map((t) => (
              <Bullet key={t.en}>{e(t)}</Bullet>
            ))}
          </ul>
        </div>
        <div className="relative rounded-3xl border border-border bg-background p-6 md:p-8">
          <div className="grid gap-2">
            {JOURNEY_STEPS.slice(0, 6).map((t, n) => (
              <div
                key={t.en}
                className="flex items-center gap-3"
                style={{
                  animation: `rise 0.6s ${n * 0.08}s both`,
                }}
              >
                <span className="w-32 shrink-0 truncate rounded-lg border border-border bg-card px-2.5 py-1.5 text-[0.68rem] font-medium">
                  {e(t)}
                </span>
                <span className="h-px flex-1 bg-gradient-to-r from-accent-strong/60 to-transparent" />
              </div>
            ))}
          </div>
          <div className="mt-6 rounded-2xl bg-ink p-5 text-ink-foreground">
            <p className="text-[0.6rem] uppercase tracking-[0.18em] opacity-80">
              {e({
                en: "Unified customer record",
                ar: "سجل عميل موحّد",
              })}
            </p>
            <p className="mt-2 font-display text-lg font-bold">
              Sarah Al Mansouri
            </p>
            <div className="mt-3 grid grid-cols-2 gap-2 text-[0.68rem] opacity-90">
              <span>
                {e({
                  en: "Source: Meta Ads",
                  ar: "المصدر: إعلانات ميتا",
                })}
              </span>
              <span>
                {e({
                  en: "Stage: Qualified",
                  ar: "المرحلة: مؤهل",
                })}
              </span>
              <span>
                {e({
                  en: "Owner: Omar",
                  ar: "المسؤول: عمر",
                })}
              </span>
              <span>
                {e({
                  en: "Channel: WhatsApp",
                  ar: "القناة: واتساب",
                })}
              </span>
            </div>
          </div>
        </div>
      </div>
    </Section>
  );
}
const CAPTURE_SOURCES = [
  {
    en: "Answer common questions",
    ar: "الإجابة عن الأسئلة الشائعة",
  },
  {
    en: "Understand the enquiry",
    ar: "فهم طبيعة الاستفسار",
  },
  {
    en: "Ask qualification questions",
    ar: "طرح أسئلة التأهيل",
  },
  {
    en: "Recommend next steps",
    ar: "اقتراح الخطوة التالية",
  },
  {
    en: "Route complex enquiries",
    ar: "توجيه الاستفسارات المعقدة",
  },
  {
    en: "Book appointments",
    ar: "حجز المواعيد",
  },
  {
    en: "Hand conversations to your team",
    ar: "تسليم المحادثة لفريقك",
  },
];
function RespondSection() {
  let { t: e } = useLocale();
  return (
    <Section>
      <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
        <div className="rounded-3xl border border-border bg-card p-6 md:p-8">
          <div className="flex items-center justify-between text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            <span>
              {e({
                en: "New lead",
                ar: "عميل محتمل جديد",
              })}
            </span>
            <span>00:00</span>
          </div>
          <div className="mt-4 rounded-xl border border-border bg-background p-4 text-sm">
            {e({
              en: "Enquiry received — website form",
              ar: "تم استلام استفسار — نموذج الموقع",
            })}
          </div>
          <div className="my-3 flex justify-center text-lg opacity-30">↓</div>
          <div className="rounded-xl border border-whatsapp/40 bg-whatsapp/10 p-4">
            <p className="text-[0.6rem] font-semibold uppercase tracking-[0.16em] text-whatsapp">
              WhatsApp
            </p>
            <p className="mt-2 text-sm leading-relaxed">
              {e({
                en: "Hi Sarah 👋 Thanks for your enquiry — I can help right now. Are you looking for a viewing this week?",
                ar: "أهلاً سارة 👋 شكراً لتواصلك — أقدر أساعدك الآن. تحبين نحجز موعد زيارة هذا الأسبوع؟",
              })}
            </p>
            <p className="mt-3 text-[0.65rem] font-semibold opacity-85">
              00:05
            </p>
          </div>
          <p className="mt-6 text-center font-display text-2xl font-bold tracking-tight">
            {e({
              en: "Seconds. Not hours.",
              ar: "ثوانٍ. وليس ساعات.",
            })}
          </p>
        </div>
        <div>
          <SectionHeading>
            {e({
              en: "02. Respond While They're Still Interested",
              ar: "٠٢. رُدّ عليهم وهم ما زالوا مهتمين",
            })}
          </SectionHeading>
          <p className="mt-5 text-sm leading-relaxed opacity-90">
            {e({
              en: "Your AI Sales Agent can immediately engage incoming leads through WhatsApp, SMS, web chat or other connected channels.",
              ar: "يتفاعل وكيل المبيعات الذكي فوراً مع العملاء الجدد عبر واتساب والرسائل النصية والدردشة وأي قناة أخرى مرتبطة.",
            })}
          </p>
          <ul className="mt-6 grid gap-2.5 sm:grid-cols-2">
            {CAPTURE_SOURCES.map((t) => (
              <Bullet key={t.en}>{e(t)}</Bullet>
            ))}
          </ul>
          <p className="mt-7 font-display text-lg font-bold tracking-tight">
            {e({
              en: "24 hours a day. Arabic and English.",
              ar: "على مدار الساعة. بالعربية والإنجليزية.",
            })}
          </p>
        </div>
      </div>
    </Section>
  );
}
const RESPOND_POINTS = [
  {
    t: {
      en: "Instant Lead Response",
      ar: "رد فوري على العملاء",
    },
    b: {
      en: "Automatically engage new enquiries.",
      ar: "تفاعل تلقائي مع كل استفسار جديد.",
    },
  },
  {
    t: {
      en: "AI Conversations",
      ar: "محادثات ذكية",
    },
    b: {
      en: "Answer questions and qualify prospects conversationally.",
      ar: "الإجابة عن الأسئلة وتأهيل العملاء عبر محادثة طبيعية.",
    },
  },
  {
    t: {
      en: "Automated Follow-Up",
      ar: "متابعة تلقائية",
    },
    b: {
      en: "Follow up when prospects stop responding.",
      ar: "متابعة العملاء عند توقفهم عن الرد.",
    },
  },
  {
    t: {
      en: "Appointment Booking",
      ar: "حجز المواعيد",
    },
    b: {
      en: "Let prospects book directly inside the conversation.",
      ar: "يحجز العميل موعده داخل المحادثة مباشرة.",
    },
  },
  {
    t: {
      en: "Campaigns",
      ar: "الحملات",
    },
    b: {
      en: "Send segmented promotions and customer communications.",
      ar: "إرسال عروض ورسائل مقسّمة حسب شرائح العملاء.",
    },
  },
  {
    t: {
      en: "Reminders",
      ar: "التذكيرات",
    },
    b: {
      en: "Automatically send appointment and follow-up reminders.",
      ar: "تذكيرات تلقائية بالمواعيد والمتابعات.",
    },
  },
  {
    t: {
      en: "Reactivation",
      ar: "إعادة التنشيط",
    },
    b: {
      en: "Reconnect with old enquiries and dormant customers.",
      ar: "إعادة التواصل مع الاستفسارات القديمة والعملاء الخاملين.",
    },
  },
  {
    t: {
      en: "Human Handoff",
      ar: "التحويل للفريق",
    },
    b: {
      en: "Move valuable or complex conversations to your team.",
      ar: "تحويل المحادثات المهمة أو المعقدة إلى فريقك.",
    },
  },
];
function WhatsAppSection() {
  let { t: e } = useLocale();
  return (
    <Section tone="dark">
      <Eyebrow>
        <span className="text-ink-foreground/85">
          {e({
            en: "Built for how the GCC actually communicates",
            ar: "مصمم لطريقة التواصل الفعلية في الخليج",
          })}
        </span>
      </Eyebrow>
      <SectionHeading>
        {e({
          en: "Turn WhatsApp Into a Revenue Channel",
          ar: "حوّل واتساب إلى قناة إيرادات",
        })}
      </SectionHeading>
      <SectionText>
        {e({
          en: "Not just another WhatsApp inbox. We build an automated customer journey around it.",
          ar: "ليس مجرد صندوق وارد آخر لواتساب، بل رحلة عميل مؤتمتة بالكامل حوله.",
        })}
      </SectionText>
      <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {RESPOND_POINTS.map((t) => (
          <Card key={t.t.en} tone="dark">
            <span className="mb-4 block size-2 rounded-full bg-whatsapp" />
            <h3 className="font-display text-sm font-bold tracking-tight">
              {e(t.t)}
            </h3>
            <p className="mt-2 text-[0.82rem] leading-relaxed opacity-90">
              {e(t.b)}
            </p>
          </Card>
        ))}
      </div>
      <p className="mt-12 max-w-3xl font-display text-xl font-bold leading-snug tracking-tight md:text-3xl">
        {e({
          en: "“WhatsApp shouldn't live on someone's phone. It should live inside your revenue system.”",
          ar: "«لا ينبغي أن يعيش واتساب على هاتف موظف. مكانه داخل نظام إيراداتك.»",
        })}
      </p>
    </Section>
  );
}
const WHATSAPP_FEATURES = [
  {
    d: 0,
    en: "Instant WhatsApp response",
    ar: "رد فوري عبر واتساب",
  },
  {
    d: 1,
    en: "Follow-up",
    ar: "متابعة",
  },
  {
    d: 3,
    en: "Value message",
    ar: "رسالة قيمة",
  },
  {
    d: 7,
    en: "WhatsApp follow-up",
    ar: "متابعة عبر واتساب",
  },
  {
    d: 14,
    en: "Email nurture",
    ar: "رعاية بالبريد",
  },
  {
    d: 21,
    en: "Offer / case study",
    ar: "عرض أو دراسة حالة",
  },
  {
    d: 30,
    en: "Check-in",
    ar: "تواصل تذكيري",
  },
  {
    d: 45,
    en: "Follow-up",
    ar: "متابعة",
  },
  {
    d: 60,
    en: "Reactivation",
    ar: "إعادة تنشيط",
  },
];
function FollowUpSection() {
  let { t: e } = useLocale();
  return (
    <Section>
      <SectionHeading>
        {e({
          en: "03. Because Most Leads Don't Buy Today.",
          ar: "٠٣. لأن معظم العملاء لا يشترون اليوم.",
        })}
      </SectionHeading>
      <SectionText>
        {e({
          en: "Your system shouldn't give up because the customer didn't reply twice.",
          ar: "لا يجب أن يستسلم نظامك لمجرد أن العميل لم يرد مرتين.",
        })}
      </SectionText>
      <div className="mt-12 grid gap-3 sm:grid-cols-3">
        {WHATSAPP_FEATURES.map((t, n) => (
          <div
            key={n}
            className="rounded-xl border border-border bg-card p-4"
            style={{
              animation: `rise 0.5s ${n * 0.05}s both`,
            }}
          >
            <p className="text-[0.62rem] font-bold uppercase tracking-[0.18em] text-accent-strong">
              {e({
                en: `Day ${t.d}`,
                ar: `اليوم ${t.d}`,
              })}
            </p>
            <p className="mt-2 text-sm font-medium">{e(t)}</p>
          </div>
        ))}
      </div>
      <p className="mt-10 max-w-3xl font-display text-xl font-bold leading-snug tracking-tight md:text-3xl">
        {e({
          en: "Follow up for weeks — without your salespeople remembering to follow up.",
          ar: "متابعة تستمر لأسابيع — دون أن يتذكرها أحد من فريق المبيعات.",
        })}
      </p>
      <div className="mt-6 flex flex-wrap gap-2">
        {[
          {
            en: "WhatsApp",
            ar: "واتساب",
          },
          {
            en: "Email",
            ar: "البريد الإلكتروني",
          },
          {
            en: "SMS",
            ar: "الرسائل النصية",
          },
          {
            en: "AI conversations",
            ar: "محادثات ذكية",
          },
          {
            en: "Calls / Voice AI where configured",
            ar: "مكالمات وصوت ذكي عند التفعيل",
          },
        ].map((t) => (
          <span
            key={t.en}
            className="rounded-full border border-border bg-card px-3.5 py-1.5 text-[0.75rem] font-medium"
          >
            {e(t)}
          </span>
        ))}
      </div>
    </Section>
  );
}
const NURTURE_DAYS = [
    {
      en: "Lead response",
      ar: "الرد على العملاء",
    },
    {
      en: "Qualification",
      ar: "التأهيل",
    },
    {
      en: "FAQs",
      ar: "الأسئلة الشائعة",
    },
    {
      en: "Lead scoring",
      ar: "تقييم العملاء",
    },
    {
      en: "Appointment booking",
      ar: "حجز المواعيد",
    },
    {
      en: "Reminders",
      ar: "التذكيرات",
    },
    {
      en: "Follow-ups",
      ar: "المتابعات",
    },
    {
      en: "Reactivation",
      ar: "إعادة التنشيط",
    },
    {
      en: "Database nurturing",
      ar: "رعاية قاعدة البيانات",
    },
  ],
  ft = [
    {
      en: "Consultation",
      ar: "الاستشارة",
    },
    {
      en: "Relationship building",
      ar: "بناء العلاقة",
    },
    {
      en: "Negotiation",
      ar: "التفاوض",
    },
    {
      en: "Complex objections",
      ar: "الاعتراضات المعقدة",
    },
    {
      en: "Proposals",
      ar: "العروض",
    },
    {
      en: "Closing",
      ar: "الإغلاق",
    },
  ];
function AgentSection() {
  let { t: e } = useLocale();
  return (
    <Section tone="sand">
      <SectionHeading>
        {e({
          en: "Meet the Sales Agent That Never Forgets a Lead",
          ar: "تعرّف على وكيل المبيعات الذي لا ينسى أي عميل",
        })}
      </SectionHeading>
      <div className="mt-12 grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-foreground/15 bg-background p-7">
          <p className="text-[0.62rem] font-bold uppercase tracking-[0.18em] text-accent-strong">
            {e({
              en: "The AI Agent handles",
              ar: "الذكاء الاصطناعي يتولى",
            })}
          </p>
          <ul className="mt-5 grid gap-2 sm:grid-cols-2">
            {NURTURE_DAYS.map((t) => (
              <li key={t.en} className="text-sm opacity-75">
                {e(t)}
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-2xl border border-foreground/15 bg-ink p-7 text-ink-foreground">
          <p className="text-[0.62rem] font-bold uppercase tracking-[0.18em] opacity-80">
            {e({
              en: "Your salespeople handle",
              ar: "فريق المبيعات يتولى",
            })}
          </p>
          <ul className="mt-5 grid gap-2 sm:grid-cols-2">
            {ft.map((t) => (
              <li key={t.en} className="text-sm opacity-80">
                {e(t)}
              </li>
            ))}
          </ul>
        </div>
      </div>
      <p className="mt-10 font-display text-2xl font-bold leading-tight tracking-tight md:text-4xl">
        {e({
          en: "Let AI handle the repetition. Let your people handle the relationship.",
          ar: "دع الذكاء الاصطناعي يتولى التكرار، ودع فريقك يتولى العلاقة.",
        })}
      </p>
      <CtaLink className="mt-8">
        {e({
          en: "Book Free Revenue Audit",
          ar: "احجز تدقيق الإيرادات المجاني",
        })}
      </CtaLink>
    </Section>
  );
}
const mt = ["WhatsApp", "Instagram", "Facebook", "Email", "SMS", "Web Chat"];
function InboxSection() {
  let { t: e } = useLocale(),
    [t, n] = useState(0);
  return (
    <Section id="features">
      <SectionHeading>
        {e({
          en: "Every Conversation. One Inbox.",
          ar: "كل المحادثات. صندوق وارد واحد.",
        })}
      </SectionHeading>
      <SectionText>
        {e({
          en: "Stop asking your team: “Did anyone reply to this customer?” The answer is already in the system.",
          ar: "توقف عن سؤال فريقك: «هل رد أحد على هذا العميل؟» الإجابة موجودة في النظام.",
        })}
      </SectionText>
      <div className="mt-10 overflow-hidden rounded-3xl border border-border bg-card">
        <div className="flex gap-1 overflow-x-auto border-b border-border p-2">
          {mt.map((e, r) => (
            <button
              key={e}
              onClick={() => n(r)}
              className={`whitespace-nowrap rounded-full px-3.5 py-1.5 text-[0.75rem] font-semibold transition-colors ${t === r ? "bg-foreground text-background" : "opacity-55 hover:opacity-100"}`}
            >
              {e}
            </button>
          ))}
        </div>
        <div className="grid md:grid-cols-[1fr_1fr]">
          <div className="space-y-3 border-b border-border p-6 md:border-b-0 md:border-e md:border-border">
            <div className="max-w-[85%] rounded-2xl rounded-ss-sm bg-sand px-4 py-3 text-sm">
              {e({
                en: "Hi, is the 2BR still available?",
                ar: "السلام عليكم، هل الشقة بغرفتين لا تزال متاحة؟",
              })}
            </div>
            <div className="ms-auto max-w-[85%] rounded-2xl rounded-se-sm bg-ink px-4 py-3 text-sm text-ink-foreground">
              {e({
                en: "Yes 👋 Two units left. Would Tuesday 4pm or Wednesday 11am suit you for a viewing?",
                ar: "نعم 👋 تبقّت وحدتان. يناسبك موعد الثلاثاء ٤ عصراً أم الأربعاء ١١ صباحاً للمعاينة؟",
              })}
            </div>
            <div className="max-w-[85%] rounded-2xl rounded-ss-sm bg-sand px-4 py-3 text-sm">
              {e({
                en: "Tuesday works.",
                ar: "الثلاثاء مناسب.",
              })}
            </div>
            <div className="ms-auto max-w-[85%] rounded-2xl rounded-se-sm bg-whatsapp/15 px-4 py-3 text-sm">
              {e({
                en: "Booked ✅ Tuesday 4:00pm. Omar from our team will confirm.",
                ar: "تم الحجز ✅ الثلاثاء ٤:٠٠ عصراً. سيؤكد عمر من فريقنا الموعد.",
              })}
            </div>
          </div>
          <div className="space-y-2.5 p-6 text-[0.8rem]">
            {[
              [
                {
                  en: "Name",
                  ar: "الاسم",
                },
                "Sarah Al Mansouri",
              ],
              [
                {
                  en: "Company",
                  ar: "الشركة",
                },
                "Mansouri Holdings",
              ],
              [
                {
                  en: "Lead source",
                  ar: "المصدر",
                },
                "Meta Ads",
              ],
              [
                {
                  en: "Previous conversations",
                  ar: "محادثات سابقة",
                },
                "3",
              ],
              [
                {
                  en: "Pipeline stage",
                  ar: "مرحلة المسار",
                },
                "Appointment",
              ],
              [
                {
                  en: "Appointment",
                  ar: "الموعد",
                },
                "Tue 4:00 PM",
              ],
              [
                {
                  en: "Deal value",
                  ar: "قيمة الصفقة",
                },
                "120,000",
              ],
              [
                {
                  en: "Assigned to",
                  ar: "المسؤول",
                },
                "Omar H.",
              ],
              [
                {
                  en: "Tags",
                  ar: "الوسوم",
                },
                "Hot · Ready to view",
              ],
            ].map(([t, n]) => (
              <div
                key={String(n)}
                className="flex justify-between gap-4 border-b border-border pb-2"
              >
                <span className="opacity-85">{e(t as Copy)}</span>
                <span className="font-medium">{String(n)}</span>
              </div>
            ))}
            <div className="rounded-xl bg-accent p-3 text-[0.78rem] leading-relaxed text-accent-foreground">
              <span className="font-bold">
                {e({
                  en: "AI summary: ",
                  ar: "ملخص الذكاء الاصطناعي: ",
                })}
              </span>
              {e({
                en: "Ready buyer, budget confirmed, viewing booked for Tuesday. Needs floor plan before visit.",
                ar: "مشترٍ جاهز، الميزانية مؤكدة، وتم حجز معاينة الثلاثاء. يحتاج المخطط قبل الزيارة.",
              })}
            </div>
          </div>
        </div>
      </div>
    </Section>
  );
}
const PIPELINE_COLUMNS = [
  {
    en: "New Lead",
    ar: "عميل جديد",
  },
  {
    en: "Contacted",
    ar: "تم التواصل",
  },
  {
    en: "Qualified",
    ar: "مؤهل",
  },
  {
    en: "Appointment",
    ar: "موعد",
  },
  {
    en: "Proposal",
    ar: "عرض سعر",
  },
  {
    en: "Negotiation",
    ar: "تفاوض",
  },
  {
    en: "Won",
    ar: "مكتسب",
  },
];
function PipelineSection() {
  let { t: e, money: t } = useLocale(),
    [n, a] = useState(0);
  useEffect(() => {
    let e = setInterval(
      () => a((e) => (e + 1) % PIPELINE_COLUMNS.length),
      1500,
    );
    return () => clearInterval(e);
  }, []);
  return (
    <Section tone="sand">
      <SectionHeading>
        {e({
          en: "Know Exactly Where Every Opportunity Stands.",
          ar: "اعرف بدقة أين تقف كل فرصة.",
        })}
      </SectionHeading>
      <div className="mt-10 grid gap-3 overflow-x-auto md:grid-cols-7">
        {PIPELINE_COLUMNS.map((r, a) => (
          <div
            key={r.en}
            className="min-w-[9rem] rounded-xl border border-foreground/10 bg-background p-3"
          >
            <p className="text-[0.6rem] font-bold uppercase tracking-[0.14em] opacity-80">
              {e(r)}
            </p>
            <div
              className={`mt-3 rounded-lg border p-2.5 text-[0.7rem] transition-all duration-500 ${n === a ? "border-accent-strong bg-accent shadow-sm" : "border-border bg-card opacity-70"}`}
            >
              <p className="font-semibold">Sarah A.</p>
              <p className="opacity-85">{t(12e4)}</p>
            </div>
            {a % 2 == 0 && (
              <div className="mt-2 rounded-lg border border-border bg-card p-2.5 text-[0.7rem] opacity-70">
                <p className="font-semibold">Khalid R.</p>
                <p className="opacity-85">{t(45e3)}</p>
              </div>
            )}
          </div>
        ))}
      </div>
      <div className="mt-8 flex flex-wrap gap-2">
        {[
          {
            en: "Automated stage movement",
            ar: "تحريك تلقائي للمراحل",
          },
          {
            en: "Lead assignment",
            ar: "توزيع العملاء",
          },
          {
            en: "Lead scoring",
            ar: "تقييم العملاء",
          },
          {
            en: "Tasks",
            ar: "المهام",
          },
          {
            en: "Follow-up triggers",
            ar: "محفزات المتابعة",
          },
          {
            en: "Deal value",
            ar: "قيمة الصفقة",
          },
          {
            en: "Lost-deal tracking",
            ar: "تتبع الصفقات المفقودة",
          },
          {
            en: "Salesperson ownership",
            ar: "مسؤولية مندوب المبيعات",
          },
        ].map((t) => (
          <span
            key={t.en}
            className="rounded-full border border-foreground/15 bg-background px-3.5 py-1.5 text-[0.75rem] font-medium"
          >
            {e(t)}
          </span>
        ))}
      </div>
    </Section>
  );
}
function DashboardSection() {
  let { t: e, money: t } = useLocale(),
    n = [
      {
        v: "312",
        l: {
          en: "New Leads",
          ar: "عملاء جدد",
        },
      },
      {
        v: "96%",
        l: {
          en: "Response Rate",
          ar: "معدل الرد",
        },
      },
      {
        v: e({
          en: "38 sec",
          ar: "٣٨ ثانية",
        }),
        l: {
          en: "Avg. Response Time",
          ar: "متوسط زمن الرد",
        },
      },
      {
        v: "147",
        l: {
          en: "Qualified Leads",
          ar: "عملاء مؤهلون",
        },
      },
      {
        v: "63",
        l: {
          en: "Appointments",
          ar: "المواعيد",
        },
      },
      {
        v: t(84e4),
        l: {
          en: "Pipeline Value",
          ar: "قيمة المسار",
        },
      },
      {
        v: t(212e3),
        l: {
          en: "Won Revenue",
          ar: "الإيرادات المحققة",
        },
      },
    ];
  return (
    <Section tone="dark">
      <SectionHeading>
        {e({
          en: "Finally See What's Happening Between Marketing and Sales.",
          ar: "أخيراً... شاهد ما يحدث بين التسويق والمبيعات.",
        })}
      </SectionHeading>
      <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {n.map((t) => (
          <div
            key={t.l.en}
            className="rounded-2xl border border-white/10 bg-white/[0.04] p-5"
          >
            <p className="font-display text-2xl font-bold tracking-tight md:text-3xl">
              {t.v}
            </p>
            <p className="mt-1.5 text-[0.72rem] uppercase tracking-[0.12em] opacity-80">
              {e(t.l)}
            </p>
          </div>
        ))}
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-2 lg:grid-cols-4">
        {[
          {
            en: "Lead source → appointment rate",
            ar: "المصدر ← معدل المواعيد",
          },
          {
            en: "Lead source → revenue",
            ar: "المصدر ← الإيرادات",
          },
          {
            en: "Sales pipeline conversion",
            ar: "تحويل مسار المبيعات",
          },
          {
            en: "Salesperson performance",
            ar: "أداء المندوبين",
          },
          {
            en: "Lead response speed",
            ar: "سرعة الرد",
          },
          {
            en: "Appointment show rate",
            ar: "نسبة حضور المواعيد",
          },
          {
            en: "Campaign performance",
            ar: "أداء الحملات",
          },
        ].map((t, n) => (
          <div
            key={t.en}
            className="rounded-2xl border border-white/10 bg-white/[0.03] p-5"
          >
            <p className="text-[0.72rem] font-medium opacity-85">{e(t)}</p>
            <div className="mt-4 flex h-16 items-end gap-1.5">
              {[40, 65, 35, 80, 55, 95, 70].map((e, t) => (
                <span
                  key={t}
                  className="flex-1 rounded-sm bg-accent-strong/70"
                  style={{
                    height: `${(e + n * 3) % 100}%`,
                  }}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
      <p className="mt-10 font-display text-2xl font-bold tracking-tight md:text-4xl">
        {e({
          en: "One dashboard from ad spend to revenue.",
          ar: "لوحة واحدة من الإنفاق الإعلاني إلى الإيراد.",
        })}
      </p>
      <p className="mt-3 text-[0.72rem] opacity-80">
        {e({
          en: "Figures shown are illustrative.",
          ar: "الأرقام المعروضة توضيحية فقط.",
        })}
      </p>
    </Section>
  );
}
function CampaignsSection() {
  let { t: e } = useLocale();
  return (
    <Section>
      <SectionHeading>
        <span className="line">
          {e({
            en: "Your CRM Shouldn't Just Store Contacts.",
            ar: "نظامك ليس مجرد دفتر جهات اتصال.",
          })}
        </span>
        <span className="line text-foreground/75">
          {e({
            en: "It Should Generate Revenue From Them.",
            ar: "يجب أن يصنع منهم إيرادات.",
          })}
        </span>
      </SectionHeading>
      <div className="mt-10 flex flex-wrap gap-2">
        {[
          {
            en: "Email campaigns",
            ar: "حملات البريد",
          },
          {
            en: "WhatsApp campaigns",
            ar: "حملات واتساب",
          },
          {
            en: "SMS campaigns",
            ar: "حملات الرسائل النصية",
          },
          {
            en: "Customer segmentation",
            ar: "تقسيم العملاء",
          },
          {
            en: "Offer campaigns",
            ar: "حملات العروض",
          },
          {
            en: "Newsletter campaigns",
            ar: "النشرات البريدية",
          },
          {
            en: "Lead nurturing",
            ar: "رعاية العملاء",
          },
          {
            en: "Customer reactivation",
            ar: "إعادة تنشيط العملاء",
          },
          {
            en: "Seasonal campaigns",
            ar: "الحملات الموسمية",
          },
          {
            en: "Referral campaigns",
            ar: "حملات الترشيح",
          },
          {
            en: "Cross-sell / upsell",
            ar: "البيع المتقاطع والإضافي",
          },
        ].map((t) => (
          <span
            key={t.en}
            className="rounded-full border border-border bg-card px-4 py-2 text-[0.78rem] font-medium"
          >
            {e(t)}
          </span>
        ))}
      </div>
      <div className="mt-10 rounded-2xl bg-sand p-7">
        <p className="text-[0.62rem] font-bold uppercase tracking-[0.18em] text-accent-strong">
          {e({
            en: "GCC campaign moments",
            ar: "مواسم الحملات في الخليج",
          })}
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {[
            {
              en: "Ramadan",
              ar: "رمضان",
            },
            {
              en: "Eid",
              ar: "العيد",
            },
            {
              en: "Saudi Founding Day",
              ar: "يوم التأسيس السعودي",
            },
            {
              en: "Saudi National Day",
              ar: "اليوم الوطني السعودي",
            },
            {
              en: "UAE National Day",
              ar: "اليوم الوطني الإماراتي",
            },
            {
              en: "Seasonal offers",
              ar: "عروض موسمية",
            },
            {
              en: "Customer anniversaries",
              ar: "ذكرى تعامل العميل",
            },
          ].map((t) => (
            <span
              key={t.en}
              className="rounded-full bg-background px-4 py-2 text-[0.78rem] font-medium"
            >
              {e(t)}
            </span>
          ))}
        </div>
      </div>
    </Section>
  );
}
function ReactivationSection() {
  let { t: e } = useLocale(),
    t = [
      {
        v: "8,421",
        l: {
          en: "Old contacts",
          ar: "جهة اتصال قديمة",
        },
      },
      {
        v: e({
          en: "AI Reactivation Campaign",
          ar: "حملة إعادة تنشيط ذكية",
        }),
        l: null,
      },
      {
        v: "684",
        l: {
          en: "Re-engaged",
          ar: "تفاعلوا مجدداً",
        },
      },
      {
        v: "93",
        l: {
          en: "Appointments",
          ar: "موعداً",
        },
      },
      {
        v: e({
          en: "New Revenue",
          ar: "إيرادات جديدة",
        }),
        l: null,
      },
    ];
  return (
    <Section tone="dark">
      <SectionHeading>
        {e({
          en: "You May Already Be Sitting On Your Next Customers.",
          ar: "ربما عملاؤك القادمون موجودون لديك بالفعل.",
        })}
      </SectionHeading>
      <div className="mt-8 grid gap-10 lg:grid-cols-2">
        <div>
          <p className="text-sm leading-relaxed opacity-90">
            {e({
              en: "Your database contains prospects who:",
              ar: "قاعدة بياناتك تضم عملاء:",
            })}
          </p>
          <ul className="mt-4 grid gap-2 text-sm opacity-80">
            {[
              {
                en: "Asked for information.",
                ar: "طلبوا معلومات.",
              },
              {
                en: "Requested quotations.",
                ar: "طلبوا عروض أسعار.",
              },
              {
                en: "Booked but didn't buy.",
                ar: "حجزوا ولم يشتروا.",
              },
              {
                en: "Stopped replying.",
                ar: "توقفوا عن الرد.",
              },
              {
                en: "Bought once and disappeared.",
                ar: "اشتروا مرة واختفوا.",
              },
            ].map((t) => (
              <li key={t.en}>— {e(t)}</li>
            ))}
          </ul>
          <p className="mt-6 text-sm leading-relaxed opacity-90">
            {e({
              en: "Instead of constantly paying for new leads, Sales OS helps reactivate the opportunities you already paid to acquire.",
              ar: "بدلاً من الدفع المستمر لعملاء جدد، يساعدك النظام على إعادة تنشيط الفرص التي دفعت ثمنها بالفعل.",
            })}
          </p>
          <CtaLink variant="light" className="mt-8">
            {e({
              en: "See How Reactivation Works",
              ar: "شاهد كيف تعمل إعادة التنشيط",
            })}
          </CtaLink>
        </div>
        <div className="grid gap-2">
          {t.map((n, r) => (
            <div key={r} className="text-center">
              <div
                className={`rounded-xl border px-5 py-4 ${r === 1 ? "border-accent-strong/50 bg-accent-strong/15" : "border-white/10 bg-white/[0.04]"}`}
                style={{
                  marginInline: `${r * 6}%`,
                }}
              >
                <p className="font-display text-lg font-bold">{n.v}</p>
                {n.l && (
                  <p className="text-[0.7rem] uppercase tracking-[0.14em] opacity-80">
                    {e(n.l)}
                  </p>
                )}
              </div>
              {r < t.length - 1 && (
                <span className="block py-1 text-sm opacity-30">↓</span>
              )}
            </div>
          ))}
          <p className="mt-3 text-center text-[0.7rem] opacity-80">
            {e({
              en: "Numbers shown are an illustrative example only.",
              ar: "الأرقام المعروضة مثال توضيحي فقط.",
            })}
          </p>
        </div>
      </div>
    </Section>
  );
}
const AUTOMATION_STEPS = [
  {
    en: "New lead arrives",
    ar: "وصول عميل محتمل",
  },
  {
    en: "Respond instantly",
    ar: "رد فوري",
  },
  {
    en: "Assign salesperson",
    ar: "تعيين مندوب",
  },
  {
    en: "AI qualification",
    ar: "تأهيل ذكي",
  },
  {
    en: "Lead score",
    ar: "تقييم العميل",
  },
  {
    en: "Appointment booking",
    ar: "حجز موعد",
  },
  {
    en: "Reminder",
    ar: "تذكير",
  },
  {
    en: "No response? → Follow-up sequence",
    ar: "لا يوجد رد؟ ← تسلسل متابعة",
  },
  {
    en: "Appointment missed? → Reschedule sequence",
    ar: "فات الموعد؟ ← إعادة جدولة",
  },
  {
    en: "Proposal sent? → Follow-up sequence",
    ar: "أُرسل العرض؟ ← تسلسل متابعة",
  },
  {
    en: "Deal won? → Onboarding workflow",
    ar: "تم الإغلاق؟ ← رحلة استقبال العميل",
  },
];
function AutomationsSection() {
  let { t: e } = useLocale();
  return (
    <Section tone="sand">
      <Eyebrow>
        {e({
          en: "Automations",
          ar: "الأتمتة",
        })}
      </Eyebrow>
      <SectionHeading>
        {e({
          en: "Your Business Keeps Moving Even When Nobody Clicks “Follow Up.”",
          ar: "عملك يستمر حتى لو لم يضغط أحد زر «متابعة».",
        })}
      </SectionHeading>
      <div className="mt-10 grid gap-2 md:grid-cols-2">
        {AUTOMATION_STEPS.map((t, n) => (
          <div
            key={t.en}
            className="flex items-center gap-4 rounded-xl border border-foreground/10 bg-background px-4 py-3"
            style={{
              animation: `rise 0.5s ${n * 0.04}s both`,
            }}
          >
            <span className="grid size-7 shrink-0 place-items-center rounded-full bg-ink text-[0.65rem] font-bold text-ink-foreground">
              {n === 0 ? "IF" : n}
            </span>
            <span className="text-sm font-medium">{e(t)}</span>
          </div>
        ))}
      </div>
      <Card className="mt-8 bg-background">
        <p className="font-display text-lg font-bold tracking-tight">
          {e({
            en: "Your salesperson forgot to follow up? The system didn't.",
            ar: "نسي مندوبك المتابعة؟ النظام لم ينسَ.",
          })}
        </p>
        <p className="mt-2 text-sm opacity-90">
          {e({
            en: "Automated workflows continue engaging prospects until they reply, book, buy or opt out.",
            ar: "تستمر مسارات الأتمتة في التفاعل مع العميل حتى يرد أو يحجز أو يشتري أو يطلب التوقف.",
          })}
        </p>
      </Card>
    </Section>
  );
}
const PLATFORM_GROUPS = [
  {
    t: {
      en: "CRM & Sales",
      ar: "إدارة العملاء والمبيعات",
    },
    items: [
      {
        en: "Contact management",
        ar: "إدارة جهات الاتصال",
      },
      {
        en: "Large contact database (plan dependent)",
        ar: "قاعدة بيانات كبيرة حسب الباقة",
      },
      {
        en: "Sales pipelines",
        ar: "مسارات المبيعات",
      },
      {
        en: "Opportunities",
        ar: "الفرص",
      },
      {
        en: "Lead assignment",
        ar: "توزيع العملاء",
      },
      {
        en: "Lead scoring",
        ar: "تقييم العملاء",
      },
      {
        en: "Tasks",
        ar: "المهام",
      },
      {
        en: "Custom fields",
        ar: "حقول مخصصة",
      },
      {
        en: "Tags & segmentation",
        ar: "الوسوم والتقسيم",
      },
    ],
  },
  {
    t: {
      en: "AI Sales",
      ar: "المبيعات بالذكاء الاصطناعي",
    },
    items: [
      {
        en: "AI Chat Agent",
        ar: "وكيل محادثة ذكي",
      },
      {
        en: "WhatsApp AI",
        ar: "ذكاء اصطناعي لواتساب",
      },
      {
        en: "Lead qualification",
        ar: "تأهيل العملاء",
      },
      {
        en: "FAQ automation",
        ar: "أتمتة الأسئلة الشائعة",
      },
      {
        en: "Appointment scheduling",
        ar: "جدولة المواعيد",
      },
      {
        en: "AI conversation summaries",
        ar: "ملخصات المحادثات",
      },
      {
        en: "Lead routing",
        ar: "توجيه العملاء",
      },
      {
        en: "Human handoff",
        ar: "التحويل للفريق",
      },
    ],
  },
  {
    t: {
      en: "Marketing Automation",
      ar: "أتمتة التسويق",
    },
    items: [
      {
        en: "Email campaigns",
        ar: "حملات البريد",
      },
      {
        en: "WhatsApp campaigns",
        ar: "حملات واتساب",
      },
      {
        en: "SMS campaigns",
        ar: "حملات الرسائل النصية",
      },
      {
        en: "Lead nurturing",
        ar: "رعاية العملاء",
      },
      {
        en: "Database reactivation",
        ar: "إعادة تنشيط القاعدة",
      },
      {
        en: "Automated follow-up",
        ar: "متابعة تلقائية",
      },
      {
        en: "Campaign templates",
        ar: "قوالب الحملات",
      },
      {
        en: "Segmentation",
        ar: "التقسيم",
      },
    ],
  },
  {
    t: {
      en: "Communication",
      ar: "التواصل",
    },
    items: [
      {
        en: "Unified inbox",
        ar: "صندوق وارد موحّد",
      },
      {
        en: "WhatsApp",
        ar: "واتساب",
      },
      {
        en: "Instagram",
        ar: "إنستغرام",
      },
      {
        en: "Facebook",
        ar: "فيسبوك",
      },
      {
        en: "Email",
        ar: "البريد الإلكتروني",
      },
      {
        en: "SMS",
        ar: "الرسائل النصية",
      },
      {
        en: "Web chat",
        ar: "دردشة الموقع",
      },
      {
        en: "Call tracking where configured",
        ar: "تتبع المكالمات عند التفعيل",
      },
    ],
  },
  {
    t: {
      en: "Appointments",
      ar: "المواعيد",
    },
    items: [
      {
        en: "Online booking",
        ar: "حجز إلكتروني",
      },
      {
        en: "Google/Outlook calendar sync",
        ar: "مزامنة التقويم",
      },
      {
        en: "Appointment reminders",
        ar: "تذكيرات المواعيد",
      },
      {
        en: "Confirmation sequences",
        ar: "تسلسل التأكيد",
      },
      {
        en: "Rescheduling",
        ar: "إعادة الجدولة",
      },
      {
        en: "No-show recovery",
        ar: "استرجاع الغائبين",
      },
    ],
  },
  {
    t: {
      en: "Reputation",
      ar: "السمعة",
    },
    items: [
      {
        en: "Review requests",
        ar: "طلب التقييمات",
      },
      {
        en: "Google review automation",
        ar: "أتمتة تقييمات جوجل",
      },
      {
        en: "Customer feedback",
        ar: "آراء العملاء",
      },
      {
        en: "Review monitoring",
        ar: "مراقبة التقييمات",
      },
      {
        en: "Negative-feedback routing",
        ar: "توجيه الملاحظات السلبية",
      },
    ],
  },
  {
    t: {
      en: "Funnels",
      ar: "المسارات التسويقية",
    },
    items: [
      {
        en: "Landing pages",
        ar: "صفحات مقصودة",
      },
      {
        en: "Forms",
        ar: "النماذج",
      },
      {
        en: "Surveys",
        ar: "الاستبيانات",
      },
      {
        en: "Lead magnets",
        ar: "محتوى جاذب",
      },
      {
        en: "Booking pages",
        ar: "صفحات الحجز",
      },
      {
        en: "Website chat widgets",
        ar: "أدوات دردشة الموقع",
      },
      {
        en: "WhatsApp widgets",
        ar: "أدوات واتساب",
      },
    ],
  },
  {
    t: {
      en: "Reporting",
      ar: "التقارير",
    },
    items: [
      {
        en: "Marketing dashboard",
        ar: "لوحة التسويق",
      },
      {
        en: "Sales dashboard",
        ar: "لوحة المبيعات",
      },
      {
        en: "Pipeline analytics",
        ar: "تحليلات المسار",
      },
      {
        en: "Lead-source reporting",
        ar: "تقارير المصادر",
      },
      {
        en: "Conversion reporting",
        ar: "تقارير التحويل",
      },
      {
        en: "Team performance",
        ar: "أداء الفريق",
      },
      {
        en: "Campaign analytics",
        ar: "تحليلات الحملات",
      },
    ],
  },
  {
    t: {
      en: "Integrations",
      ar: "التكاملات",
    },
    items: [
      {
        en: "Meta",
        ar: "ميتا",
      },
      {
        en: "Google",
        ar: "جوجل",
      },
      {
        en: "WhatsApp",
        ar: "واتساب",
      },
      {
        en: "Instagram",
        ar: "إنستغرام",
      },
      {
        en: "Stripe",
        ar: "سترايب",
      },
      {
        en: "Zapier / Make",
        ar: "زابير وميك",
      },
      {
        en: "Google Sheets",
        ar: "جداول جوجل",
      },
      {
        en: "Calendars, Webhooks, API",
        ar: "التقويمات وWebhooks وAPI",
      },
      {
        en: "Existing business applications",
        ar: "تطبيقات عملك الحالية",
      },
    ],
  },
];
function PlatformSection() {
  let { t: e } = useLocale();
  return (
    <Section>
      <SectionHeading>
        {e({
          en: "One Revenue System Instead of 10 Disconnected Tools",
          ar: "نظام إيرادات واحد بدل عشر أدوات متفرقة",
        })}
      </SectionHeading>
      <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {PLATFORM_GROUPS.map((t) => (
          <Card key={t.t.en}>
            <h3 className="font-display text-[0.7rem] font-bold uppercase tracking-[0.18em] text-accent-strong">
              {e(t.t)}
            </h3>
            <ul className="mt-4 grid gap-1.5 text-[0.82rem] opacity-90">
              {t.items.map((t) => (
                <li key={t.en}>{e(t)}</li>
              ))}
            </ul>
          </Card>
        ))}
      </div>
    </Section>
  );
}
const VALUE_ITEMS = [
  {
    t: {
      en: "AI Revenue CRM",
      ar: "نظام إدارة الإيرادات",
    },
    v: 1e3,
  },
  {
    t: {
      en: "WhatsApp Business Automation",
      ar: "أتمتة واتساب للأعمال",
    },
    v: 750,
  },
  {
    t: {
      en: "AI Sales Agent",
      ar: "وكيل المبيعات الذكي",
    },
    v: 1500,
  },
  {
    t: {
      en: "Marketing Automation",
      ar: "أتمتة التسويق",
    },
    v: 750,
  },
  {
    t: {
      en: "Sales Pipeline System",
      ar: "نظام مسار المبيعات",
    },
    v: 500,
  },
  {
    t: {
      en: "Lead Nurturing Engine",
      ar: "محرك رعاية العملاء",
    },
    v: 750,
  },
  {
    t: {
      en: "Database Reactivation",
      ar: "إعادة تنشيط قاعدة البيانات",
    },
    v: 750,
  },
  {
    t: {
      en: "Appointment Automation",
      ar: "أتمتة المواعيد",
    },
    v: 500,
  },
  {
    t: {
      en: "Reporting Dashboard",
      ar: "لوحة التقارير",
    },
    v: 500,
  },
  {
    t: {
      en: "Technical Management",
      ar: "الإدارة التقنية",
    },
    v: 1e3,
  },
  {
    t: {
      en: "Monthly Optimisation",
      ar: "تحسين شهري",
    },
    v: 750,
  },
];
function ValueSection() {
  let { t: e, money: t } = useLocale();
  return (
    <Section tone="sand">
      <SectionHeading>
        {e({
          en: "Everything Required to Build Your Revenue Infrastructure",
          ar: "كل ما يلزم لبناء البنية التحتية لإيراداتك",
        })}
      </SectionHeading>
      <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {VALUE_ITEMS.map((n) => (
          <div
            key={n.t.en}
            className="rounded-2xl border border-foreground/10 bg-background px-4 py-4"
          >
            <p className="text-sm font-semibold leading-snug">{e(n.t)}</p>
            <p className="mt-1.5 text-xs opacity-85">
              {t(n.v)}
              {e({
                en: "/month value",
                ar: " قيمة شهرية",
              })}
            </p>
          </div>
        ))}
      </div>
      <div className="mt-8 grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-foreground/15 bg-background p-7">
          <p className="text-[0.65rem] font-bold uppercase tracking-[0.18em] opacity-80">
            {e({
              en: "Total standalone value",
              ar: "إجمالي القيمة المنفصلة",
            })}
          </p>
          <p className="mt-2 font-display text-3xl font-bold line-through opacity-40">
            {t(8750)}+
          </p>
        </div>
        <div className="rounded-2xl bg-ink p-7 text-ink-foreground">
          <p className="text-[0.65rem] font-bold uppercase tracking-[0.18em] opacity-80">
            {e({
              en: "Your investment",
              ar: "استثمارك",
            })}
          </p>
          <p className="mt-2 font-display text-4xl font-bold">
            {e({
              en: "From ",
              ar: "من ",
            })}
            {t(2500)}
            <span className="text-base opacity-90">
              {e({
                en: "/month",
                ar: " شهرياً",
              })}
            </span>
          </p>
        </div>
      </div>
      <p className="mt-4 text-[0.72rem] opacity-80">
        {e({
          en: "Illustrative standalone service value — not a quoted market price.",
          ar: "قيمة توضيحية للخدمات المنفصلة، وليست أسعار سوق فعلية.",
        })}
      </p>
    </Section>
  );
}
const COMPARISON_ROWS = [
  [
    {
      en: "Separate CRM",
      ar: "نظام عملاء منفصل",
    },
    {
      en: "One CRM",
      ar: "نظام واحد",
    },
  ],
  [
    {
      en: "WhatsApp on employee phones",
      ar: "واتساب على هواتف الموظفين",
    },
    {
      en: "Central WhatsApp communication",
      ar: "تواصل واتساب مركزي",
    },
  ],
  [
    {
      en: "Separate email platform",
      ar: "منصة بريد منفصلة",
    },
    {
      en: "Automated campaigns",
      ar: "حملات مؤتمتة",
    },
  ],
  [
    {
      en: "Manual follow-up",
      ar: "متابعة يدوية",
    },
    {
      en: "Automated follow-up",
      ar: "متابعة تلقائية",
    },
  ],
  [
    {
      en: "Separate booking software",
      ar: "برنامج حجز منفصل",
    },
    {
      en: "Integrated booking",
      ar: "حجز مدمج",
    },
  ],
  [
    {
      en: "Spreadsheet reporting",
      ar: "تقارير على إكسل",
    },
    {
      en: "Live dashboards",
      ar: "لوحات لحظية",
    },
  ],
  [
    {
      en: "Leads manually assigned",
      ar: "توزيع يدوي للعملاء",
    },
    {
      en: "Automatic routing",
      ar: "توجيه تلقائي",
    },
  ],
  [
    {
      en: "No database nurturing",
      ar: "لا رعاية لقاعدة البيانات",
    },
    {
      en: "Continuous nurturing",
      ar: "رعاية مستمرة",
    },
  ],
  [
    {
      en: "No AI qualification",
      ar: "لا تأهيل ذكي",
    },
    {
      en: "AI qualification",
      ar: "تأهيل بالذكاء الاصطناعي",
    },
  ],
  [
    {
      en: "Multiple vendors",
      ar: "موردون متعددون",
    },
    {
      en: "One managed platform",
      ar: "منصة واحدة مُدارة",
    },
  ],
  [
    {
      en: "Nobody owns the whole system",
      ar: "لا أحد مسؤول عن النظام كاملاً",
    },
    {
      en: "One team responsible",
      ar: "فريق واحد مسؤول",
    },
  ],
];
function ComparisonSection() {
  let { t: e } = useLocale();
  return (
    <Section>
      <SectionHeading>
        {e({
          en: "The Old Way vs The Revenue OS Way",
          ar: "الطريقة القديمة مقابل نظام الإيرادات",
        })}
      </SectionHeading>
      <div className="mt-10 overflow-hidden rounded-2xl border border-border">
        <div className="grid grid-cols-2 bg-sand text-[0.68rem] font-bold uppercase tracking-[0.16em]">
          <div className="p-4 opacity-50">
            {e({
              en: "Old Way",
              ar: "الطريقة القديمة",
            })}
          </div>
          <div className="p-4">AI Revenue OS</div>
        </div>
        {COMPARISON_ROWS.map(([t, n], r) => (
          <div
            key={t.en}
            className={`grid grid-cols-2 border-t border-border text-sm ${r % 2 ? "bg-card" : "bg-background"}`}
          >
            <div className="p-4 opacity-50 line-through decoration-foreground/20">
              {e(t)}
            </div>
            <div className="border-s border-border p-4 font-medium">{e(n)}</div>
          </div>
        ))}
      </div>
    </Section>
  );
}
const MANAGED_ITEMS = [
  {
    en: "Revenue workflow mapping",
    ar: "رسم مسار الإيرادات",
  },
  {
    en: "CRM configuration",
    ar: "إعداد النظام",
  },
  {
    en: "Pipeline setup",
    ar: "بناء مسار المبيعات",
  },
  {
    en: "WhatsApp integration",
    ar: "ربط واتساب",
  },
  {
    en: "Lead-source integrations",
    ar: "ربط مصادر العملاء",
  },
  {
    en: "AI Agent configuration",
    ar: "إعداد الوكيل الذكي",
  },
  {
    en: "Business knowledge training",
    ar: "تدريب النظام على معلومات عملك",
  },
  {
    en: "Automation setup",
    ar: "إعداد الأتمتة",
  },
  {
    en: "Follow-up sequences",
    ar: "تسلسلات المتابعة",
  },
  {
    en: "Calendar setup",
    ar: "إعداد التقويم",
  },
  {
    en: "Dashboard configuration",
    ar: "إعداد اللوحات",
  },
  {
    en: "Team onboarding",
    ar: "تدريب الفريق",
  },
  {
    en: "Ongoing optimisation",
    ar: "تحسين مستمر",
  },
  {
    en: "Technical support",
    ar: "دعم تقني",
  },
];
function ManagedSection() {
  let { t: e } = useLocale();
  return (
    <Section tone="dark">
      <SectionHeading className="text-ink-foreground">
        <span className="line">
          {e({
            en: "We Don’t Get Paid for Activity.",
            ar: "لا نتقاضى أجراً على النشاط.",
          })}
        </span>
        <span className="line text-ink-foreground/80">
          {e({
            en: "We Get Paid for Outcomes.",
            ar: "نتقاضى أجراً على النتائج.",
          })}
        </span>
      </SectionHeading>
      <ul className="mt-10 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
        {MANAGED_ITEMS.map((t) => (
          <Bullet key={t.en}>{e(t)}</Bullet>
        ))}
      </ul>
      <p className="mt-10 font-display text-2xl font-bold tracking-tight md:text-4xl">
        {e({
          en: "Your team uses the system. Our team manages the machinery behind it.",
          ar: "فريقك يستخدم النظام. وفريقنا يدير المحرك خلفه.",
        })}
      </p>
    </Section>
  );
}
const WEEK_PLAN = [
  {
    w: {
      en: "Week 1",
      ar: "الأسبوع ١",
    },
    t: {
      en: "Revenue Audit",
      ar: "تدقيق الإيرادات",
    },
    items: [
      {
        en: "Lead sources",
        ar: "مصادر العملاء",
      },
      {
        en: "Sales process",
        ar: "عملية البيع",
      },
      {
        en: "Customer journey",
        ar: "رحلة العميل",
      },
      {
        en: "Existing tools",
        ar: "الأدوات الحالية",
      },
      {
        en: "Follow-up gaps",
        ar: "ثغرات المتابعة",
      },
    ],
  },
  {
    w: {
      en: "Week 2",
      ar: "الأسبوع ٢",
    },
    t: {
      en: "Build",
      ar: "البناء",
    },
    items: [
      {
        en: "CRM",
        ar: "النظام",
      },
      {
        en: "Pipeline",
        ar: "المسار",
      },
      {
        en: "Integrations",
        ar: "التكاملات",
      },
      {
        en: "WhatsApp",
        ar: "واتساب",
      },
      {
        en: "Calendars",
        ar: "التقويمات",
      },
      {
        en: "Lead routing",
        ar: "توجيه العملاء",
      },
    ],
  },
  {
    w: {
      en: "Week 3",
      ar: "الأسبوع ٣",
    },
    t: {
      en: "Automate",
      ar: "الأتمتة",
    },
    items: [
      {
        en: "AI Agent",
        ar: "الوكيل الذكي",
      },
      {
        en: "Follow-up",
        ar: "المتابعة",
      },
      {
        en: "Nurturing",
        ar: "الرعاية",
      },
      {
        en: "Reminders",
        ar: "التذكيرات",
      },
      {
        en: "Reactivation",
        ar: "إعادة التنشيط",
      },
    ],
  },
  {
    w: {
      en: "Week 4",
      ar: "الأسبوع ٤",
    },
    t: {
      en: "Optimise",
      ar: "التحسين",
    },
    items: [
      {
        en: "Train team",
        ar: "تدريب الفريق",
      },
      {
        en: "Launch dashboards",
        ar: "إطلاق اللوحات",
      },
      {
        en: "Test conversations",
        ar: "اختبار المحادثات",
      },
      {
        en: "Improve AI",
        ar: "تحسين الذكاء الاصطناعي",
      },
      {
        en: "Activate campaigns",
        ar: "تفعيل الحملات",
      },
    ],
  },
];
function WeeksSection() {
  let { t: e } = useLocale();
  return (
    <Section tone="sand">
      <SectionHeading>
        {e({
          en: "From Fragmented Tools To One Revenue System",
          ar: "من أدوات مبعثرة إلى نظام إيرادات واحد",
        })}
      </SectionHeading>
      <div className="mt-10 grid gap-4 md:grid-cols-4">
        {WEEK_PLAN.map((t) => (
          <div
            key={t.w.en}
            className="rounded-2xl border border-foreground/10 bg-background p-6"
          >
            <p className="text-[0.62rem] font-bold uppercase tracking-[0.18em] text-accent-strong">
              {e(t.w)}
            </p>
            <h3 className="mt-2 font-display text-lg font-bold tracking-tight">
              {e(t.t)}
            </h3>
            <ul className="mt-4 grid gap-1.5 text-[0.82rem] opacity-90">
              {t.items.map((t) => (
                <li key={t.en}>{e(t)}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </Section>
  );
}
function IndustryIcon({ name }: { name: string }) {
  const common = {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.7,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    className: "size-5",
    "aria-hidden": true,
  };
  if (name === "Real Estate") {
    return (
      <svg {...common}>
        <path d="M4 20V9l8-5 8 5v11" />
        <path d="M9 20v-6h6v6" />
      </svg>
    );
  }
  if (name === "Clinics & Healthcare") {
    return (
      <svg {...common}>
        <path d="M12 21s-7-4.4-7-10a4 4 0 0 1 7-2 4 4 0 0 1 7 2c0 5.6-7 10-7 10z" />
      </svg>
    );
  }
  if (name === "Education") {
    return (
      <svg {...common}>
        <path d="M3 8 12 4l9 4-9 4-9-4z" />
        <path d="M7 10.5V16c1.6 1.2 3.3 1.8 5 1.8s3.4-.6 5-1.8v-5.5" />
      </svg>
    );
  }
  if (name === "Professional Services") {
    return (
      <svg {...common}>
        <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
        <path d="M4 7h16v11a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7z" />
      </svg>
    );
  }
  if (name === "Automotive") {
    return (
      <svg {...common}>
        <path d="M4 15h16l-1.4-4.2A2 2 0 0 0 16.7 9H7.3a2 2 0 0 0-1.9 1.8L4 15z" />
        <path d="M6 15v2M18 15v2" />
        <circle cx="7.5" cy="16.5" r="1.2" />
        <circle cx="16.5" cy="16.5" r="1.2" />
      </svg>
    );
  }
  if (name === "Home Services") {
    return (
      <svg {...common}>
        <path d="M4 11 12 4l8 7" />
        <path d="M6 10.5V20h12v-9.5" />
      </svg>
    );
  }
  if (name === "Hospitality") {
    return (
      <svg {...common}>
        <path d="M4 18V9a2 2 0 0 1 2-2h7v11" />
        <path d="M13 11h5a2 2 0 0 1 2 2v5" />
        <path d="M4 18h16" />
      </svg>
    );
  }
  if (name === "Travel & Tourism") {
    return (
      <svg {...common}>
        <path d="M3 12h18" />
        <path d="M12 3a14 14 0 0 1 0 18" />
        <path d="M12 3a14 14 0 0 0 0 18" />
        <circle cx="12" cy="12" r="9" />
      </svg>
    );
  }
  if (name === "Consultancies") {
    return (
      <svg {...common}>
        <path d="M8 18v-1a4 4 0 0 1 4-4h0a4 4 0 0 1 4 4v1" />
        <circle cx="12" cy="8" r="3" />
        <path d="M5 19h14" />
      </svg>
    );
  }
  if (name === "Recruitment") {
    return (
      <svg {...common}>
        <circle cx="8" cy="9" r="2.5" />
        <circle cx="16" cy="9" r="2.5" />
        <path d="M4 18a4 4 0 0 1 8 0" />
        <path d="M12 18a4 4 0 0 1 8 0" />
      </svg>
    );
  }
  if (name === "B2B Services") {
    return (
      <svg {...common}>
        <path d="M4 20V8h6V4h4v4h6v12" />
        <path d="M9 12h.01M12 12h.01M15 12h.01M9 16h.01M12 16h.01M15 16h.01" />
      </svg>
    );
  }
  return (
    <svg {...common}>
      <path d="M6 14c1.5-3 3-4 6-4s4.5 1 6 4" />
      <path d="M8 18c1-2 2.2-3 4-3s3 1 4 3" />
      <circle cx="12" cy="7" r="2" />
    </svg>
  );
}

const INDUSTRIES = [
  {
    en: "Real Estate",
    ar: "العقارات",
  },
  {
    en: "Clinics & Healthcare",
    ar: "العيادات والرعاية الصحية",
  },
  {
    en: "Education",
    ar: "التعليم",
  },
  {
    en: "Professional Services",
    ar: "الخدمات المهنية",
  },
  {
    en: "Automotive",
    ar: "السيارات",
  },
  {
    en: "Home Services",
    ar: "خدمات المنازل",
  },
  {
    en: "Hospitality",
    ar: "الضيافة",
  },
  {
    en: "Travel & Tourism",
    ar: "السفر والسياحة",
  },
  {
    en: "Consultancies",
    ar: "الاستشارات",
  },
  {
    en: "Recruitment",
    ar: "التوظيف",
  },
  {
    en: "B2B Services",
    ar: "خدمات الشركات",
  },
  {
    en: "Fitness & Wellness",
    ar: "اللياقة والعافية",
  },
];
function SolutionsSection() {
  let { t: e } = useLocale();
  return (
    <Section id="solutions">
      <Eyebrow>
        {e({
          en: "Industries",
          ar: "القطاعات",
        })}
      </Eyebrow>
      <SectionHeading>
        {e({
          en: "Industries We Serve — Where Every Lead Matters",
          ar: "القطاعات التي نخدمها — حيث يهم كل عميل محتمل",
        })}
      </SectionHeading>
      <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {INDUSTRIES.map((t) => (
          <a
            key={t.en}
            href="#audit"
            className="group rounded-2xl border border-border bg-card p-5 transition-all hover:-translate-y-0.5 hover:border-foreground/30 hover:shadow-[0_16px_40px_-28px_rgba(0,0,0,0.55)]"
          >
            <span className="mb-4 grid size-10 place-items-center rounded-xl bg-sand text-foreground">
              <IndustryIcon name={t.en} />
            </span>
            <h3 className="font-display text-sm font-bold tracking-tight">
              {e(t)}
            </h3>
            <p className="mt-3 text-[0.72rem] font-semibold text-accent-strong opacity-80 group-hover:opacity-100">
              {e({
                en: "See Industry Solution →",
                ar: "شاهد حل القطاع ←",
              })}
            </p>
          </a>
        ))}
      </div>
      <div className="mt-12">
        <CtaLink>
          {e({
            en: "Book Free Revenue Audit",
            ar: "احجز تدقيق الإيرادات المجاني",
          })}
        </CtaLink>
      </div>
    </Section>
  );
}
function AgencySection() {
  let { t: e } = useLocale();
  return (
    <Section tone="sand">
      <SectionHeading>
        {e({
          en: "More Than A CRM Agency.",
          ar: "أكثر من مجرد وكالة أنظمة.",
        })}
      </SectionHeading>
      <div className="mt-10 grid gap-4 md:grid-cols-3">
        {[
          {
            t: {
              en: "Technology",
              ar: "التقنية",
            },
            items: [
              {
                en: "CRM",
                ar: "نظام إدارة العملاء",
              },
              {
                en: "AI",
                ar: "الذكاء الاصطناعي",
              },
              {
                en: "Automation",
                ar: "الأتمتة",
              },
              {
                en: "Integrations",
                ar: "التكاملات",
              },
              {
                en: "Dashboards",
                ar: "اللوحات",
              },
            ],
          },
          {
            t: {
              en: "Revenue",
              ar: "الإيرادات",
            },
            items: [
              {
                en: "Lead management",
                ar: "إدارة العملاء",
              },
              {
                en: "Nurturing",
                ar: "الرعاية",
              },
              {
                en: "Sales processes",
                ar: "عمليات البيع",
              },
              {
                en: "Conversion",
                ar: "التحويل",
              },
              {
                en: "Reactivation",
                ar: "إعادة التنشيط",
              },
            ],
          },
          {
            t: {
              en: "Managed Service",
              ar: "خدمة مُدارة",
            },
            items: [
              {
                en: "Implementation",
                ar: "التنفيذ",
              },
              {
                en: "Training",
                ar: "التدريب",
              },
              {
                en: "Support",
                ar: "الدعم",
              },
              {
                en: "Optimisation",
                ar: "التحسين",
              },
              {
                en: "Campaign management",
                ar: "إدارة الحملات",
              },
            ],
          },
        ].map((t) => (
          <div
            key={t.t.en}
            className="rounded-2xl border border-foreground/10 bg-background p-7"
          >
            <h3 className="font-display text-[0.7rem] font-bold uppercase tracking-[0.18em] text-accent-strong">
              {e(t.t)}
            </h3>
            <ul className="mt-4 grid gap-2 text-sm opacity-90">
              {t.items.map((t) => (
                <li key={t.en}>{e(t)}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <p className="mt-10 font-display text-2xl font-bold tracking-tight md:text-4xl">
        {e({
          en: "Technology + Revenue Strategy + Managed Execution",
          ar: "تقنية + استراتيجية إيرادات + تنفيذ مُدار",
        })}
      </p>
    </Section>
  );
}
function GuaranteeSection() {
  let { t: e } = useLocale();
  return (
    <Section>
      <div className="rounded-3xl border border-border bg-card p-8 md:p-12">
        <Eyebrow>
          {e({
            en: "Implementation guarantee",
            ar: "ضمان التنفيذ",
          })}
        </Eyebrow>
        <SectionHeading>
          {e({
            en: "We Don't Stop At “Installed.”",
            ar: "لا نتوقف عند «تم التركيب».",
          })}
        </SectionHeading>
        <SectionText>
          {e({
            en: "We work with your team until the agreed core integrations, pipelines, workflows and automations included in your package are operational.",
            ar: "نعمل مع فريقك حتى تصبح التكاملات والمسارات وسير العمل والأتمتة المتفق عليها ضمن باقتك جاهزة وتعمل فعلياً.",
          })}
        </SectionText>
        <p className="mt-6 font-display text-xl font-bold tracking-tight md:text-2xl">
          {e({
            en: "The goal isn't software installation. It's adoption.",
            ar: "الهدف ليس تركيب برنامج، بل تبنّيه فعلياً.",
          })}
        </p>
      </div>
    </Section>
  );
}
const CONSULTATION_CTA = {
  en: "Start Your Free Consultation",
  ar: "ابدأ استشارتك المجانية",
};

type PricingPlan = {
  name: Copy;
  badge: Copy;
  for: Copy;
  price: number;
  popular?: boolean;
  ribbon?: boolean;
  intro: Copy;
  items: Copy[];
  note?: Copy;
};

const SOFTWARE_PLANS: PricingPlan[] = [
  {
    name: { en: "Starter", ar: "الأساسية" },
    badge: { en: "Foundation", ar: "التأسيس" },
    for: {
      en: "The essentials to capture, organize and follow up every lead.",
      ar: "الأساسيات لالتقاط كل عميل وتنظيمه ومتابعته.",
    },
    price: 2500,
    intro: { en: "Includes", ar: "تشمل" },
    items: [
      { en: "CRM & sales pipeline", ar: "نظام العملاء ومسار المبيعات" },
      { en: "Unified conversations inbox", ar: "صندوق محادثات موحّد" },
      { en: "Forms & lead capture", ar: "نماذج والتقاط العملاء" },
      { en: "Appointment booking", ar: "حجز المواعيد" },
      { en: "Lead source tracking", ar: "تتبع مصادر العملاء" },
      { en: "1 landing page / funnel", ar: "صفحة مقصودة / قمع واحد" },
      { en: "Email nurture & speed to lead", ar: "رعاية بالبريد وسرعة الرد" },
      { en: "Basic routing & reporting", ar: "توجيه وتقارير أساسية" },
      { en: "2 lead connectors", ar: "موصّلان للعملاء" },
      { en: "1 location", ar: "موقع واحد" },
    ],
    note: {
      en: "WhatsApp available as an add-on.",
      ar: "واتساب متاح كإضافة اختيارية.",
    },
  },
  {
    name: { en: "Professional", ar: "الاحترافية" },
    badge: { en: "Recommended", ar: "موصى بها" },
    for: {
      en: "For teams that want stronger automation, recovery and conversion workflows.",
      ar: "للفرق التي تريد أتمتة أقوى ومسارات استرجاع وتحويل أفضل.",
    },
    price: 3500,
    popular: true,
    intro: {
      en: "Everything in Starter, plus",
      ar: "كل ما في الأساسية، بالإضافة إلى",
    },
    items: [
      { en: "WhatsApp integration", ar: "ربط واتساب" },
      { en: "Up to 3 landing pages / funnels", ar: "حتى 3 صفحات / قنوات" },
      { en: "Advanced lead routing", ar: "توجيه متقدم للعملاء" },
      { en: "Missed call recovery", ar: "استرجاع المكالمات الفائتة" },
      { en: "No-show recovery", ar: "استرجاع الغائبين عن المواعيد" },
      { en: "Quote / proposal follow-up", ar: "متابعة العروض والأسعار" },
      { en: "Database reactivation", ar: "إعادة تنشيط القاعدة" },
      { en: "Social media planner", ar: "مخطط وسائل التواصل" },
      { en: "Conversation AI – Basic", ar: "ذكاء المحادثة — أساسي" },
      { en: "5 lead connectors", ar: "5 موصّلات للعملاء" },
      { en: "3 locations*", ar: "3 مواقع*" },
    ],
    note: {
      en: "Best fit for most growing sales teams.",
      ar: "الأنسب لمعظم فرق المبيعات النامية.",
    },
  },
  {
    name: { en: "Elite", ar: "النخبة" },
    badge: { en: "Advanced AI", ar: "ذكاء متقدم" },
    for: {
      en: "Advanced AI agents and automation across the full sales journey.",
      ar: "وكلاء ذكاء وأتمتة متقدمة عبر رحلة المبيعات كاملة.",
    },
    price: 5000,
    intro: {
      en: "Everything in Professional, plus",
      ar: "كل ما في الاحترافية، بالإضافة إلى",
    },
    items: [
      { en: "Conversation AI – Advanced", ar: "ذكاء المحادثة — متقدم" },
      { en: "AI lead qualification", ar: "تأهيل العملاء بالذكاء الاصطناعي" },
      { en: "AI appointment booking", ar: "حجز مواعيد بالذكاء الاصطناعي" },
      { en: "AI WhatsApp sales agent", ar: "وكيل مبيعات واتساب ذكي" },
      {
        en: "AI voice receptionist / sales agent",
        ar: "موظف استقبال / مبيعات صوتي ذكي",
      },
      { en: "AI missed-lead recovery", ar: "استرجاع العملاء الفائتين بالذكاء" },
      { en: "AI follow-up & reactivation", ar: "متابعة وإعادة تنشيط ذكية" },
      { en: "Up to 5 landing pages / funnels", ar: "حتى 5 صفحات / قنوات" },
      { en: "10 lead connectors", ar: "10 موصّلات للعملاء" },
      { en: "Up to 3 locations*", ar: "حتى 3 مواقع*" },
    ],
    note: {
      en: "Built for high-volume and multi-location teams.",
      ar: "مصمم للفرق ذات الحجم الكبير والمواقع المتعددة.",
    },
  },
];

const AGENT_PLANS: PricingPlan[] = [
  {
    name: {
      en: "Starter + Human Agents",
      ar: "الأساسية + وكلاء بشريون",
    },
    badge: { en: "Essential Team", ar: "فريق أساسي" },
    for: {
      en: "Sales OS with an essential execution team behind it.",
      ar: "نظام المبيعات مع فريق تنفيذ أساسي خلفه.",
    },
    price: 5000,
    intro: { en: "Includes", ar: "تشمل" },
    items: [
      { en: "Sales & Marketing OS", ar: "نظام المبيعات والتسويق" },
      { en: "Digital Advertising Specialist", ar: "أخصائي إعلانات رقمية" },
      { en: "Graphic Designer", ar: "مصمم جرافيك" },
      { en: "CRM Expert", ar: "خبير أنظمة العملاء" },
      { en: "Social Media Manager", ar: "مدير وسائل التواصل" },
      { en: "Monthly Optimization", ar: "تحسين شهري" },
    ],
  },
  {
    name: {
      en: "Pro + Human Agents",
      ar: "الاحترافية + وكلاء بشريون",
    },
    badge: { en: "Full Growth Team", ar: "فريق نمو كامل" },
    for: {
      en: "A full growth team to accelerate pipeline and creative output.",
      ar: "فريق نمو كامل لتسريع المسار والمخرجات الإبداعية.",
    },
    price: 7500,
    popular: true,
    ribbon: true,
    intro: {
      en: "Everything in Starter + Human Agents, plus",
      ar: "كل ما في الأساسية + الوكلاء، بالإضافة إلى",
    },
    items: [
      { en: "SEO Specialist", ar: "أخصائي تحسين محركات البحث" },
      { en: "Video Editor", ar: "محرر فيديو" },
      { en: "Appointment Setter", ar: "مسؤول حجز المواعيد" },
      { en: "Data & Admin Support", ar: "دعم بيانات وإدارة" },
      { en: "Advanced Reporting", ar: "تقارير متقدمة" },
    ],
  },
  {
    name: {
      en: "Elite + Human Agents",
      ar: "النخبة + وكلاء بشريون",
    },
    badge: { en: "Scale Team", ar: "فريق التوسع" },
    for: {
      en: "Full coverage for teams scaling across roles and markets.",
      ar: "تغطية كاملة للفرق المتوسعة عبر الأدوار والأسواق.",
    },
    price: 10000,
    intro: {
      en: "Everything in Pro + Human Agents, plus",
      ar: "كل ما في الاحترافية + الوكلاء، بالإضافة إلى",
    },
    items: [
      { en: "Higher Creative Capacity", ar: "سعة إبداعية أعلى" },
      { en: "AI Agents", ar: "وكلاء ذكاء اصطناعي" },
      { en: "Full 8-role coverage", ar: "تغطية كاملة لـ 8 أدوار" },
      { en: "Advanced Automation", ar: "أتمتة متقدمة" },
      { en: "Priority coordination", ar: "تنسيق بأولوية" },
    ],
  },
];

function PricingCard({
  plan,
  money,
  t,
}: {
  plan: PricingPlan;
  money: (amount: number) => string;
  t: (copy: Copy) => string;
}) {
  return (
    <div
      className={`relative flex flex-col rounded-3xl border p-7 ${plan.popular ? "border-transparent bg-ink text-ink-foreground" : "border-border bg-card"}`}
    >
      {plan.ribbon && (
        <span className="absolute -top-3 start-7 rounded-full bg-accent-strong px-3 py-1 text-[0.6rem] font-bold uppercase tracking-[0.16em] text-background">
          {t({
            en: "Most Popular",
            ar: "الأكثر طلباً",
          })}
        </span>
      )}
      <p className="text-[0.68rem] font-bold uppercase tracking-[0.16em] text-accent-strong">
        {t(plan.badge)}
      </p>
      <h3 className="mt-2 font-display text-xl font-bold tracking-tight">
        {t(plan.name)}
      </h3>
      <p className="mt-3 text-sm opacity-90">{t(plan.for)}</p>
      <p className="mt-5 font-display text-3xl font-bold tracking-tight">
        {money(plan.price)}
        <span className="text-sm font-medium opacity-80">
          {t({
            en: " / month",
            ar: " / شهرياً",
          })}
        </span>
      </p>
      <CtaLink
        variant={plan.popular ? "light" : "primary"}
        className="mt-6 w-full"
        href="#audit"
      >
        {t(CONSULTATION_CTA)}
      </CtaLink>
      <p className="mt-6 text-[0.65rem] font-bold uppercase tracking-[0.16em] opacity-80">
        {t(plan.intro)}
      </p>
      <ul className="mt-3 grid flex-1 gap-2.5">
        {plan.items.map((item) => (
          <Bullet key={item.en}>{t(item)}</Bullet>
        ))}
      </ul>
      {plan.note && (
        <p className="mt-5 text-[0.78rem] opacity-85">{t(plan.note)}</p>
      )}
    </div>
  );
}

function PricingSection() {
  let { t: e, money: t, country: n, setCountry: r } = useLocale();
  return (
    <Section id="pricing">
      <SectionHeading>
        <span className="line">
          {e({
            en: "Your Complete Revenue Infrastructure.",
            ar: "بنية إيراداتك الكاملة.",
          })}
        </span>
        <span className="line text-foreground/75">
          {e({
            en: "For Less Than The Cost Of One Employee.",
            ar: "بأقل من تكلفة موظف واحد.",
          })}
        </span>
      </SectionHeading>
      <div className="mt-8 flex flex-wrap gap-2">
        {GCC_MARKETS.map((market) => (
          <button
            key={market.code}
            onClick={() => r(market.code)}
            className={`rounded-full border px-4 py-2 text-[0.78rem] font-semibold transition-colors ${n === market.code ? "border-transparent bg-foreground text-background" : "border-border bg-card opacity-70 hover:opacity-100"}`}
          >
            {market.flag}{" "}
            {e({
              en: `${market.short} · ${market.currencyEn}`,
              ar: `${market.ar} · ${market.currencyAr}`,
            })}
          </button>
        ))}
      </div>
      <div className="mt-8 grid gap-4 lg:grid-cols-3">
        {SOFTWARE_PLANS.map((plan) => (
          <PricingCard key={plan.name.en} plan={plan} money={t} t={e} />
        ))}
      </div>
      <p className="mt-12 font-display text-xl font-bold tracking-tight md:text-2xl">
        {e({
          en: "Sales OS + Human Agents",
          ar: "نظام المبيعات + وكلاء بشريون",
        })}
      </p>
      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        {AGENT_PLANS.map((plan) => (
          <PricingCard key={plan.name.en} plan={plan} money={t} t={e} />
        ))}
      </div>
      <p className="mt-6 max-w-2xl text-[0.78rem] leading-relaxed opacity-85">
        {e({
          en: "Usage-based WhatsApp, SMS, email, telephony and AI consumption may be billed separately depending on usage. No hidden software maze. No need to assemble multiple platforms yourself.",
          ar: "قد تُحتسب رسوم استهلاك واتساب والرسائل والبريد والاتصالات والذكاء الاصطناعي بشكل منفصل حسب الاستخدام. بلا متاهة برامج خفية، ودون حاجة لتجميع منصات متعددة بنفسك.",
        })}
      </p>
    </Section>
  );
}
const ADDONS = [
  {
    en: "AI Voice Agent",
    ar: "وكيل صوتي ذكي",
  },
  {
    en: "Outbound Lead Engine",
    ar: "محرك العملاء الصادر",
  },
  {
    en: "Custom Landing Pages",
    ar: "صفحات مقصودة مخصصة",
  },
  {
    en: "Performance Marketing",
    ar: "تسويق الأداء",
  },
  {
    en: "Custom AI Agents",
    ar: "وكلاء ذكاء مخصصون",
  },
  {
    en: "Custom Integrations",
    ar: "تكاملات مخصصة",
  },
  {
    en: "AI Customer Support",
    ar: "دعم عملاء بالذكاء الاصطناعي",
  },
  {
    en: "Advanced BI Dashboard",
    ar: "لوحة تحليلات متقدمة",
  },
  {
    en: "Custom Mobile App",
    ar: "تطبيق جوال مخصص",
  },
  {
    en: "Sales Team AI Copilot",
    ar: "مساعد ذكي لفريق المبيعات",
  },
];
function AddonsSection() {
  let { t: e } = useLocale();
  return (
    <Section tone="sand">
      <Eyebrow>
        {e({
          en: "Optional add-ons",
          ar: "إضافات اختيارية",
        })}
      </Eyebrow>
      <SectionHeading>
        {e({
          en: "Extend The System As You Grow",
          ar: "وسّع النظام مع نمو أعمالك",
        })}
      </SectionHeading>
      <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {ADDONS.map((t) => (
          <div
            key={t.en}
            className="rounded-2xl border border-foreground/10 bg-background p-5 text-sm font-semibold"
          >
            {e(t)}
          </div>
        ))}
      </div>
    </Section>
  );
}
function CalculatorSection() {
  let { t: e, money: t } = useLocale(),
    [n, a] = useState(200),
    [o, c] = useState(8),
    [l, u] = useState(6e3),
    [d, f] = useState(45),
    [p, m] = useState(40),
    h = useMemo(() => {
      let e = (o / 100) * n * l,
        t = Math.round((p / 100) * n),
        r = d > 30 ? 0.35 : d > 10 ? 0.2 : 0.1,
        i = Math.round(t * 0.28),
        a = (o / 100) * t * (1 + r);
      return {
        current: e,
        recovered: t,
        extraAppointments: i,
        uplift: Math.round(a * l),
      };
    }, [n, o, l, d, p]),
    g = [
      {
        l: {
          en: "Monthly leads",
          ar: "العملاء شهرياً",
        },
        v: n,
        set: a,
        min: 10,
        max: 2e3,
        step: 10,
      },
      {
        l: {
          en: "Current conversion %",
          ar: "نسبة التحويل الحالية %",
        },
        v: o,
        set: c,
        min: 1,
        max: 60,
        step: 1,
      },
      {
        l: {
          en: "Average customer value",
          ar: "متوسط قيمة العميل",
        },
        v: l,
        set: u,
        min: 500,
        max: 2e5,
        step: 500,
      },
      {
        l: {
          en: "Current response time (min)",
          ar: "زمن الرد الحالي (دقيقة)",
        },
        v: d,
        set: f,
        min: 1,
        max: 240,
        step: 1,
      },
      {
        l: {
          en: "Unfollowed leads %",
          ar: "نسبة العملاء غير المتابَعين %",
        },
        v: p,
        set: m,
        min: 0,
        max: 90,
        step: 5,
      },
    ];
  return (
    <Section>
      <SectionHeading>
        {e({
          en: "How Much Revenue Could Be Hiding In Your Existing Leads?",
          ar: "كم من الإيرادات مخبأة في عملائك الحاليين؟",
        })}
      </SectionHeading>
      <div className="mt-10 grid gap-4 lg:grid-cols-2">
        <Card className="grid gap-5">
          {g.map((t) => (
            <div key={t.l.en}>
              <div className="flex justify-between text-[0.8rem] font-medium">
                <span className="opacity-85">{e(t.l)}</span>
                <span className="font-bold">{t.v.toLocaleString()}</span>
              </div>
              <input
                type="range"
                min={t.min}
                max={t.max}
                step={t.step}
                value={t.v}
                onChange={(e) => t.set(Number(e.target.value))}
                className="mt-2 h-1.5 w-full cursor-pointer appearance-none rounded-full bg-sand-deep accent-foreground"
              />
            </div>
          ))}
        </Card>
        <div className="rounded-2xl bg-ink p-7 text-ink-foreground">
          <div className="grid gap-5">
            {[
              {
                l: {
                  en: "Current monthly revenue",
                  ar: "الإيراد الشهري الحالي",
                },
                v: t(Math.round(h.current)),
              },
              {
                l: {
                  en: "Recoverable opportunities",
                  ar: "فرص قابلة للاسترجاع",
                },
                v: `${h.recovered}`,
              },
              {
                l: {
                  en: "Potential extra appointments",
                  ar: "مواعيد إضافية محتملة",
                },
                v: `${h.extraAppointments}`,
              },
              {
                l: {
                  en: "Potential revenue improvement",
                  ar: "تحسّن محتمل في الإيرادات",
                },
                v: `+${t(h.uplift)}`,
              },
            ].map((t, n) => (
              <div
                key={t.l.en}
                className="border-b border-white/10 pb-4 last:border-0"
              >
                <p className="text-[0.68rem] uppercase tracking-[0.16em] opacity-80">
                  {e(t.l)}
                </p>
                <p
                  className={`mt-1 font-display font-bold tracking-tight ${n === 3 ? "text-3xl text-whatsapp" : "text-2xl"}`}
                >
                  {t.v}
                </p>
              </div>
            ))}
          </div>
          <p className="mt-5 text-[0.7rem] opacity-80">
            {e({
              en: "Illustrative estimate only. Actual results vary by business.",
              ar: "تقدير توضيحي فقط. النتائج الفعلية تختلف حسب طبيعة كل نشاط.",
            })}
          </p>
          <CtaLink variant="light" className="mt-6 w-full">
            {e({
              en: "Get My Revenue Audit",
              ar: "احصل على تدقيق إيراداتي",
            })}
          </CtaLink>
        </div>
      </div>
      <SectionText className="mt-8">
        {e({
          en: "“Stop paying for leads your team forgets.”",
          ar: "«توقف عن الدفع مقابل عملاء ينساهم فريقك.»",
        })}
      </SectionText>
    </Section>
  );
}
const FAQS = [
  {
    q: {
      en: "Can I keep my existing website?",
      ar: "هل يمكنني الاحتفاظ بموقعي الحالي؟",
    },
    a: {
      en: "Yes. We connect your current website, forms and landing pages directly into the system.",
      ar: "نعم. نربط موقعك ونماذجك وصفحاتك الحالية مباشرة بالنظام.",
    },
  },
  {
    q: {
      en: "Can you integrate my existing CRM?",
      ar: "هل يمكن ربط نظامي الحالي؟",
    },
    a: {
      en: "In most cases yes — via native integrations, Zapier/Make, webhooks or API. We review this during the revenue audit.",
      ar: "في أغلب الحالات نعم، عبر التكاملات المباشرة أو Zapier/Make أو Webhooks أو الـAPI. نراجع ذلك خلال تدقيق الإيرادات.",
    },
  },
  {
    q: {
      en: "Can I use my existing WhatsApp number?",
      ar: "هل أستخدم رقم واتساب الحالي؟",
    },
    a: {
      en: "Usually yes, subject to WhatsApp Business Platform requirements and number migration rules.",
      ar: "عادةً نعم، وفق متطلبات منصة واتساب للأعمال وقواعد نقل الأرقام.",
    },
  },
  {
    q: {
      en: "Does the AI speak Arabic?",
      ar: "هل يتحدث الذكاء الاصطناعي العربية؟",
    },
    a: {
      en: "Yes — including natural Gulf business Arabic, and it can switch between Arabic and English based on how the customer writes.",
      ar: "نعم، بلغة عربية خليجية طبيعية، ويمكنه التبديل بين العربية والإنجليزية حسب لغة العميل.",
    },
  },
  {
    q: {
      en: "Will AI replace my sales team?",
      ar: "هل سيحل الذكاء الاصطناعي محل فريق المبيعات؟",
    },
    a: {
      en: "No. AI handles response, qualification, reminders and follow-up. Your team handles consultation, negotiation and closing.",
      ar: "لا. الذكاء الاصطناعي يتولى الرد والتأهيل والتذكير والمتابعة، وفريقك يتولى الاستشارة والتفاوض والإغلاق.",
    },
  },
  {
    q: {
      en: "Can my team take over an AI conversation?",
      ar: "هل يمكن لفريقي استلام المحادثة؟",
    },
    a: {
      en: "At any moment. Handoff can be manual or triggered automatically by intent, value or keywords.",
      ar: "في أي لحظة. يمكن التحويل يدوياً أو تلقائياً حسب نية العميل أو قيمة الصفقة أو كلمات محددة.",
    },
  },
  {
    q: {
      en: "Can I send WhatsApp campaigns?",
      ar: "هل يمكنني إرسال حملات واتساب؟",
    },
    a: {
      en: "Yes, using approved templates and segmented audiences, within WhatsApp policy.",
      ar: "نعم، باستخدام قوالب معتمدة وشرائح محددة، ضمن سياسات واتساب.",
    },
  },
  {
    q: {
      en: "Are WhatsApp messaging costs included?",
      ar: "هل تشمل الباقة تكاليف رسائل واتساب؟",
    },
    a: {
      en: "No. WhatsApp, SMS, telephony, email volume and AI consumption are usage-based and billed separately.",
      ar: "لا. رسوم واتساب والرسائل النصية والاتصالات وحجم البريد واستهلاك الذكاء الاصطناعي تُحتسب حسب الاستخدام وبشكل منفصل.",
    },
  },
  {
    q: {
      en: "Can you integrate Meta Lead Ads?",
      ar: "هل يمكن ربط إعلانات ميتا؟",
    },
    a: {
      en: "Yes — leads flow into the pipeline in real time and trigger instant response.",
      ar: "نعم، تصل العملاء إلى المسار لحظياً وتُفعّل رداً فورياً.",
    },
  },
  {
    q: {
      en: "Can you integrate Google Ads leads?",
      ar: "هل يمكن ربط عملاء إعلانات جوجل؟",
    },
    a: {
      en: "Yes — through lead form extensions, landing pages, call tracking or your website forms.",
      ar: "نعم، عبر نماذج الإعلانات أو الصفحات المقصودة أو تتبع المكالمات أو نماذج موقعك.",
    },
  },
  {
    q: {
      en: "Can it book appointments automatically?",
      ar: "هل يحجز المواعيد تلقائياً؟",
    },
    a: {
      en: "Yes, inside the conversation, synced to your team calendars with reminders and no-show recovery.",
      ar: "نعم، داخل المحادثة، مع مزامنة تقويم فريقك وتذكيرات واسترجاع للغائبين.",
    },
  },
  {
    q: {
      en: "Can you reactivate my existing database?",
      ar: "هل يمكن إعادة تنشيط قاعدة بياناتي؟",
    },
    a: {
      en: "Yes — that is often the fastest source of revenue in the first 60 days.",
      ar: "نعم، وغالباً ما تكون أسرع مصدر للإيرادات خلال أول ٦٠ يوماً.",
    },
  },
  {
    q: {
      en: "Can you build custom integrations?",
      ar: "هل تبنون تكاملات مخصصة؟",
    },
    a: {
      en: "Yes, on Scale plans or as an add-on, using APIs and webhooks.",
      ar: "نعم، ضمن باقة التوسع أو كإضافة، باستخدام واجهات API وWebhooks.",
    },
  },
  {
    q: {
      en: "How long does implementation take?",
      ar: "كم تستغرق مدة التنفيذ؟",
    },
    a: {
      en: "Typically four weeks: audit, build, automate, optimise.",
      ar: "عادةً أربعة أسابيع: تدقيق، بناء، أتمتة، تحسين.",
    },
  },
  {
    q: {
      en: "Do I need technical staff?",
      ar: "هل أحتاج فريقاً تقنياً؟",
    },
    a: {
      en: "No. We configure and manage the technical layer. Your team only uses the inbox, pipeline and dashboards.",
      ar: "لا. نتولى الجانب التقني بالكامل، وفريقك يستخدم صندوق الوارد والمسار واللوحات فقط.",
    },
  },
  {
    q: {
      en: "What happens if I cancel?",
      ar: "ماذا يحدث عند الإلغاء؟",
    },
    a: {
      en: "You export your contacts and conversation data, and we support an orderly handover of the assets included in your agreement.",
      ar: "تصدّر بيانات عملائك ومحادثاتك، وندعم تسليماً منظماً للأصول المشمولة باتفاقيتك.",
    },
  },
  {
    q: {
      en: "Who owns my customer data?",
      ar: "من يملك بيانات عملائي؟",
    },
    a: {
      en: "You do. Always.",
      ar: "أنت تملكها. دائماً.",
    },
  },
  {
    q: {
      en: "Do you support multiple branches?",
      ar: "هل تدعمون فروعاً متعددة؟",
    },
    a: {
      en: "Yes — multiple pipelines, teams, locations and routing rules on Scale.",
      ar: "نعم، مسارات وفرق وفروع وقواعد توجيه متعددة ضمن باقة التوسع.",
    },
  },
  {
    q: {
      en: "Can this work in both UAE and Saudi Arabia?",
      ar: "هل يعمل في الإمارات والسعودية؟",
    },
    a: {
      en: "Yes. We run bilingual setups across both markets with local currency, working hours and communication norms.",
      ar: "نعم. ننفذ إعدادات ثنائية اللغة في السوقين مع العملة المحلية وأوقات العمل وأساليب التواصل المناسبة.",
    },
  },
];
function FaqSection() {
  let { t: e } = useLocale(),
    [t, n] = useState<number | null>(0);
  return (
    <Section id="faq" tone="sand">
      <SectionHeading>
        {e({
          en: "Questions, Answered.",
          ar: "أسئلة وأجوبة.",
        })}
      </SectionHeading>
      <div className="mt-10 grid gap-2">
        {FAQS.map((r, a) => (
          <div
            key={r.q.en}
            className="overflow-hidden rounded-xl border border-foreground/10 bg-background"
          >
            <button
              onClick={() => n(t === a ? null : a)}
              className="flex w-full items-center justify-between gap-4 px-5 py-4 text-start"
            >
              <span className="text-sm font-semibold">{e(r.q)}</span>
              <span className="shrink-0 text-lg opacity-40">
                {t === a ? "−" : "+"}
              </span>
            </button>
            {t === a && (
              <p className="border-t border-foreground/10 px-5 py-4 text-sm leading-relaxed opacity-90">
                {e(r.a)}
              </p>
            )}
          </div>
        ))}
      </div>
    </Section>
  );
}
function AuditSection() {
  let { t: e, country: t } = useLocale(),
    [n, a] = useState(false);
  return (
    <Section id="audit">
      <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr]">
        <div>
          <Eyebrow>
            {e({
              en: "Free AI Revenue Leak Audit",
              ar: "تدقيق مجاني لتسرب الإيرادات",
            })}
          </Eyebrow>
          <SectionHeading>
            {e({
              en: "Find out where leads are disappearing between marketing and sales.",
              ar: "اكتشف أين يضيع عملاؤك بين التسويق والمبيعات.",
            })}
          </SectionHeading>
          <SectionText>
            {e({
              en: "Answer a few questions and our team will map your lead flow, response times and follow-up gaps — then show you what an automated system would change.",
              ar: "أجب عن بعض الأسئلة وسيقوم فريقنا برسم مسار عملائك وأزمنة الرد وثغرات المتابعة، ثم يوضح لك ما الذي سيغيّره نظام مؤتمت.",
            })}
          </SectionText>
          <p className="mt-8 font-display text-lg font-bold tracking-tight">
            {e({
              en: "“One customer. One history. One conversation.”",
              ar: "«عميل واحد. سجل واحد. محادثة واحدة.»",
            })}
          </p>
        </div>
        <div className="rounded-3xl border border-border bg-card p-6 md:p-8">
          {n ? (
            <div className="py-16 text-center">
              <p className="font-display text-2xl font-bold tracking-tight">
                {e({
                  en: "Request received.",
                  ar: "تم استلام طلبك.",
                })}
              </p>
              <p className="mt-3 text-sm opacity-90">
                {e({
                  en: "Our team will contact you on WhatsApp within one business day with your revenue leak assessment.",
                  ar: "سيتواصل معك فريقنا عبر واتساب خلال يوم عمل واحد بتقييم تسرب الإيرادات الخاص بك.",
                })}
              </p>
            </div>
          ) : (
            <form
              onSubmit={(e) => {
                (e.preventDefault(), a(true));
              }}
              className="grid gap-4 sm:grid-cols-2"
            >
              {[
                {
                  n: "name",
                  l: {
                    en: "Full Name",
                    ar: "الاسم الكامل",
                  },
                  required: true,
                },
                {
                  n: "company",
                  l: {
                    en: "Company",
                    ar: "الشركة",
                  },
                  required: true,
                },
                {
                  n: "email",
                  l: {
                    en: "Email",
                    ar: "البريد الإلكتروني",
                  },
                  type: "email",
                  required: true,
                },
                {
                  n: "phone",
                  l: {
                    en: "WhatsApp Number",
                    ar: "رقم واتساب",
                  },
                  required: true,
                },
                {
                  n: "industry",
                  l: {
                    en: "Industry",
                    ar: "القطاع",
                  },
                },
                {
                  n: "country",
                  l: {
                    en: "Country",
                    ar: "الدولة",
                  },
                  opts: GCC_MARKETS.map((market) => market.en),
                  required: true,
                },
                {
                  n: "leads",
                  l: {
                    en: "Monthly leads",
                    ar: "عدد العملاء شهرياً",
                  },
                  type: "number",
                },
                {
                  n: "channels",
                  l: {
                    en: "Advertising channels",
                    ar: "قنوات الإعلان",
                  },
                },
                {
                  n: "crm",
                  l: {
                    en: "CRM currently used",
                    ar: "النظام المستخدم حالياً",
                  },
                },
                {
                  n: "whatsapp",
                  l: {
                    en: "WhatsApp usage",
                    ar: "استخدام واتساب",
                  },
                  opts: [
                    "Personal phones",
                    "Shared inbox",
                    "WhatsApp Business API",
                    "Not used",
                  ],
                },
                {
                  n: "response",
                  l: {
                    en: "Average response time",
                    ar: "متوسط زمن الرد",
                  },
                },
                {
                  n: "leadCount",
                  l: {
                    en: "Monthly Lead Count",
                    ar: "عدد العملاء الشهري",
                  },
                  opts: [
                    "0–10",
                    "10–20",
                    "20–50",
                    "50–100",
                    "100–250",
                    "250–500",
                    "500–1000",
                    "1000+",
                  ],
                },
                {
                  n: "value",
                  l: {
                    en: "Average customer value",
                    ar: "متوسط قيمة العميل",
                  },
                },
                {
                  n: "challenge",
                  l: {
                    en: "Biggest sales challenge",
                    ar: "أكبر تحدٍ في المبيعات",
                  },
                },
              ].map((n) => (
                <label
                  key={n.n}
                  className="grid gap-1.5 text-[0.75rem] font-semibold"
                >
                  <span className="opacity-85">{e(n.l)}</span>
                  {n.opts ? (
                    <select
                      name={n.n}
                      required={n.required}
                      defaultValue={
                        n.n === "country"
                          ? (GCC_MARKETS.find((market) => market.code === t)?.en ??
                            "United Arab Emirates")
                          : undefined
                      }
                      className="rounded-lg border border-border bg-background px-3 py-2.5 text-sm font-normal outline-none focus:border-foreground"
                    >
                      {n.opts.map((e) => (
                        <option key={e}>{e}</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      name={n.n}
                      type={n.type ?? "text"}
                      required={n.required}
                      className="rounded-lg border border-border bg-background px-3 py-2.5 text-sm font-normal outline-none focus:border-foreground"
                    />
                  )}
                </label>
              ))}
              <button
                type="submit"
                className="sm:col-span-2 mt-2 rounded-full bg-foreground px-6 py-3.5 text-sm font-semibold text-background transition-transform hover:-translate-y-0.5"
              >
                {e({
                  en: "Get My Free Revenue Leak Audit",
                  ar: "احصل على التدقيق المجاني",
                })}
              </button>
            </form>
          )}
        </div>
      </div>
    </Section>
  );
}
function ClosingSection() {
  let { t: e } = useLocale();
  return (
    <Section tone="dark">
      <Eyebrow>
        <span className="text-ink-foreground/85">
          {e({
            en: "Your marketing is already generating opportunities.",
            ar: "تسويقك يصنع الفرص بالفعل.",
          })}
        </span>
      </Eyebrow>
      <SectionHeading>
        {e({
          en: "Stop Letting Your Revenue System Lose Them.",
          ar: "لا تدع نظام إيراداتك يفقدها.",
        })}
      </SectionHeading>
      <SectionText>
        {e({
          en: "See how AI Revenue OS can connect your marketing, WhatsApp, sales pipeline and customer follow-up into one managed system.",
          ar: "شاهد كيف يربط النظام تسويقك وواتساب ومسار مبيعاتك ومتابعة عملائك في نظام واحد مُدار.",
        })}
      </SectionText>
      <div className="mt-8 flex flex-wrap gap-3">
        <CtaLink variant="light">
          {e({
            en: "Book My Free Revenue Audit",
            ar: "احجز تدقيق إيراداتي المجاني",
          })}
        </CtaLink>
        <CtaLink variant="ghost" href="#product">
          {e({
            en: "See A Live Demo",
            ar: "شاهد عرضاً مباشراً",
          })}
        </CtaLink>
      </div>
      <p className="mt-10 text-sm opacity-85">
        UAE 🇦🇪 | Saudi Arabia 🇸🇦 · English | العربية
      </p>
    </Section>
  );
}
function SiteFooter() {
  let { t: e } = useLocale();
  return (
    <footer className="border-t border-border px-5 py-10 md:px-10">
      <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-4 text-[0.78rem] opacity-80">
        <p>© {new Date().getFullYear()} Spark AI</p>
        <p>
          {e({
            en: "Sales OS for GCC Businesses.",
            ar: "نظام مبيعات لشركات الخليج.",
          })}
        </p>
      </div>
    </footer>
  );
}
function FloatingActions() {
  let { t: e } = useLocale();
  return (
    <>
      <a
        href="https://wa.me/971500000000"
        target="_blank"
        rel="noreferrer"
        aria-label="WhatsApp"
        className="fixed bottom-24 end-5 z-40 grid size-13 place-items-center rounded-full bg-whatsapp text-xl shadow-lg transition-transform hover:scale-105 md:bottom-6 md:size-14"
      >
        <span>💬</span>
      </a>
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 p-3 backdrop-blur-xl md:hidden">
        <a
          href="#audit"
          className="block rounded-full bg-foreground py-3.5 text-center text-sm font-semibold text-background"
        >
          {e({
            en: "Book Free Audit",
            ar: "احجز التدقيق المجاني",
          })}
        </a>
      </div>
    </>
  );
}
function RevenueOS() {
  return (
    <LocaleProvider>
      <div className="min-h-screen bg-background text-foreground">
        <SiteHeader />
        <main className="pb-20 md:pb-0">
          <Hero />
          <ProblemSection />
          <section className="w-full px-5 pb-16 pt-16 md:px-10 md:pb-24 md:pt-24">
            <div className="mx-auto w-full max-w-6xl">
              <FlowDiagram />
            </div>
          </section>
          <ProductSection />
          <CaptureSection />
          <RespondSection />
          <WhatsAppSection />
          <FollowUpSection />
          <AgentSection />
          <InboxSection />
          <PipelineSection />
          <DashboardSection />
          <CampaignsSection />
          <ReactivationSection />
          <AutomationsSection />
          <PlatformSection />
          <ValueSection />
          <ManagedSection />
          <SolutionsSection />
          <PricingSection />
          <FaqSection />
          <AuditSection />
          <SiteFooter />
        </main>
        <FloatingActions />
      </div>
    </LocaleProvider>
  );
}
export default RevenueOS;
