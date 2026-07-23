"use client";

import { usePathname } from "@/i18n/navigation";
import { SiteHeader } from "../SiteHeader/SiteHeader";
import { ImmersiveNav } from "../ImmersiveNav/ImmersiveNav";

export function SiteHeaderSwitch() {
  // next-intl's usePathname already strips the locale prefix, so this is
  // "/" for the homepage regardless of which locale is active.
  const pathname = usePathname();
  return pathname === "/" ? <ImmersiveNav /> : <SiteHeader />;
}
