"use client";

import { useTranslations } from "next-intl";
import { ORIGINALS_FROM_EUR, PRINT_PRICE_EUR, PRINT_PRODUCTION_DAYS } from "@/lib/constants";
import { PriceTag } from "../PriceTag/PriceTag";
import { AccentText } from "../AccentText/AccentText";
import styles from "./PrintTeaser.module.css";

/**
 * Gallery-page card, right under the hero carousel: "one painting, two
 * versions". Deliberately compact — a heading row and two short columns, the
 * price of each pinned to the bottom of its column so the two prices sit on one
 * line however much text each column has. No button: the grid is right below.
 */
export function PrintTeaser() {
  const t = useTranslations("print");

  return (
    <section className={styles.section}>
      <div className={styles.header}>
        <h2 className={styles.heading}>
          <AccentText text={t("homeHeading")} />
        </h2>
      </div>

      <div className={styles.columns}>
        <div className={styles.column}>
          <h3 className={styles.title}>{t("homeOriginalTitle")}</h3>
          <p className={styles.body}>{t("homeOriginalBody")}</p>
          <p className={styles.priceLine}>
            <span className={styles.from}>{t("from")}</span> <PriceTag amountEur={ORIGINALS_FROM_EUR} className={styles.price} />
          </p>
        </div>

        <div className={`${styles.column} ${styles.columnPrint}`}>
          <h3 className={styles.title}>{t("homePrintTitle")}</h3>
          <p className={styles.body}>{t("homePrintBody", { days: PRINT_PRODUCTION_DAYS })}</p>
          <p className={styles.priceLine}>
            <PriceTag amountEur={PRINT_PRICE_EUR} className={styles.price} />
          </p>
        </div>
      </div>
    </section>
  );
}
