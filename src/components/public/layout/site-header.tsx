import Link from "next/link";
import { HeaderScatter } from "@/components/public/artwork/header-scatter";
import { LocaleToggle } from "@/components/shared/locale-toggle";
import { buttonVariants } from "@/components/ui/button";
import { getLocale, getT } from "@/lib/i18n";
import { localised } from "@/lib/i18n/localised";
import { getPageTheme } from "@/lib/themes/active";
import type { AnnouncementSettings } from "@/lib/validators/settings";
import { AnnouncementStrip } from "./announcement-strip";
import { HeaderChrome } from "./header-chrome";
import { LogoMark } from "./logo-mark";
import { MobileMenu } from "./mobile-menu";
import { NAV_LINKS } from "./nav-links";
import { WishlistBadge } from "./wishlist-badge";

type Props = { studioName: string; announcement: AnnouncementSettings };

/**
 * docs/design.md, "Header": announcement strip, then the sticky header in two rows. Top row:
 * the brand centred, the actions on the right, the season's icons behind in two sets that
 * cross-fade as the header collapses (never under the brand or the actions' text: the layer
 * measures them). Links row under it on desktop; phones keep the links in the menu sheet.
 */
export async function SiteHeader({ studioName, announcement }: Props) {
  const [t, locale, theme] = await Promise.all([getT(), getLocale(), getPageTheme()]);
  const messages = (announcement.enabled ? announcement.messages : [])
    .map((m) => ({
      text: localised(locale, m.text, m.textBn),
      linkLabel: localised(locale, m.linkLabel, m.linkLabelBn),
      href: m.href,
    }))
    .filter((m) => m.text);

  const top = (
    <>
      {/* The artwork layers cover the whole padded row and sit behind both layouts; each
          measures the brand and the actions in its own layout (marked data-header-content). */}
      <HeaderScatter theme={theme} className="hidden lg:block" />
      <HeaderScatter theme={theme} narrow className="lg:hidden" />
      {/* Desktop: empty column, brand, actions */}
      <div
        data-header-content
        className="relative mx-auto hidden w-full max-w-[1400px] grid-cols-[1fr_auto_1fr] items-center gap-x-5 px-6 lg:grid"
      >
        <span />
        <LogoMark studioName={studioName} homeLabel={t("header.home")} />
        <div className="relative z-10 flex items-center justify-end gap-2">
          <WishlistBadge />
          <span data-artwork-exclude="text">
            <LocaleToggle />
          </span>
          <Link
            href="/book"
            prefetch={false}
            data-artwork-exclude="text"
            className={`${buttonVariants()} h-auto px-4 py-2.5 min-[1400px]:px-[26px] min-[1400px]:py-[14px]`}
          >
            {t("header.book")}
          </Link>
        </div>
      </div>
      {/* Phone and tablet */}
      <div
        data-header-content
        className="relative flex w-full items-center justify-between gap-2 px-3 lg:hidden"
      >
        <MobileMenu studioName={studioName} />
        <LogoMark studioName={studioName} homeLabel={t("header.home")} size="phone" />
        <WishlistBadge />
      </div>
    </>
  );

  const links = (
    <nav
      aria-label={t("header.menu")}
      className="mx-auto flex h-full w-full max-w-[1400px] items-center justify-center px-6"
    >
      <ul className="flex items-center gap-7 min-[1400px]:gap-9">
        {NAV_LINKS.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className="text-ink hover:text-primary block rounded-full py-2 text-sm font-medium whitespace-nowrap min-[1400px]:text-[15px]"
            >
              {t(link.key)}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );

  return (
    <>
      {messages.length ? (
        <AnnouncementStrip messages={messages} label={t("header.announcement")} />
      ) : null}
      <HeaderChrome top={top} links={links} />
    </>
  );
}
