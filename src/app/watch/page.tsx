import { headers } from "next/headers";

import {
  isLogoTheme,
  pickLogoTheme,
} from "@/lib/logo-theme";
import { YougleWatchPage } from "@/components/yougle-watch-page";

export default async function WatchPage() {
  const headerStore = await headers();
  const requestedTheme = headerStore.get("x-yougle-logo-theme");
  const logoTheme = isLogoTheme(requestedTheme) ? requestedTheme : pickLogoTheme();

  return <YougleWatchPage logoTheme={logoTheme} />;
}
