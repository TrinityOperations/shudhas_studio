"use client";
import { cn } from "cn";
import { motion, useReducedMotion } from "framer-motion";
import { PauseIcon, PlayIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { buttonVariants } from "@/components/ui/button";
import { focusPosition, SITE_IMAGES_BUCKET } from "@/lib/home";
import type { SlotDescriptor } from "@/lib/home-editor/context";
import { useLocale, useT } from "@/lib/i18n/client";
import { publicStorageUrl } from "@/lib/storage";
import type { SiteImageSlot } from "@/lib/validators/settings";
import { HERO_SENTINEL } from "@/components/public/layout/header-chrome";
import { SlotOverlay } from "./slot-overlay";

type Props = {
  poster: SiteImageSlot | null;
  videoPath: string | null;
  /** Editor-only: the slot descriptors for the video and the poster (translated on the server) */
  slots?: SlotDescriptor[];
};

const noop = () => () => {};

function prefersLessData(): boolean {
  const connection = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
  return connection?.saveData === true;
}

/**
 * PW-01: full-bleed looping video (poster first, the LCP image) with the welcome type
 * on a bottom scrim. A shadow under the words keeps them readable on a light frame.
 * Reduced motion shows the poster only; so do Save-Data and pages without a video yet.
 */
export function Hero({ poster, videoPath, slots = [] }: Props) {
  const t = useT();
  const locale = useLocale();
  const reduced = useReducedMotion();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [paused, setPaused] = useState(false);
  // Only the browser knows about Save-Data; the server (and hydration) render the poster alone.
  const allowed = useSyncExternalStore(
    noop,
    () => !prefersLessData(),
    () => false,
  );
  // The video is mounted only after the window has loaded and the browser is idle, so its
  // download never competes with the poster (the LCP image) and the first photos.
  const [pageSettled, setPageSettled] = useState(false);
  useEffect(() => {
    let idle: number | undefined;
    const settle = () => {
      const schedule =
        window.requestIdleCallback ?? ((cb: () => void) => window.setTimeout(cb, 1000));
      idle = schedule(() => setPageSettled(true), { timeout: 2500 });
    };
    if (document.readyState === "complete") settle();
    else window.addEventListener("load", settle, { once: true });
    return () => {
      window.removeEventListener("load", settle);
      if (idle !== undefined) (window.cancelIdleCallback ?? window.clearTimeout)(idle);
    };
  }, []);
  const showVideo = !!videoPath && !reduced && allowed && pageSettled;

  function togglePlayback() {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      void video.play();
      setPaused(false);
    } else {
      video.pause();
      setPaused(true);
    }
  }

  const sentinel = { [HERO_SENTINEL]: "" };

  return (
    <section
      {...sentinel}
      aria-labelledby="hero-heading"
      className="bg-mist relative h-[640px] w-full overflow-hidden lg:h-[720px]"
      data-testid="hero"
    >
      {poster ? (
        <Image
          src={publicStorageUrl(poster.bucket, poster.path)}
          alt=""
          fill
          priority
          fetchPriority="high"
          sizes="100vw"
          style={{ objectPosition: focusPosition(poster) }}
          className="object-cover"
        />
      ) : (
        <div data-placeholder="hero-poster" className="bg-mist absolute inset-0" />
      )}
      {showVideo && videoPath ? (
        <motion.video
          ref={videoRef}
          src={publicStorageUrl(SITE_IMAGES_BUCKET, videoPath)}
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
          className="absolute inset-0 size-full object-cover"
          data-testid="hero-video"
        />
      ) : null}
      <SlotOverlay slots={slots} />
      {showVideo && videoPath ? (
        <button
          type="button"
          onClick={togglePlayback}
          aria-label={paused ? t("home.hero.play") : t("home.hero.pause")}
          aria-pressed={paused}
          className="border-line text-ink bg-ivory/90 absolute top-4 right-4 z-10 grid size-11 place-items-center rounded-full border"
        >
          {paused ? <PlayIcon aria-hidden /> : <PauseIcon aria-hidden />}
        </button>
      ) : null}

      <div className="hero-scrim pointer-events-none absolute inset-x-0 bottom-0 h-[62%]" />
      <div className="hero-rise absolute right-4 bottom-12 left-4 max-w-[34rem] sm:right-auto lg:bottom-16 lg:left-12">
        {/* The accent line mirrors the page: Bangla on English pages, English on Bengali ones. */}
        {locale === "bn" ? (
          <p
            lang="en"
            className="hero-copy hero-accent text-[15px] font-[var(--font-eczar),Georgia,serif]"
          >
            {t("home.hero.bangla")}
          </p>
        ) : (
          <p lang="bn" className="hero-copy hero-accent font-bangla text-[15px]">
            {t("home.hero.bangla")}
          </p>
        )}
        <h1
          id="hero-heading"
          className="hero-copy font-heading text-ivory mt-1.5 text-[clamp(32px,4vw,48px)] leading-[1.05] tracking-[-0.01em]"
        >
          {t("home.hero.title")}
        </h1>
        <p className="hero-copy text-ivory mt-3 max-w-[36ch] text-[15px] leading-snug lg:text-base">
          {t("home.hero.sub")}
        </p>
        <div className="mt-5 flex flex-wrap items-center gap-4">
          <Link
            href="/book"
            prefetch={false}
            className={cn(
              buttonVariants({ size: "lg" }),
              "bg-ivory text-ink hover:bg-ivory h-auto rounded-full px-4 py-2.5 text-[15px] shadow-[0_8px_20px_color-mix(in_srgb,var(--scrim)_28%,transparent)]",
            )}
          >
            {t("home.hero.book")}
          </Link>
          <Link
            href="/custom-order"
            prefetch={false}
            className="hero-copy text-ivory text-[15px] font-medium underline underline-offset-[5px]"
          >
            {t("home.hero.custom")}
          </Link>
        </div>
      </div>
    </section>
  );
}
