import Link from "next/link";
import { TagArtwork } from "@/components/public/artwork/tag-artwork";
import { getLocale } from "@/lib/i18n";
import { localised } from "@/lib/i18n/localised";
import type { SeasonalBannerSettings } from "@/lib/validators/settings";

/**
 * Home section 7: one big accent tag; hidden until the owner turns it on (#10, colour in #13).
 * The season's motifs (TagArtwork) sit behind the text block, which is marked so they never
 * reach it: they live right of the block (the tag's right third on desktop), on the hole side,
 * in the hangers and in the band.
 */
export async function SeasonalBanner({ banner }: { banner: SeasonalBannerSettings }) {
  if (!banner.enabled) return null;
  const locale = localiseWith(await getLocale());
  const label = locale(banner.label, banner.labelBn);
  const headline = locale(banner.headline, banner.headlineBn);
  const button = locale(banner.buttonLabel, banner.buttonLabelBn);
  return (
    <section aria-label={label} className="mx-auto w-full max-w-7xl px-4 py-10 lg:px-6 lg:py-14">
      <div
        className="bg-primary text-ivory relative mx-auto max-w-[1040px] px-10 py-14 text-center [clip-path:polygon(44px_0,100%_0,100%_100%,44px_100%,0_50%)] lg:px-[72px] lg:py-20 lg:pl-[140px] lg:[clip-path:polygon(80px_0,100%_0,100%_100%,80px_100%,0_50%)]"
        data-testid="seasonal-tag"
      >
        <TagArtwork />
        <span
          aria-hidden
          className="border-ivory absolute top-1/2 left-5 z-10 hidden size-[26px] -translate-y-1/2 rounded-full border-[3px] lg:left-10 lg:block"
        />
        <span
          aria-hidden
          className="bg-mark absolute top-1/2 left-14 z-10 hidden h-[1.5px] w-24 origin-left -translate-y-1/2 -rotate-[28deg] lg:block"
        />
        {/* The text block: centred and full width on phones; from lg a 560px block anchored
            after the hole, so the right third of the tag is free for the signature motif. */}
        <div
          className="relative z-10 mx-auto max-w-3xl lg:mx-0 lg:max-w-[560px]"
          data-artwork-exclude="column"
          data-testid="seasonal-tag-text"
        >
          <p className="text-ivory/88">{label}</p>
          <h2 className="font-heading mt-3 text-[clamp(32px,3.6vw,48px)] leading-tight">
            {headline}
          </h2>
          <Link
            href={banner.href || "/book"}
            prefetch={false}
            className="text-ink hover:bg-paper bg-ivory mt-8 inline-flex min-h-11 items-center rounded-full px-[26px] py-[14px] text-[15px] font-medium"
          >
            {button}
          </Link>
        </div>
      </div>
    </section>
  );
}

function localiseWith(locale: "en" | "bn") {
  return (en: string, bn: string) => localised(locale, en, bn);
}
