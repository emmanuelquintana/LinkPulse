"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import { useTranslation } from "@/i18n/I18nProvider";
import { LanguageSelector } from "@/components/LanguageSelector";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

/** Marcas ficticias para la franja de social proof. */
const BRANDS = ["Nuvora", "Kavi Studio", "Brío", "Orbital", "Pixelar", "Vertex Labs"];

/** Divide un texto en palabras con máscara para animarlas una a una. */
function SplitWords({ text }: { text: string }) {
  return (
    <>
      {text.split(" ").map((word, i) => (
        <span key={i} className="inline-block overflow-hidden align-bottom pb-[0.08em] -mb-[0.08em]">
          <span data-hero-word className="inline-block will-change-transform">
            {word}
            {" "}
          </span>
        </span>
      ))}
    </>
  );
}

export default function LandingClient() {
  const t = useTranslation();
  const router = useRouter();
  const rootRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLElement>(null);
  const heroRef = useRef<HTMLElement>(null);
  const mockupOuterRef = useRef<HTMLDivElement>(null);
  const mockupCardRef = useRef<HTMLDivElement>(null);
  const lenisRef = useRef<Lenis | null>(null);
  const [demoUrl, setDemoUrl] = useState("");

  useEffect(() => {
    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    // ---- Lenis: scroll suave sincronizado con GSAP ----
    const lenis = prefersReduced ? null : new Lenis({ duration: 1.15 });
    lenisRef.current = lenis;
    const raf = (time: number) => lenis?.raf(time * 1000);
    const manualCleanups: Array<() => void> = [];

    if (lenis) {
      gsap.ticker.add(raf);
      gsap.ticker.lagSmoothing(0);
    }

    const ctx = gsap.context(() => {
      if (prefersReduced) return;

      const EASE = "power3.out";

      // Skew sutil de todo el contenido según la velocidad del scroll.
      const skewTo = gsap.quickTo("[data-skew]", "skewY", {
        duration: 0.5,
        ease: "power3",
      });
      lenis?.on("scroll", (e: { velocity: number }) => {
        ScrollTrigger.update();
        skewTo(gsap.utils.clamp(-1.2, 1.2, e.velocity * 0.04));
      });

      /* ---------- HERO: entrada orquestada (fromTo = determinista) ---------- */
      const intro = gsap.timeline({ defaults: { ease: EASE } });
      intro
        .fromTo(
          '[data-hero="badge"]',
          { y: 24, autoAlpha: 0 },
          { y: 0, autoAlpha: 1, duration: 0.6 },
        )
        .fromTo(
          "[data-hero-word]",
          { yPercent: 120, rotate: 6 },
          { yPercent: 0, rotate: 0, stagger: 0.05, duration: 0.9 },
          "-=0.35",
        )
        .fromTo(
          '[data-hero="subtitle"]',
          { y: 30, autoAlpha: 0 },
          { y: 0, autoAlpha: 1, duration: 0.7 },
          "-=0.5",
        )
        .fromTo(
          '[data-hero="cta"]',
          { y: 24, autoAlpha: 0 },
          { y: 0, autoAlpha: 1, stagger: 0.1, duration: 0.6 },
          "-=0.45",
        )
        .fromTo(
          '[data-hero="demo"]',
          { y: 36, autoAlpha: 0, scale: 0.96 },
          { y: 0, autoAlpha: 1, scale: 1, duration: 0.8 },
          "-=0.35",
        )
        .fromTo(
          '[data-hero="mockup"]',
          { y: 90, autoAlpha: 0, rotateX: 10 },
          { y: 0, autoAlpha: 1, rotateX: 0, duration: 1.1 },
          "-=0.5",
        )
        .fromTo(
          "[data-bar]",
          { scaleY: 0 },
          { scaleY: 1, transformOrigin: "bottom", stagger: 0.05, duration: 0.6, ease: "power2.out" },
          "-=0.6",
        );

      /* ---------- Blobs: parallax + respiración continua ---------- */
      gsap.to('[data-parallax="blob"]', {
        yPercent: -24,
        ease: "none",
        scrollTrigger: {
          trigger: heroRef.current,
          start: "top top",
          end: "bottom top",
          scrub: true,
        },
      });
      gsap.utils.toArray<HTMLElement>('[data-parallax="blob"]').forEach((el, i) => {
        gsap.to(el, {
          scale: 1.18,
          rotate: i % 2 ? -10 : 10,
          duration: 6 + i * 1.5,
          ease: "sine.inOut",
          yoyo: true,
          repeat: -1,
        });
      });

      /* ---------- Mockup: scrub al salir del hero + tilt 3D con el mouse ---------- */
      gsap.to(mockupOuterRef.current, {
        yPercent: 10,
        scale: 0.97,
        ease: "none",
        scrollTrigger: {
          trigger: heroRef.current,
          start: "center center",
          end: "bottom top",
          scrub: true,
        },
      });

      if (mockupCardRef.current && heroRef.current) {
        gsap.set(mockupCardRef.current, { transformPerspective: 1100 });
        const rotX = gsap.quickTo(mockupCardRef.current, "rotationX", { duration: 0.7, ease: "power3" });
        const rotY = gsap.quickTo(mockupCardRef.current, "rotationY", { duration: 0.7, ease: "power3" });
        const onMove = (e: MouseEvent) => {
          const r = heroRef.current!.getBoundingClientRect();
          const nx = (e.clientX - r.left) / r.width - 0.5;
          const ny = (e.clientY - r.top) / r.height - 0.5;
          rotY(nx * 7);
          rotX(-ny * 7);
        };
        const onLeave = () => {
          rotX(0);
          rotY(0);
        };
        heroRef.current.addEventListener("mousemove", onMove);
        heroRef.current.addEventListener("mouseleave", onLeave);
        manualCleanups.push(() => {
          heroRef.current?.removeEventListener("mousemove", onMove);
          heroRef.current?.removeEventListener("mouseleave", onLeave);
        });
      }

      /* ---------- Chips flotantes ---------- */
      gsap.utils.toArray<HTMLElement>("[data-float]").forEach((el, i) => {
        gsap.to(el, {
          y: i % 2 === 0 ? -12 : 12,
          duration: 2.4 + i * 0.4,
          ease: "sine.inOut",
          yoyo: true,
          repeat: -1,
        });
      });

      /* ---------- Botones magnéticos ---------- */
      gsap.utils.toArray<HTMLElement>("[data-magnetic]").forEach((el) => {
        const xTo = gsap.quickTo(el, "x", { duration: 0.4, ease: "power3" });
        const yTo = gsap.quickTo(el, "y", { duration: 0.4, ease: "power3" });
        const move = (e: MouseEvent) => {
          const r = el.getBoundingClientRect();
          xTo((e.clientX - r.left - r.width / 2) * 0.28);
          yTo((e.clientY - r.top - r.height / 2) * 0.28);
        };
        const leave = () => {
          xTo(0);
          yTo(0);
        };
        el.addEventListener("mousemove", move);
        el.addEventListener("mouseleave", leave);
        manualCleanups.push(() => {
          el.removeEventListener("mousemove", move);
          el.removeEventListener("mouseleave", leave);
        });
      });

      /* ---------- Reveals al hacer scroll (once + autoAlpha) ---------- */
      gsap.utils.toArray<HTMLElement>("[data-reveal]").forEach((el) => {
        gsap.fromTo(
          el,
          { y: 52, autoAlpha: 0 },
          {
            y: 0,
            autoAlpha: 1,
            duration: 0.9,
            ease: EASE,
            scrollTrigger: { trigger: el, start: "top 88%", once: true },
          },
        );
      });

      gsap.utils.toArray<HTMLElement>("[data-reveal-group]").forEach((group) => {
        gsap.fromTo(
          Array.from(group.children),
          { y: 56, autoAlpha: 0, scale: 0.97 },
          {
            y: 0,
            autoAlpha: 1,
            scale: 1,
            stagger: 0.12,
            duration: 0.8,
            ease: EASE,
            scrollTrigger: { trigger: group, start: "top 86%", once: true },
          },
        );
      });

      /* ---------- Contadores ---------- */
      gsap.utils.toArray<HTMLElement>("[data-counter]").forEach((el) => {
        const target = Number(el.dataset.counter ?? 0);
        const suffix = el.dataset.suffix ?? "";
        const decimals = Number(el.dataset.decimals ?? 0);
        const state = { v: 0 };
        gsap.to(state, {
          v: target,
          duration: 2.2,
          ease: "power1.out",
          scrollTrigger: { trigger: el, start: "top 90%", once: true },
          onUpdate: () => {
            el.textContent =
              state.v.toLocaleString(undefined, {
                minimumFractionDigits: decimals,
                maximumFractionDigits: decimals,
              }) + suffix;
          },
        });
      });

      /* ---------- Barras del mockup de email ---------- */
      gsap.fromTo(
        "[data-emailbar]",
        { scaleX: 0 },
        {
          scaleX: 1,
          transformOrigin: "left",
          stagger: 0.14,
          duration: 0.9,
          ease: "power2.out",
          scrollTrigger: { trigger: '[data-section="email"]', start: "top 72%", once: true },
        },
      );

      /* ---------- Header: sombra al hacer scroll ---------- */
      ScrollTrigger.create({
        start: 50,
        onEnter: () => headerRef.current?.classList.add("shadow-md", "shadow-gray-900/5"),
        onLeaveBack: () => headerRef.current?.classList.remove("shadow-md", "shadow-gray-900/5"),
      });
    }, rootRef);

    // Recalcula posiciones cuando todo terminó de cargar (fuentes, etc.).
    // Evita triggers con posiciones obsoletas que dejan secciones invisibles.
    const onLoad = () => ScrollTrigger.refresh();
    window.addEventListener("load", onLoad);
    const refreshTimer = window.setTimeout(() => ScrollTrigger.refresh(), 700);
    if (document.fonts?.ready) {
      document.fonts.ready.then(() => ScrollTrigger.refresh()).catch(() => {});
    }

    return () => {
      window.removeEventListener("load", onLoad);
      window.clearTimeout(refreshTimer);
      manualCleanups.forEach((fn) => fn());
      ctx.revert();
      if (lenis) {
        gsap.ticker.remove(raf);
        lenis.destroy();
      }
      lenisRef.current = null;
    };
  }, []);

  /** Scroll suave a anclas internas respetando el header fijo. */
  const scrollTo = (e: React.MouseEvent, target: string) => {
    e.preventDefault();
    if (lenisRef.current) {
      lenisRef.current.scrollTo(target, { offset: -80 });
    } else {
      document.querySelector(target)?.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleDemoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const param = demoUrl.trim() ? `?url=${encodeURIComponent(demoUrl.trim())}` : "";
    router.push(`/register${param}`);
  };

  const features = [
    { icon: "analytics", tone: "bg-indigo-100 text-indigo-600", title: t.landing.feature1Title, desc: t.landing.feature1Desc },
    { icon: "campaign", tone: "bg-emerald-100 text-emerald-600", title: t.landing.feature2Title, desc: t.landing.feature2Desc },
    { icon: "api", tone: "bg-amber-100 text-amber-600", title: t.landing.feature3Title, desc: t.landing.feature3Desc },
    { icon: "mark_email_read", tone: "bg-rose-100 text-rose-600", title: t.landing.feature4Title, desc: t.landing.feature4Desc },
    { icon: "group", tone: "bg-sky-100 text-sky-600", title: t.landing.feature5Title, desc: t.landing.feature5Desc },
    { icon: "palette", tone: "bg-violet-100 text-violet-600", title: t.landing.feature6Title, desc: t.landing.feature6Desc },
  ];

  const steps = [
    { n: "01", icon: "rocket_launch", title: t.landing.how1Title, desc: t.landing.how1Desc },
    { n: "02", icon: "link", title: t.landing.how2Title, desc: t.landing.how2Desc },
    { n: "03", icon: "monitoring", title: t.landing.how3Title, desc: t.landing.how3Desc },
  ];

  const stats = [
    { value: 250000, suffix: "+", label: t.landing.stat1Label },
    { value: 12, suffix: "M+", label: t.landing.stat2Label },
    { value: 840000, suffix: "+", label: t.landing.stat3Label },
    { value: 99.9, suffix: "%", decimals: 1, label: t.landing.stat4Label },
  ];

  const testimonials = [
    { quote: t.landing.t1Quote, name: t.landing.t1Name, role: t.landing.t1Role },
    { quote: t.landing.t2Quote, name: t.landing.t2Name, role: t.landing.t2Role },
    { quote: t.landing.t3Quote, name: t.landing.t3Name, role: t.landing.t3Role },
  ];

  const barHeights = [38, 62, 45, 78, 55, 90, 70, 84, 60, 95, 73, 88];

  return (
    <div ref={rootRef} className="min-h-screen bg-white font-sans overflow-x-clip">
      {/* ============ HEADER ============ */}
      <header
        ref={headerRef}
        className="fixed top-0 w-full bg-white/85 backdrop-blur-xl border-b border-gray-100 z-50 transition-shadow duration-300"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center gap-2 text-indigo-600 font-black text-xl tracking-tight">
              <span className="material-symbols-outlined">link</span>
              LinkPulse
            </Link>

            <nav className="hidden md:flex items-center space-x-8">
              <a href="#features" onClick={(e) => scrollTo(e, "#features")} className="text-sm text-gray-600 hover:text-gray-900 font-semibold transition-colors">
                {t.landing.features}
              </a>
              <a href="#how" onClick={(e) => scrollTo(e, "#how")} className="text-sm text-gray-600 hover:text-gray-900 font-semibold transition-colors">
                {t.landing.navHow}
              </a>
              <a href="#pricing" onClick={(e) => scrollTo(e, "#pricing")} className="text-sm text-gray-600 hover:text-gray-900 font-semibold transition-colors">
                {t.landing.pricing}
              </a>
            </nav>

            <div className="flex items-center gap-3">
              <LanguageSelector />
              <Link href="/login" className="hidden sm:block text-sm text-gray-600 hover:text-gray-900 font-semibold">
                {t.landing.login}
              </Link>
              <Link
                href="/register"
                className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-indigo-700 transition-all hover:scale-[1.03] active:scale-95 shadow-lg shadow-indigo-200"
              >
                {t.landing.getStarted}
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div data-skew className="will-change-transform">
        <main className="pt-16">
          {/* ============ HERO ============ */}
          <section ref={heroRef} data-section="hero" className="relative overflow-hidden">
            {/* Blobs de fondo */}
            <div aria-hidden className="absolute inset-0 pointer-events-none">
              <div data-parallax="blob" className="absolute -top-32 -left-32 h-[480px] w-[480px] rounded-full bg-indigo-200/40 blur-3xl" />
              <div data-parallax="blob" className="absolute top-40 -right-40 h-[520px] w-[520px] rounded-full bg-violet-200/40 blur-3xl" />
              <div data-parallax="blob" className="absolute bottom-0 left-1/3 h-[380px] w-[380px] rounded-full bg-sky-100/50 blur-3xl" />
            </div>

            <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-12 text-center">
              <div data-hero="badge" className="inline-flex items-center gap-2 bg-indigo-50 border border-indigo-100 rounded-full pl-1.5 pr-4 py-1.5 mb-8">
                <span className="bg-indigo-600 text-white text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full">
                  {t.landing.badgeNew}
                </span>
                <span className="text-xs font-bold text-indigo-700">{t.landing.badgeText}</span>
              </div>

              <h1 className="text-5xl md:text-7xl font-black text-gray-900 tracking-tight mb-6 leading-[1.07]">
                <span className="block">
                  <SplitWords text={t.landing.heroTitle1} />
                </span>
                <span className="block bg-gradient-to-r from-indigo-600 via-violet-600 to-indigo-500 bg-clip-text text-transparent">
                  <SplitWords text={t.landing.heroTitle2} />
                </span>
              </h1>

              <p data-hero="subtitle" className="text-lg md:text-xl text-gray-500 max-w-2xl mx-auto mb-10 font-medium leading-relaxed">
                {t.landing.heroSubtitle}
              </p>

              <div className="flex flex-col sm:flex-row justify-center gap-4 mb-4">
                <Link
                  data-hero="cta"
                  data-magnetic
                  href="/register"
                  className="bg-indigo-600 text-white px-8 py-4 rounded-2xl font-bold text-lg hover:bg-indigo-700 transition-colors shadow-xl shadow-indigo-200 will-change-transform"
                >
                  {t.landing.startFree}
                </Link>
                <a
                  data-hero="cta"
                  href="#how"
                  onClick={(e) => scrollTo(e, "#how")}
                  className="bg-white text-gray-700 border border-gray-200 px-8 py-4 rounded-2xl font-bold text-lg hover:bg-gray-50 hover:border-gray-300 transition-all flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined">play_circle</span>
                  {t.landing.watchDemo}
                </a>
              </div>
              <p data-hero="cta" className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-12">
                {t.landing.heroHint}
              </p>

              {/* Demo del acortador */}
              <form
                data-hero="demo"
                onSubmit={handleDemoSubmit}
                className="max-w-3xl mx-auto bg-white p-2 rounded-2xl shadow-2xl shadow-indigo-100 border border-gray-100 flex items-center gap-2"
              >
                <div className="flex-1 flex items-center gap-3 px-4 min-w-0">
                  <span className="material-symbols-outlined text-gray-400">link</span>
                  <input
                    type="url"
                    value={demoUrl}
                    onChange={(e) => setDemoUrl(e.target.value)}
                    placeholder={t.landing.pastePlaceholder}
                    className="w-full py-3 outline-none text-gray-700 text-lg min-w-0 bg-transparent"
                  />
                </div>
                <button
                  type="submit"
                  className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-indigo-700 transition-all hover:scale-[1.03] active:scale-95 whitespace-nowrap"
                >
                  {t.landing.shorten}
                </button>
              </form>

              {/* Mockup del dashboard */}
              <div ref={mockupOuterRef} data-hero="mockup" className="relative max-w-4xl mx-auto mt-16">
                <div
                  ref={mockupCardRef}
                  className="relative bg-white rounded-3xl border border-gray-200 shadow-2xl shadow-indigo-100/80 overflow-hidden text-left will-change-transform"
                >
                  <div className="flex items-center gap-2 px-5 py-3.5 border-b border-gray-100 bg-gray-50/60">
                    <span className="h-3 w-3 rounded-full bg-rose-400" />
                    <span className="h-3 w-3 rounded-full bg-amber-400" />
                    <span className="h-3 w-3 rounded-full bg-emerald-400" />
                    <span className="ml-3 text-xs font-bold text-gray-400 bg-white border border-gray-100 rounded-lg px-3 py-1">
                      linkpulse.app/dashboard
                    </span>
                    <span className="ml-auto inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      {t.landing.dashboardLive}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-4 p-6 pb-2">
                    {[
                      { label: t.landing.mockClicks, value: "12,847", trend: "+18%" },
                      { label: t.landing.mockOpenRate, value: "48.2%", trend: "+5.4%" },
                      { label: t.landing.mockActiveLinks, value: "326", trend: "+12" },
                    ].map((kpi) => (
                      <div key={kpi.label} className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest truncate">{kpi.label}</p>
                        <div className="flex items-baseline gap-2 mt-1">
                          <span className="text-2xl font-black text-gray-900">{kpi.value}</span>
                          <span className="text-[11px] font-bold text-emerald-600">{kpi.trend}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-end gap-2 h-36 px-6 pb-6 pt-4">
                    {barHeights.map((h, i) => (
                      <div
                        key={i}
                        data-bar
                        className={`flex-1 rounded-t-lg ${i === 9 ? "bg-indigo-600" : "bg-indigo-200"}`}
                        style={{ height: `${h}%` }}
                      />
                    ))}
                  </div>
                </div>

                {/* Chips flotantes */}
                <div data-float className="absolute -left-4 sm:-left-10 top-24 bg-white rounded-2xl shadow-xl border border-gray-100 px-4 py-3 flex items-center gap-3">
                  <span className="h-9 w-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                    <span className="material-symbols-outlined text-[20px]">ads_click</span>
                  </span>
                  <span className="text-sm font-black text-gray-900">{t.landing.mockFloatingClick}</span>
                </div>
                <div data-float className="absolute -right-4 sm:-right-10 top-48 bg-white rounded-2xl shadow-xl border border-gray-100 px-4 py-3 flex items-center gap-3">
                  <span className="h-9 w-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <span className="material-symbols-outlined text-[20px]">mark_email_read</span>
                  </span>
                  <span className="text-sm font-black text-gray-900">{t.landing.mockFloatingOpen}</span>
                </div>
              </div>
            </div>
          </section>

          {/* ============ SOCIAL PROOF ============ */}
          <section className="py-14 border-y border-gray-50 bg-white">
            <p data-reveal className="text-center text-xs font-black text-gray-400 uppercase tracking-[0.25em] mb-8">
              {t.landing.trustedBy}
            </p>
            <div className="relative overflow-hidden" aria-hidden>
              <div className="flex w-max animate-marquee gap-16 pr-16">
                {[...BRANDS, ...BRANDS].map((brand, i) => (
                  <span key={i} className="text-2xl font-black text-gray-300 whitespace-nowrap select-none">
                    {brand}
                  </span>
                ))}
              </div>
              <div className="absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-white to-transparent" />
              <div className="absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-white to-transparent" />
            </div>
          </section>

          {/* ============ FEATURES ============ */}
          <section id="features" className="bg-gray-50 py-28">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div data-reveal className="text-center mb-16">
                <h2 className="text-3xl md:text-5xl font-black text-gray-900 mb-4 tracking-tight">
                  {t.landing.featuresTitle}
                </h2>
                <p className="text-lg text-gray-500 font-medium">{t.landing.featuresSubtitle}</p>
              </div>

              <div data-reveal-group className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {features.map((f) => (
                  <div
                    key={f.title}
                    className="group bg-white p-8 rounded-3xl shadow-sm border border-gray-100 hover:shadow-xl hover:shadow-indigo-100/60 hover:-translate-y-1.5 transition-all duration-300"
                  >
                    <div className={`w-12 h-12 ${f.tone} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:-rotate-6 transition-transform duration-300`}>
                      <span className="material-symbols-outlined">{f.icon}</span>
                    </div>
                    <h3 className="text-xl font-black text-gray-900 mb-3 tracking-tight">{f.title}</h3>
                    <p className="text-gray-500 leading-relaxed">{f.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* ============ HOW IT WORKS ============ */}
          <section id="how" className="py-28 bg-white relative overflow-hidden">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div data-reveal className="text-center mb-16">
                <h2 className="text-3xl md:text-5xl font-black text-gray-900 mb-4 tracking-tight">
                  {t.landing.howTitle}
                </h2>
                <p className="text-lg text-gray-500 font-medium">{t.landing.howSubtitle}</p>
              </div>

              <div data-reveal-group className="grid md:grid-cols-3 gap-8 relative">
                {steps.map((s) => (
                  <div key={s.n} className="relative bg-gray-50 rounded-3xl p-8 border border-gray-100 hover:border-indigo-200 transition-colors">
                    <span className="absolute -top-5 left-8 text-6xl font-black text-indigo-100 select-none">{s.n}</span>
                    <div className="relative">
                      <div className="w-12 h-12 bg-indigo-600 text-white rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-indigo-200">
                        <span className="material-symbols-outlined">{s.icon}</span>
                      </div>
                      <h3 className="text-xl font-black text-gray-900 mb-3 tracking-tight">{s.title}</h3>
                      <p className="text-gray-500 leading-relaxed">{s.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* ============ STATS ============ */}
          <section className="relative py-24 bg-gray-900 overflow-hidden">
            <div aria-hidden className="absolute inset-0">
              <div className="absolute -top-24 left-1/4 h-96 w-96 rounded-full bg-indigo-600/20 blur-3xl" />
              <div className="absolute -bottom-24 right-1/4 h-96 w-96 rounded-full bg-violet-600/20 blur-3xl" />
            </div>
            <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <h2 data-reveal className="text-center text-2xl md:text-4xl font-black text-white mb-14 tracking-tight">
                {t.landing.statsTitle}
              </h2>
              <div data-reveal-group className="grid grid-cols-2 lg:grid-cols-4 gap-10 text-center">
                {stats.map((s) => (
                  <div key={s.label}>
                    <p
                      data-counter={s.value}
                      data-suffix={s.suffix}
                      data-decimals={s.decimals ?? 0}
                      className="text-4xl md:text-5xl font-black text-white tabular-nums"
                    >
                      0{s.suffix}
                    </p>
                    <p className="mt-2 text-xs font-black uppercase tracking-[0.2em] text-indigo-300">{s.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* ============ EMAIL SPOTLIGHT ============ */}
          <section data-section="email" className="py-28 bg-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid lg:grid-cols-2 gap-16 items-center">
              <div data-reveal>
                <span className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-rose-600 bg-rose-50 px-3 py-1.5 rounded-full mb-6">
                  <span className="material-symbols-outlined text-[16px]">mark_email_read</span>
                  Email marketing
                </span>
                <h2 className="text-3xl md:text-5xl font-black text-gray-900 mb-5 tracking-tight leading-tight">
                  {t.landing.emailSpotTitle}
                </h2>
                <p className="text-lg text-gray-500 font-medium mb-8 leading-relaxed">{t.landing.emailSpotSubtitle}</p>
                <ul className="space-y-4">
                  {[t.landing.emailSpot1, t.landing.emailSpot2, t.landing.emailSpot3].map((item) => (
                    <li key={item} className="flex items-start gap-3 text-gray-700 font-semibold">
                      <span className="material-symbols-outlined text-emerald-500 mt-0.5">check_circle</span>
                      {item}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/register"
                  className="inline-flex items-center gap-2 mt-10 bg-gray-900 text-white px-7 py-3.5 rounded-2xl font-bold hover:bg-black transition-all hover:scale-[1.03] active:scale-95"
                >
                  {t.landing.startFree}
                  <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
                </Link>
              </div>

              {/* Mockup de stats de email */}
              <div data-reveal className="relative">
                <div className="bg-gray-50 rounded-3xl border border-gray-100 p-8 shadow-xl shadow-gray-200/50">
                  <div className="flex items-center justify-between mb-8">
                    <div>
                      <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Black Friday 2026</p>
                      <p className="text-xl font-black text-gray-900 mt-0.5">newsletter@tumarca.com</p>
                    </div>
                    <span className="text-[10px] font-black uppercase px-3 py-1.5 rounded-full bg-emerald-100 text-emerald-700">
                      Enviada
                    </span>
                  </div>
                  {[
                    { label: t.landing.mockOpenRate, pct: 72, color: "bg-indigo-600" },
                    { label: "CTR", pct: 38, color: "bg-violet-500" },
                    { label: "Bounce", pct: 2, color: "bg-rose-400" },
                  ].map((row) => (
                    <div key={row.label} className="mb-6 last:mb-0">
                      <div className="flex justify-between text-sm font-bold text-gray-600 mb-2">
                        <span>{row.label}</span>
                        <span className="text-gray-900 font-black">{row.pct}%</span>
                      </div>
                      <div className="h-3 bg-white rounded-full border border-gray-100 overflow-hidden">
                        <div data-emailbar className={`h-full rounded-full ${row.color}`} style={{ width: `${row.pct}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* ============ PRICING ============ */}
          <section id="pricing" className="py-28 bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div data-reveal className="text-center mb-16">
                <h2 className="text-3xl md:text-5xl font-black text-gray-900 mb-4 tracking-tight">
                  {t.landing.pricingTitle}
                </h2>
                <p className="text-lg text-gray-500 font-medium">{t.landing.pricingSubtitle}</p>
              </div>

              <div data-reveal-group className="grid md:grid-cols-3 gap-8 items-stretch max-w-5xl mx-auto">
                {/* FREE */}
                <div className="bg-white rounded-3xl border border-gray-100 p-8 flex flex-col shadow-sm hover:shadow-lg transition-shadow">
                  <p className="text-xs font-black uppercase tracking-widest text-gray-400">{t.landing.planFree}</p>
                  <p className="text-sm font-semibold text-gray-400 mt-1">{t.landing.planFreeDesc}</p>
                  <p className="text-5xl font-black text-gray-900 mt-6">
                    $0<span className="text-base font-bold text-gray-400">{t.landing.perMonth}</span>
                  </p>
                  <ul className="space-y-3 mt-8 flex-1">
                    {t.landing.planFreeFeatures.map((f) => (
                      <li key={f} className="flex items-center gap-2.5 text-sm font-semibold text-gray-600">
                        <span className="material-symbols-outlined text-emerald-500 text-[18px]">done</span>
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Link href="/register" className="mt-10 h-12 rounded-2xl bg-gray-900 text-white text-sm font-bold flex items-center justify-center hover:bg-black transition-colors">
                    {t.landing.planCtaFree}
                  </Link>
                </div>

                {/* PRO */}
                <div className="relative bg-indigo-600 rounded-3xl p-8 flex flex-col shadow-2xl shadow-indigo-300 md:-translate-y-4 hover:md:-translate-y-5 transition-transform">
                  <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-amber-400 text-gray-900 text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full">
                    {t.landing.mostPopular}
                  </span>
                  <p className="text-xs font-black uppercase tracking-widest text-indigo-200">{t.landing.planPro}</p>
                  <p className="text-sm font-semibold text-indigo-200 mt-1">{t.landing.planProDesc}</p>
                  <p className="text-5xl font-black text-white mt-6">
                    $19<span className="text-base font-bold text-indigo-200">{t.landing.perMonth}</span>
                  </p>
                  <ul className="space-y-3 mt-8 flex-1">
                    {t.landing.planProFeatures.map((f) => (
                      <li key={f} className="flex items-center gap-2.5 text-sm font-semibold text-indigo-50">
                        <span className="material-symbols-outlined text-amber-300 text-[18px]">done_all</span>
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Link href="/register" data-magnetic className="mt-10 h-12 rounded-2xl bg-white text-indigo-700 text-sm font-black flex items-center justify-center hover:bg-indigo-50 transition-colors will-change-transform">
                    {t.landing.planCtaPro}
                  </Link>
                </div>

                {/* ENTERPRISE */}
                <div className="bg-white rounded-3xl border border-gray-100 p-8 flex flex-col shadow-sm hover:shadow-lg transition-shadow">
                  <p className="text-xs font-black uppercase tracking-widest text-gray-400">{t.landing.planEnterprise}</p>
                  <p className="text-sm font-semibold text-gray-400 mt-1">{t.landing.planEnterpriseDesc}</p>
                  <p className="text-5xl font-black text-gray-900 mt-6">{t.landing.customPrice}</p>
                  <ul className="space-y-3 mt-8 flex-1">
                    {t.landing.planEnterpriseFeatures.map((f) => (
                      <li key={f} className="flex items-center gap-2.5 text-sm font-semibold text-gray-600">
                        <span className="material-symbols-outlined text-emerald-500 text-[18px]">done</span>
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Link href="/register" className="mt-10 h-12 rounded-2xl border-2 border-gray-900 text-gray-900 text-sm font-bold flex items-center justify-center hover:bg-gray-900 hover:text-white transition-colors">
                    {t.landing.planCtaEnterprise}
                  </Link>
                </div>
              </div>
            </div>
          </section>

          {/* ============ TESTIMONIALS ============ */}
          <section className="py-28 bg-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div data-reveal className="text-center mb-16">
                <h2 className="text-3xl md:text-5xl font-black text-gray-900 mb-4 tracking-tight">
                  {t.landing.testimonialsTitle}
                </h2>
                <p className="text-lg text-gray-500 font-medium">{t.landing.testimonialsSubtitle}</p>
              </div>

              <div data-reveal-group className="grid md:grid-cols-3 gap-8">
                {testimonials.map((tm) => (
                  <figure key={tm.name} className="bg-gray-50 rounded-3xl p-8 border border-gray-100 flex flex-col hover:border-indigo-200 hover:-translate-y-1 transition-all duration-300">
                    <div className="flex gap-1 text-amber-400 mb-5" aria-hidden>
                      {Array.from({ length: 5 }).map((_, i) => (
                        <span key={i} className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                          star
                        </span>
                      ))}
                    </div>
                    <blockquote className="text-gray-700 font-medium leading-relaxed flex-1">
                      “{tm.quote}”
                    </blockquote>
                    <figcaption className="mt-6 flex items-center gap-3">
                      <span className="h-11 w-11 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center font-black">
                        {tm.name.charAt(0)}
                      </span>
                      <span>
                        <span className="block text-sm font-black text-gray-900">{tm.name}</span>
                        <span className="block text-xs font-bold text-gray-400">{tm.role}</span>
                      </span>
                    </figcaption>
                  </figure>
                ))}
              </div>
            </div>
          </section>

          {/* ============ FINAL CTA ============ */}
          <section className="py-24 px-4 sm:px-6 lg:px-8">
            <div
              data-reveal
              className="relative max-w-5xl mx-auto bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-700 rounded-[2.5rem] px-8 py-20 text-center overflow-hidden shadow-2xl shadow-indigo-300"
            >
              <div aria-hidden className="absolute inset-0">
                <div className="absolute -top-20 -left-20 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
                <div className="absolute -bottom-24 -right-16 h-80 w-80 rounded-full bg-violet-400/20 blur-3xl" />
              </div>
              <div className="relative">
                <h2 className="text-3xl md:text-5xl font-black text-white tracking-tight mb-5">
                  {t.landing.ctaTitle}
                </h2>
                <p className="text-lg text-indigo-100 font-medium max-w-xl mx-auto mb-10">
                  {t.landing.ctaSubtitle}
                </p>
                <Link
                  href="/register"
                  data-magnetic
                  className="inline-flex items-center gap-2 bg-white text-indigo-700 px-10 py-4 rounded-2xl font-black text-lg shadow-xl will-change-transform"
                >
                  {t.landing.ctaButton}
                  <span className="material-symbols-outlined">arrow_forward</span>
                </Link>
                <p className="mt-6 text-xs font-black uppercase tracking-widest text-indigo-200">
                  {t.landing.ctaHint}
                </p>
              </div>
            </div>
          </section>
        </main>

        {/* ============ FOOTER ============ */}
        <footer className="bg-gray-900 text-gray-400 pt-16 pb-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid md:grid-cols-4 gap-10 pb-12 border-b border-gray-800">
              <div>
                <div className="flex items-center gap-2 text-white font-black text-xl mb-4">
                  <span className="material-symbols-outlined">link</span>
                  LinkPulse
                </div>
                <p className="text-sm leading-relaxed">{t.landing.footerTagline}</p>
              </div>
              <div>
                <h4 className="text-white font-bold mb-4 text-sm uppercase tracking-widest">{t.landing.product}</h4>
                <ul className="space-y-2.5 text-sm font-medium">
                  <li><a href="#features" onClick={(e) => scrollTo(e, "#features")} className="hover:text-white transition-colors">{t.landing.features}</a></li>
                  <li><a href="#pricing" onClick={(e) => scrollTo(e, "#pricing")} className="hover:text-white transition-colors">{t.landing.pricing}</a></li>
                  <li><a href="#how" onClick={(e) => scrollTo(e, "#how")} className="hover:text-white transition-colors">{t.landing.navHow}</a></li>
                </ul>
              </div>
              <div>
                <h4 className="text-white font-bold mb-4 text-sm uppercase tracking-widest">{t.landing.company}</h4>
                <ul className="space-y-2.5 text-sm font-medium">
                  <li><a href="#" className="hover:text-white transition-colors">{t.landing.about}</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">{t.landing.blog}</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">{t.landing.careers}</a></li>
                </ul>
              </div>
              <div>
                <h4 className="text-white font-bold mb-4 text-sm uppercase tracking-widest">{t.landing.legal}</h4>
                <ul className="space-y-2.5 text-sm font-medium">
                  <li><a href="#" className="hover:text-white transition-colors">{t.landing.privacy}</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">{t.landing.terms}</a></li>
                </ul>
              </div>
            </div>
            <p className="pt-8 text-xs font-semibold text-gray-500 text-center">
              © {new Date().getFullYear()} LinkPulse. {t.landing.footerRights}
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}
