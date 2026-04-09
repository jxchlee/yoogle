import { headers } from "next/headers";

import {
  isLogoTheme,
  pickLogoTheme,
} from "@/lib/logo-theme";
import { YougleApp } from "@/components/yougle-app";

export default async function Home() {
  const headerStore = await headers();
  const requestedTheme = headerStore.get("x-yougle-logo-theme");
  const logoTheme = isLogoTheme(requestedTheme) ? requestedTheme : pickLogoTheme();

  return <YougleApp logoTheme={logoTheme} />;
}
