import type { Locale } from "@/i18n/config";

export type EmailableStatus = "PAID" | "PAINTING" | "DRYING" | "READY_TO_SHIP" | "SHIPPED" | "DELIVERED";

interface StatusCopy {
  subject: string;
  heading: string;
  body: string[]; // one or more paragraphs, rendered in order
}

interface LocaleCopy {
  greeting: (name: string) => string;
  orderLabel: string;
  paintingsLabel: string;
  trackLabel: string;
  trackButton: string;
  questionsLabel: string;
  signOff: string;
  statuses: Record<EmailableStatus, StatusCopy>;
}

// PAID is deliberately the richest email — it's the very first thing a
// customer sees after paying, doubling as both a receipt and the
// instructions for everything that follows (how tracking works, where
// to ask questions). Every status after that assumes the customer
// already read PAID once and just needs the update.
const COPY: Record<Locale, LocaleCopy> = {
  uk: {
    greeting: (name) => `Вітаємо, ${name}!`,
    orderLabel: "Номер замовлення",
    paintingsLabel: "Картина",
    trackLabel: "Відстежити статус замовлення можна в будь-який момент за цим номером на сторінці",
    trackButton: "Переглянути статус замовлення",
    questionsLabel:
      "Виникли питання про замовлення, доставку чи саму роботу — просто дайте відповідь на цей лист, або напишіть нам через сторінку",
    signOff: "Дякуємо, що обрали Timchenko Art.",
    statuses: {
      PAID: {
        subject: "Дякуємо за замовлення — {painting}",
        heading: "Дякуємо за ваше замовлення цієї чудової картини!",
        body: [
          "Ми отримали оплату, і художниця вже готується братися до роботи. Нижче — номер вашого замовлення: збережіть цей лист або сам номер, він знадобиться, щоб у будь-який момент перевірити статус.",
          "Коротко про те, що далі: спочатку картина малюється, потім сохне, після цього пакується й готується до відправки, і нарешті — вирушає до вас із трек-номером перевізника. Ми надішлемо окремий лист на кожному з цих етапів, тож можете просто чекати на новини — або перевірити статус самостійно в будь-який момент за посиланням нижче.",
        ],
      },
      PAINTING: {
        subject: "Ваша картина малюється — {painting}",
        heading: "Художниця вже почала роботу",
        body: ["Ваша картина прямо зараз малюється художницею. Наступне оновлення — коли робота висохне."],
      },
      DRYING: {
        subject: "Картина сохне — {painting}",
        heading: "Картина написана і зараз сохне",
        body: ["Малярський шар готовий, зараз картина сохне перед пакуванням. Це природний процес, який займає певний час — дякуємо за терпіння."],
      },
      READY_TO_SHIP: {
        subject: "Картина готова до відправки — {painting}",
        heading: "Ваша картина готова!",
        body: ["Робота висохла, упакована і готується до передачі перевізнику. Щойно з'явиться трек-номер, ми одразу надішлемо його вам окремим листом."],
      },
      SHIPPED: {
        subject: "Замовлення відправлено — {painting}",
        heading: "Картина в дорозі до вас",
        body: ["Ваше замовлення передано перевізнику. Трек-номер і назву служби доставки ви знайдете нижче — за ними можна стежити за посилкою напряму в перевізника, або на сторінці статусу замовлення на нашому сайті."],
      },
      DELIVERED: {
        subject: "Замовлення доставлено — {painting}",
        heading: "Картина вже у вас!",
        body: ["Раді, що робота дісталась до вас. Сподіваємось, вона принесе багато радості. Якщо щось не так з посилкою чи станом картини — одразу дайте нам знати, відповівши на цей лист."],
      },
    },
  },
  en: {
    greeting: (name) => `Hi ${name},`,
    orderLabel: "Order number",
    paintingsLabel: "Painting",
    trackLabel: "You can check your order's status at any time using this number on the",
    trackButton: "View order status",
    questionsLabel: "Questions about your order, shipping, or the piece itself — just reply to this email, or reach us via the",
    signOff: "Thank you for choosing Timchenko Art.",
    statuses: {
      PAID: {
        subject: "Thank you for your order — {painting}",
        heading: "Thank you for ordering this beautiful painting!",
        body: [
          "We've received your payment, and the artist is getting ready to start. Below is your order number — keep this email or the number itself, you'll need it to check the status at any time.",
          "Here's what happens next: the painting gets painted, then dries, then is packed and prepared for shipping, and finally ships out with a courier tracking number. We'll send a short email at each of these stages — or you can check the status yourself anytime via the link below.",
        ],
      },
      PAINTING: {
        subject: "Your painting is underway — {painting}",
        heading: "The artist has started working",
        body: ["Your painting is being created right now. Next update will be once it's dry."],
      },
      DRYING: {
        subject: "Your painting is drying — {painting}",
        heading: "The painting is finished and drying",
        body: ["The paint layer is done and now drying before packing. This is a natural process that takes some time — thank you for your patience."],
      },
      READY_TO_SHIP: {
        subject: "Your painting is ready — {painting}",
        heading: "Your painting is ready!",
        body: ["It's dry, packed, and being prepared for handoff to the courier. As soon as there's a tracking number, we'll send it in a separate email."],
      },
      SHIPPED: {
        subject: "Your order has shipped — {painting}",
        heading: "Your painting is on its way",
        body: ["Your order has been handed to the courier. The tracking number and carrier are below — you can follow the parcel directly with them, or on our order status page."],
      },
      DELIVERED: {
        subject: "Your order was delivered — {painting}",
        heading: "Your painting has arrived!",
        body: ["We're glad it made it to you. We hope it brings you a lot of joy. If anything is wrong with the parcel or the painting's condition, just reply to this email right away."],
      },
    },
  },
  de: {
    greeting: (name) => `Hallo ${name},`,
    orderLabel: "Bestellnummer",
    paintingsLabel: "Gemälde",
    trackLabel: "Den Status Ihrer Bestellung können Sie jederzeit mit dieser Nummer auf der Seite",
    trackButton: "Bestellstatus ansehen",
    questionsLabel: "Fragen zur Bestellung, zum Versand oder zum Werk selbst? Antworten Sie einfach auf diese E-Mail oder schreiben Sie uns über die",
    signOff: "Vielen Dank, dass Sie sich für Timchenko Art entschieden haben.",
    statuses: {
      PAID: {
        subject: "Danke für Ihre Bestellung — {painting}",
        heading: "Danke für Ihre Bestellung dieses wunderschönen Gemäldes!",
        body: [
          "Wir haben Ihre Zahlung erhalten, und die Künstlerin bereitet sich vor, mit der Arbeit zu beginnen. Unten finden Sie Ihre Bestellnummer — bewahren Sie diese E-Mail oder die Nummer selbst auf, Sie benötigen sie, um den Status jederzeit zu prüfen.",
          "So geht es weiter: Das Gemälde wird gemalt, trocknet, wird verpackt und für den Versand vorbereitet und geht schließlich mit einer Sendungsnummer auf die Reise. Wir senden bei jedem dieser Schritte eine kurze E-Mail — oder Sie prüfen den Status jederzeit selbst über den Link unten.",
        ],
      },
      PAINTING: {
        subject: "Ihr Gemälde entsteht gerade — {painting}",
        heading: "Die Künstlerin hat mit der Arbeit begonnen",
        body: ["Ihr Gemälde wird gerade gemalt. Das nächste Update folgt, sobald es getrocknet ist."],
      },
      DRYING: {
        subject: "Ihr Gemälde trocknet — {painting}",
        heading: "Das Gemälde ist fertig gemalt und trocknet",
        body: ["Die Malschicht ist fertig und trocknet nun vor dem Verpacken. Das ist ein natürlicher Prozess, der etwas Zeit braucht — danke für Ihre Geduld."],
      },
      READY_TO_SHIP: {
        subject: "Ihr Gemälde ist versandbereit — {painting}",
        heading: "Ihr Gemälde ist fertig!",
        body: ["Es ist trocken, verpackt und wird für die Übergabe an den Kurier vorbereitet. Sobald es eine Sendungsnummer gibt, senden wir sie in einer separaten E-Mail."],
      },
      SHIPPED: {
        subject: "Ihre Bestellung wurde versandt — {painting}",
        heading: "Ihr Gemälde ist unterwegs",
        body: ["Ihre Bestellung wurde dem Kurier übergeben. Sendungsnummer und Versanddienst finden Sie unten — Sie können die Sendung direkt dort oder auf unserer Bestellstatus-Seite verfolgen."],
      },
      DELIVERED: {
        subject: "Ihre Bestellung wurde zugestellt — {painting}",
        heading: "Ihr Gemälde ist angekommen!",
        body: ["Wir freuen uns, dass es bei Ihnen angekommen ist. Wir hoffen, es bereitet Ihnen viel Freude. Sollte mit der Sendung oder dem Zustand des Gemäldes etwas nicht stimmen, antworten Sie einfach umgehend auf diese E-Mail."],
      },
    },
  },
  fr: {
    greeting: (name) => `Bonjour ${name},`,
    orderLabel: "Numéro de commande",
    paintingsLabel: "Tableau",
    trackLabel: "Vous pouvez suivre le statut de votre commande à tout moment avec ce numéro sur la page",
    trackButton: "Voir le statut de la commande",
    questionsLabel: "Des questions sur votre commande, la livraison ou l'œuvre elle-même ? Répondez simplement à cet e-mail, ou contactez-nous via la page",
    signOff: "Merci d'avoir choisi Timchenko Art.",
    statuses: {
      PAID: {
        subject: "Merci pour votre commande — {painting}",
        heading: "Merci pour votre commande de ce magnifique tableau !",
        body: [
          "Nous avons bien reçu votre paiement, et l'artiste se prépare à commencer. Ci-dessous, votre numéro de commande — conservez cet e-mail ou ce numéro, il vous servira à vérifier le statut à tout moment.",
          "Voici la suite : le tableau est peint, puis sèche, puis est emballé et préparé pour l'expédition, et enfin part avec un numéro de suivi. Nous vous enverrons un court e-mail à chacune de ces étapes — ou vous pouvez vérifier le statut vous-même à tout moment via le lien ci-dessous.",
        ],
      },
      PAINTING: {
        subject: "Votre tableau est en cours de création — {painting}",
        heading: "L'artiste a commencé le travail",
        body: ["Votre tableau est en cours de création. Prochaine mise à jour une fois qu'il sera sec."],
      },
      DRYING: {
        subject: "Votre tableau sèche — {painting}",
        heading: "Le tableau est peint et sèche actuellement",
        body: ["La couche de peinture est terminée et sèche maintenant avant l'emballage. C'est un processus naturel qui prend un certain temps — merci de votre patience."],
      },
      READY_TO_SHIP: {
        subject: "Votre tableau est prêt — {painting}",
        heading: "Votre tableau est prêt !",
        body: ["Il est sec, emballé, et en préparation pour la remise au transporteur. Dès qu'un numéro de suivi sera disponible, nous vous l'enverrons dans un e-mail séparé."],
      },
      SHIPPED: {
        subject: "Votre commande a été expédiée — {painting}",
        heading: "Votre tableau est en route",
        body: ["Votre commande a été remise au transporteur. Le numéro de suivi et le transporteur sont ci-dessous — vous pouvez suivre le colis directement chez eux, ou sur notre page de statut de commande."],
      },
      DELIVERED: {
        subject: "Votre commande a été livrée — {painting}",
        heading: "Votre tableau est arrivé !",
        body: ["Nous sommes heureux qu'il vous soit parvenu. Nous espérons qu'il vous apportera beaucoup de joie. Si quoi que ce soit ne va pas avec le colis ou l'état du tableau, répondez simplement à cet e-mail sans tarder."],
      },
    },
  },
  ja: {
    greeting: (name) => `${name} 様`,
    orderLabel: "注文番号",
    paintingsLabel: "作品",
    trackLabel: "この番号を使って、いつでも次のページで注文状況を確認できます:",
    trackButton: "注文状況を見る",
    questionsLabel: "ご注文、配送、作品についてご質問がありましたら、このメールにご返信いただくか、こちらのページからお問い合わせください:",
    signOff: "Timchenko Artをお選びいただき、ありがとうございます。",
    statuses: {
      PAID: {
        subject: "ご注文ありがとうございます — {painting}",
        heading: "この美しい作品をご注文いただき、ありがとうございます！",
        body: [
          "お支払いを確認いたしました。作家がまもなく制作を開始いたします。以下がご注文番号です — このメールまたは番号を保管しておいてください。いつでも状況確認に必要になります。",
          "今後の流れ: 制作 → 乾燥 → 梱包・発送準備 → 追跡番号付きで発送、という順番になります。各段階で短いメールをお送りしますが、下のリンクからいつでもご自身で状況を確認いただくこともできます。",
        ],
      },
      PAINTING: {
        subject: "作品を制作中です — {painting}",
        heading: "作家が制作を開始しました",
        body: ["作品は現在制作中です。乾燥が完了次第、次のご連絡をいたします。"],
      },
      DRYING: {
        subject: "作品を乾燥中です — {painting}",
        heading: "作品の制作が完了し、乾燥させています",
        body: ["絵画部分は完成し、梱包前に乾燥させています。これは自然な工程で、多少お時間をいただきます — ご了承ください。"],
      },
      READY_TO_SHIP: {
        subject: "作品の発送準備が整いました — {painting}",
        heading: "作品の準備が整いました！",
        body: ["乾燥・梱包が完了し、配送業者への引き渡し準備をしています。追跡番号が発行され次第、改めてメールでお知らせします。"],
      },
      SHIPPED: {
        subject: "ご注文の商品を発送しました — {painting}",
        heading: "作品が発送されました",
        body: ["ご注文の商品を配送業者に引き渡しました。追跡番号と配送業者は下記の通りです — 配送業者のサイト、または当サイトの注文状況ページで直接ご確認いただけます。"],
      },
      DELIVERED: {
        subject: "ご注文の商品が届きました — {painting}",
        heading: "作品がお手元に届きました！",
        body: ["無事にお届けできて嬉しく思います。末永くお楽しみいただければ幸いです。荷物や作品の状態に問題がございましたら、すぐにこのメールにご返信ください。"],
      },
    },
  },
};

function escapeHtml(str: string): string {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export interface OrderEmailParams {
  locale: Locale;
  status: EmailableStatus;
  customerName: string;
  orderId: string;
  paintingTitles: string[];
  trackingUrl: string;
  trackingNumber?: string | null;
  trackingCarrier?: string | null;
  contactUrl: string;
}

export function renderOrderStatusEmail(params: OrderEmailParams): { subject: string; html: string } {
  const copy = COPY[params.locale] ?? COPY.uk;
  const statusCopy = copy.statuses[params.status];
  const paintingSummary = params.paintingTitles.join(", ");

  const subject = statusCopy.subject.replace("{painting}", paintingSummary);

  const html = `
<!DOCTYPE html>
<html>
  <body style="margin:0;padding:0;background-color:#f5f5f3;font-family:Georgia,'Times New Roman',serif;color:#1a1a1a;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;background-color:#ffffff;border-radius:8px;overflow:hidden;">
            <tr>
              <td style="padding:32px 32px 8px;">
                <p style="margin:0 0 24px;font-size:14px;letter-spacing:0.06em;text-transform:uppercase;color:#8a8478;">Timchenko Art</p>
                <p style="margin:0 0 4px;font-size:16px;">${escapeHtml(copy.greeting(params.customerName))}</p>
                <h1 style="margin:16px 0 16px;font-size:22px;line-height:1.3;">${escapeHtml(statusCopy.heading)}</h1>
                ${statusCopy.body.map((p) => `<p style="margin:0 0 16px;font-size:15px;line-height:1.7;">${escapeHtml(p)}</p>`).join("\n")}
              </td>
            </tr>
            <tr>
              <td style="padding:0 32px;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f5f3;border-radius:6px;margin-bottom:20px;">
                  <tr>
                    <td style="padding:16px 20px;font-size:14px;">
                      <p style="margin:0 0 6px;color:#6e6e6c;">${escapeHtml(copy.orderLabel)}</p>
                      <p style="margin:0 0 12px;font-weight:bold;font-family:monospace;font-size:15px;">${escapeHtml(params.orderId)}</p>
                      <p style="margin:0 0 6px;color:#6e6e6c;">${escapeHtml(copy.paintingsLabel)}</p>
                      <p style="margin:0;font-weight:bold;">${escapeHtml(paintingSummary)}</p>
                      ${
                        params.status === "SHIPPED" && (params.trackingNumber || params.trackingCarrier)
                          ? `<p style="margin:12px 0 0;color:#6e6e6c;">${escapeHtml(params.trackingCarrier ?? "")}</p><p style="margin:0;font-weight:bold;font-family:monospace;">${escapeHtml(params.trackingNumber ?? "")}</p>`
                          : ""
                      }
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:0 32px 8px;">
                <p style="margin:0 0 16px;font-size:14px;line-height:1.7;color:#3a3a3a;">
                  ${escapeHtml(copy.trackLabel)}
                  <a href="${params.trackingUrl}" style="color:#b3452b;">${escapeHtml(copy.trackButton)}</a>.
                </p>
                <p style="margin:0 0 24px;font-size:14px;line-height:1.7;color:#3a3a3a;">
                  ${escapeHtml(copy.questionsLabel)}
                  <a href="${params.contactUrl}" style="color:#b3452b;">${escapeHtml(params.contactUrl)}</a>.
                </p>
                <p style="margin:0 0 8px;font-size:14px;color:#6e6e6c;">${escapeHtml(copy.signOff)}</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`.trim();

  return { subject, html };
}
