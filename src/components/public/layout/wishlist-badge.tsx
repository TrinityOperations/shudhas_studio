"use client";
import { HeartIcon } from "lucide-react";
import Link from "next/link";
import { useT } from "@/lib/i18n/client";
import { useWishlist } from "@/lib/wishlist/use-wishlist";

/** Header heart: links to /wishlist with the saved count in a `mark` badge (hidden at zero). */
export function WishlistBadge() {
  const t = useT();
  const count = useWishlist().length;
  return (
    <Link
      href="/wishlist"
      aria-label={
        count
          ? `${t("header.wishlist")}: ${t("header.wishlistCount", { count })}`
          : t("header.wishlist")
      }
      className="text-ink hover:bg-mist relative z-10 grid size-11 shrink-0 place-items-center rounded-full"
      data-artwork-exclude="text"
      data-testid="header-wishlist"
    >
      <HeartIcon className={count ? "fill-mark text-mark" : undefined} aria-hidden />
      {count ? (
        <span
          aria-hidden
          className="bg-mark text-ivory absolute top-1 right-1 grid min-w-[18px] place-items-center rounded-full px-1 text-[11px] leading-[18px] font-semibold"
        >
          {count}
        </span>
      ) : null}
    </Link>
  );
}
