"use client";

import { useEffect } from "react";

/**
 * The root layout (above `[locale]`) sets the correct `lang` on the
 * initial server-rendered response, but it isn't re-rendered on
 * client-side navigations between locales (that's what makes the
 * language switch a soft nav instead of a full reload). This keeps
 * `<html lang>` accurate after such a switch.
 */
export function HtmlLangSync({ locale }: { locale: string }) {
  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  return null;
}
