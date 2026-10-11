import type { Metadata } from "next";
import { EditorProvider } from "@/components/admin/home-editor/editor-provider";
import { HomeSections } from "@/components/public/home/home-sections";
import { getHomeSettingsFull } from "@/db/queries/settings";
import { listTaxonomy } from "@/db/queries/taxonomy";
import { requireOwner } from "@/lib/auth";
import { getT } from "@/lib/i18n";
import { getActiveTheme } from "@/lib/themes/active";
import { themeRootProps } from "@/lib/themes/apply";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("admin.editor.bar.title"), robots: { index: false, follow: false } };
}

/**
 * The home page editor (docs/design.md, "Home page editor"): the real home sections rendered
 * from the draft copy, inside the editor context, under /admin (owner only) and outside the
 * dashboard layout so the page looks like the site. It renders under the live seasonal theme
 * (slice #13) for the same reason.
 */
export default async function HomeEditorPage() {
  await requireOwner();
  const [home, taxonomy, active] = await Promise.all([
    getHomeSettingsFull(),
    listTaxonomy(),
    getActiveTheme(),
  ]);
  const dirty = JSON.stringify(home.draft) !== JSON.stringify(home.published);
  return (
    <div {...themeRootProps(active.theme)} className="flex min-h-full flex-1 flex-col">
      <EditorProvider initialDirty={dirty} taxonomy={taxonomy}>
        <main id="main" className="flex-1">
          <HomeSections home={home.draft} editing />
        </main>
      </EditorProvider>
    </div>
  );
}
