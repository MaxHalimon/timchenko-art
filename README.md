# Timchenko Art — стартова структура

Домен поки що припущений як **timchenko-art.com.ua** (див. `.env.example` → `NEXT_PUBLIC_SITE_URL`) — оновіть, коли домен буде зареєстровано підтверджено.

## Структура папок

```
timchenko-art/
├── middleware.ts                 # next-intl локаль-роутинг + встановлення currency-cookie за геолокацією
├── i18n/
│   ├── config.ts                  # locales, defaultLocale — єдине місце для додавання нової мови
│   ├── request.ts                 # next-intl: завантажує messages/<locale>.json
│   └── navigation.ts              # локаль-обізнані Link/useRouter/usePathname
├── messages/
│   ├── uk.json, en.json, de.json  # переклади UI (українська, англійська, німецька)
├── app/
│   ├── [locale]/                   # усі клієнтські сторінки — під префіксом /uk, /en, /de
│   │   ├── layout.tsx               # root layout: NextIntlClientProvider + CurrencyProvider (seed з cookie) + AgeGate/Header/Footer
│   │   ├── page.tsx                 # головна: HeroSection + сітка карток
│   │   ├── globals.css              # CSS-змінні палітри, base-стилі (h1-h4, body, тощо)
│   │   ├── providers/
│   │   │   └── CurrencyProvider.tsx  # React-контекст обраної валюти показу цін
│   │   ├── components/                # кожен компонент — окрема підпапка (компонент + його .module.css)
│   │   │   ├── AgeGate/
│   │   │   │   ├── AgeGate.tsx           # модалка 18+, стан у localStorage
│   │   │   │   └── AgeGate.module.css
│   │   │   ├── SiteHeader/
│   │   │   │   ├── SiteHeader.tsx         # + LanguageSwitcher + CurrencySwitcher
│   │   │   │   └── SiteHeader.module.css
│   │   │   ├── SiteFooter/
│   │   │   │   ├── SiteFooter.tsx
│   │   │   │   └── SiteFooter.module.css
│   │   │   ├── LanguageSwitcher/
│   │   │   │   └── LanguageSwitcher.tsx
│   │   │   ├── CurrencySwitcher/
│   │   │   │   └── CurrencySwitcher.tsx
│   │   │   ├── PriceTag/
│   │   │   │   └── PriceTag.tsx          # ціна, конвертована з USD у обрану валюту
│   │   │   ├── HeroSection/
│   │   │   │   ├── HeroSection.tsx
│   │   │   │   └── HeroSection.module.css
│   │   │   ├── ProductCard/
│   │   │   │   ├── ProductCard.tsx
│   │   │   │   └── ProductCard.module.css
│   │   │   └── shared/                    # НЕ компонент — спільні CSS Modules без власного .tsx
│   │   │       ├── Buttons.module.css        # .galleryButton / .galleryButtonOutline
│   │   │       ├── HeaderSelect.module.css   # спільний стиль <select> для обох switcher'ів
│   │   │       └── ProductGrid.module.css    # сітка карток, спільна для home/gallery
│   │   ├── gallery/
│   │   │   ├── page.tsx + .module.css             # сітка + фільтри (розмір/тема/статус)
│   │   │   └── FilterBar.tsx + .module.css
│   │   ├── product/[slug]/            # (наступний крок) сторінка товару
│   │   └── admin/                     # (наступний крок) адмінка ADMIN/ARTIST
│   └── api/                         # БЕЗ локаль-префіксу — API мовно-незалежне
│       ├── orders/route.ts           # створення Order + Stripe Checkout / NOWPayments invoice
│       └── webhooks/
│           ├── stripe/route.ts        # обробка checkout.session.completed/expired
│           └── nowpayments/route.ts   # обробка IPN callback
├── lib/
│   ├── prisma.ts                   # singleton Prisma-клієнт
│   ├── stripe.ts                   # singleton Stripe-клієнт
│   ├── constants.ts                # PLATFORM_COMMISSION_PCT = 20% (ваш заробіток), решта 80% — художниці
│   └── currency.ts                 # SUPPORTED_CURRENCIES, курси (⚠️ статичні-заглушки), formatPrice()
├── prisma/
│   └── schema.prisma               # User, Product, Order, Payment, ProgressPhoto
└── public/
```

## Що вже готово

- **Стилі — CSS Modules, один компонент = одна папка.** Кожен компонент живе у своїй підпапці разом зі своїм `ComponentName.module.css` (напр. `components/AgeGate/AgeGate.tsx` + `components/AgeGate/AgeGate.module.css`). Спільні шматки, що не належать одному компоненту, лежать окремо в `components/shared/`:
  - `shared/Buttons.module.css` — `.galleryButton` / `.galleryButtonOutline` (як у ТЗ, з hover-ефектом).
  - `shared/HeaderSelect.module.css` — спільний стиль `<select>` для `LanguageSwitcher` і `CurrencySwitcher`.
  - `shared/ProductGrid.module.css` — сітка карток, спільна для головної й галереї.
  - `globals.css` лишається тільки для CSS-змінних палітри (`--color-*`, `--font-*`, `--space-*`) і base-стилів (`body`, `h1-h4`, `img`) — жодних утилітарних класів там більше немає, все або в модулі компонента, або токен.
- Дизайн-система зафіксована як CSS-змінні в `globals.css` — колір, шрифти, spacing. Незмінна.
- **Мультимовність (next-intl):** 4 мови зараз (`uk`, `en`, `de`, `ja`), маршрутизація через префікс (`/uk/gallery`, `/en/gallery`, `/ja/gallery`...). Додати ще одну мову — 3 кроки: код у `i18n/config.ts` → `locales`, новий `messages/<code>.json`, підпис у `LOCALE_LABELS`. Все інше підхоплюється автоматично.
- **Вибір валюти:** middleware читає заголовок `x-vercel-ip-country` (Vercel виставляє його автоматично в проді) і виставляє cookie `timchenko-art-currency` з валютою за замовчуванням для країни відвідувача (включно з JPY для Японії). `CurrencySwitcher` дозволяє ручний вибір, який теж пишеться в ту саму cookie і відтоді має пріоритет над геолокацією. `PriceTag` рендерить ціну в обраній валюті.
- `AgeGate` — модалка при першому вході, стан у `localStorage`.
- **Мобільна адаптація:** хедер стає бургер-меню на екранах ≤720px (`SiteHeader.tsx`, клієнтський компонент зі станом відкриття); фільтри галереї стають вертикальними на ≤480px; `--space-4/5/6` токени в `globals.css` автоматично звужуються на ≤480px, тож усі контейнери (hero, галерея, футер) підтягуються без окремих правок.
- **Головна-маніфест (натхненна особистими сайтами Kusama/Murakami):** повноекранний блок на 99.9vh нагорі. Зараз це **циклічне фонове відео** (`HeroVideo`, `public/videos/hero-loop.mp4`) — `muted + loop + playsInline + autoplay`, з `poster`-кадром (`hero-poster.jpg`) на час завантаження і фолбеком без автовідтворення для `prefers-reduced-motion`. Оригінальне відео важило 103 МБ у 4K — стиснуто через `ffmpeg` до ~3 МБ (1280×720, без звукової доріжки, `crf 28`, `+faststart`); якщо будете оновлювати відео — не забувайте про той самий процес стиснення, інакше сторінка вантажитиметься дуже довго. Попередній варіант — слайд-шоу з картин бази (`HeroSlideshow`) — лишився в проєкті невикористаним, неважко повернути чи перемкнути.
  - На головній навігація повністю інша: `ImmersiveNav` — лише логотип + бургер-іконка поверх відео (прозорий фон із градієнтом для читабельності, стає суцільним білим після невеликого скролу), **завжди** у форматі "меню-по-кліку" незалежно від ширини екрана (на відміну від звичайного `SiteHeader`, де на десктопі меню одразу видно). `SiteHeaderSwitch` вибирає, який хедер рендерити, за поточним шляхом (`usePathname() === "/"`).
  - Одразу під відео — **`ArtistIntro`**: текстовий блок про художницю (біографія, особливості творчості, виставки, "чому варто придбати") — повний текст локалізований на всі 4 мови (`messages/*.json` → `artistIntro`).
  - Далі — `ManifestoStatement`: коротка текстова секція з копірайтингом (`hero.eyebrow/title/description/cta`), яка раніше сиділа поверх зображення в старій `HeroSection`. `HeroSection.tsx` лишився в проєкті невикористаним.
- `BackToTop` — кнопка "нагору" внизу справа, з'являється після прокрутки ~400px, плавний скрол нагору.
- **Навігація:** пункти меню — Home / Gallery / Tracking (раніше Catalog/Process/Delivery — "Process" прибрано, "Catalog" перейменовано на "Gallery" по всьому проєкту — маршрут, назви компонентів, неймспейс перекладів `gallery.*`, посилання в UI-текстах; "Delivery" перейменовано на "Tracking" і веде на `/shipping-policy`, де вже описано трек-номери). Випадне меню (і на десктопі для головної, і на мобільних для решти сторінок) — компактна картка, "прилипла" під бургер-іконкою по ширині контенту, а не повношиткова панель з великими відступами.
- **Футер із меню** — посилання на 4 юридичні сторінки (Privacy Policy, Terms of Service, Shipping Policy, Returns & Refunds), локалізовані, з мобільним стеканням у стовпчик. Сам текст сторінок — шаблонний, дивіться `LEGAL_PAGES_GUIDE.md` у корені проєкту щодо того, що обов'язково треба заповнити/перевірити з юристом перед запуском (включно з вимогою Impressum для німецького ринку).
- **Сторінка "Контакти" (`/contacts`)** — контактна сторінка (нав-пункт: Контакти/Contacts/Kontakt/お問い合わせ, залежно від мови). Містить: email художниці (`maryna.timchenko.art@gmail.com`, mailto-посилання), форму зворотного зв'язку на EmailJS (`ContactForm`, лист приходить напряму на пошту, без власного backend — інструкція з налаштування в `EMAILJS_GUIDE.md`), і компонент `SolidarityStatement` — заява щодо позиції студії до збройної агресії рф проти України (та інших країн). Ця сама позиція задокументована й як пункт у Terms of Service ("Обмеження щодо замовлень" — не приймаємо замовлення від клієнтів з рф) — заява на `/contacts` дає людський/ціннісний контекст, пункт у Terms — це вже операційне правило.
  - Свідомий вибір розміщення: не на головній (щоб не порушувати суто візуальне занурення першого екрана з референсів Kusama/Murakami) і не на сторінці доставки (яка суто транзакційна) — саме "Контакти" природно поєднує "хто ми" і "як з нами зв'язатись".
- `ProductCard`, `FilterBar`, галерея, юридичні сторінки — усі тексти локалізовані через `useTranslations`/`getTranslations`.
- `prisma/schema.prisma` — `users` (ADMIN/ARTIST), `products`, `orders` (state machine PREVIEW → PAID → IN_PROGRESS → SHIPPED → DELIVERED), `payments` (STRIPE/NOWPAYMENTS/Cryptomus/Monobank), `progress_photos`.
- `lib/constants.ts` — платформна комісія зафіксована як глобальна константа 20% (`PLATFORM_COMMISSION_PCT`) — ваш заробіток; решта 80% (`calculateArtistPayoutUsd`) належить художниці.
- `app/api/orders/route.ts` — створює `Order` (статус `PREVIEW`), приймає `locale` для локалізованих success/cancel URL, розгалужується за `paymentMethod`:
  - `"card"` (за замовчуванням) → Stripe Checkout Session з `automatic_payment_methods` (Apple Pay/Google Pay з'являються самі, коли увімкнені в Stripe Dashboard).
  - `"crypto"` → NOWPayments invoice, як опція, яку клієнт обирає сам.
  - В обох випадках — rollback замовлення, якщо запит до гейтвею впав.
- `app/api/webhooks/stripe/route.ts` і `.../nowpayments/route.ts` — перевірка підпису, ідемпотентний перехід `Order → PAID` (+ розрахунок комісії) і `Product → SOLD`.
- `prisma/seed.ts` + `prisma/paintings.json` — заповнення галереї вашими реальними картинами без написання коду. Інструкція: `prisma/PAINTINGS_GUIDE.md`. Запуск: `npm run prisma:seed`.

## Наступні кроки (не зроблено ще)

1. Сторінка товару `app/[locale]/product/[slug]/page.tsx` з галереєю етапів і вибором способу оплати → виклик `POST /api/orders`.
2. **Сторінка "Про художницю"** (`/about`) — таймлайн кар'єри, фото зі студії, відео-інтерв'ю. Наступний крок у переосмисленні структури під особисті сайти художників (Kusama/Murakami як референс).
3. **Розділ "Новини та виставки"** (`/news`) — хронологічна стрічка подій.
4. Адмінка `app/[locale]/admin/` з розділенням прав ADMIN/ARTIST (потрібна автентифікація — рекомендую NextAuth).
5. `lib/s3.ts` — presigned URL для оригіналу, лише коли `order.status` ∈ {PAID, IN_PROGRESS, SHIPPED, DELIVERED}.
6. Автоматичний watermark для preview-зображень при завантаженні художницею.
7. Подати Stripe заявку і перевірити реальний вердикт щодо контенту (art nude ≠ explicit).
8. **Живі курси валют:** `EXCHANGE_RATES_FROM_USD` у `lib/currency.ts` — статичні заглушки. Перед запуском підключити реальний курс (напр. exchangerate-api.com) із періодичним оновленням/кешем.
9. **Відстеження посилки для клієнта** (запланована фіча) — `Order` у схемі вже має поля `trackingNumber`/`trackingCarrier`, `shippingPolicy` у футері вже згадує "функція в розробці". Коли дійде черга — це окрема сторінка або секція в кабінеті клієнта, що показує статус за цими полями (і, можливо, живий статус від служби доставки через їхнє API).
10. **Impressum для німецького ринку** — юридично обов'язкова окрема сторінка при продажу в Німеччину, наразі не створена. Деталі в `LEGAL_PAGES_GUIDE.md`.
11. **Реальний відеофайл процесу роботи** — якщо згодом захочете замінити слайд-шоу на відео (як у деяких референс-сайтів), знадобиться відеофайл від Марини + fallback на слайд-шоу для повільних з'єднань/`prefers-reduced-motion`.
12. **⚠️ `NEXT_PUBLIC_ALLOW_INDEXING="false"`** — сайт зараз навмисно закритий від пошукових систем (`<meta robots noindex>` + `robots.txt`) через невлаштовану вікову перевірку для деяких країн. Перед реальним запуском — поставити `"true"` в `.env` на Vercel.

## Нюанси, ще відкриті

1. **Валюта показу ≠ валюта списання.** Зараз `PriceTag` показує ціну в обраній валюті (UAH/EUR/GBP/USD), але фактичне списання через Stripe/NOWPayments все ще відбувається в USD — курс конвертації, який побачить клієнт на чекауті, залежатиме від банку/картки. Якщо потрібне списання саме в локальній валюті (Stripe підтримує multi-currency Prices) — це окремий крок, скажіть, чи він потрібен на цьому етапі.
2. **Гостьове замовлення чи акаунт клієнта?** — зараз гостьовий чекаут (email/ім'я прямо в `Order`).
3. **Якщо Stripe відмовить** — план Б: CCBill/Segpay/Verotel. До "card-to-crypto" сервісів на кшталт агресивно прорекламованого NexaPay варто ставитись з обережністю.
4. **Назви й описи картин** (`Product.title`, `description`) зараз зберігаються однією мовою (одне поле в БД), а не окремо для uk/en/de. Якщо потрібен переклад самого контенту галереї (не тільки інтерфейсу) — знадобиться або окремі поля на мову, або таблиця перекладів.
