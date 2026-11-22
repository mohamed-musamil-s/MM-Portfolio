import type { Metadata } from "next";
import { ModulePlaceholder } from "@/components/studio/shell/ModulePlaceholder";
import { MODULE_ROUTES } from "@/components/studio/shell/nav";
import { requireSession } from "@/lib/server/auth/guard";
import { getScreenContent } from "@/lib/server/content/screens";
import type { StudioModule } from "@/lib/shared/content/studio-shell-schema";

/**
 * Builds a studio module page that isn't implemented yet: authoritative
 * session check, then the module's "coming soon" body inside the shell.
 * Title and copy come from site_screens/studio-shell.
 */
export const createModulePage = (module: StudioModule) => {
  const generateMetadata = async (): Promise<Metadata> => {
    const { modules } = await getScreenContent("studio-shell");
    return { title: modules[module].title };
  };

  const ModulePage = async () => {
    await requireSession(MODULE_ROUTES[module]);
    const content = await getScreenContent("studio-shell");
    return <ModulePlaceholder module={module} content={content} />;
  };

  return { generateMetadata, ModulePage };
};
