"use client";

import Link from "next/link";
import { useLanguage } from "@/lib/i18n";

// The only contact channel the project publishes. Public, so both pages warn
// people not to post personal or financial details there.
const ISSUES_URL = "https://github.com/Tiascommits/TakaTalks/issues";
const LAST_UPDATED = { en: "15 October 2026", bn: "১৫ অক্টোবর ২০২৬" };

const linkClass = "underline text-green-deep";

function LegalShell({ title, children }: { title: { en: string; bn: string }; children: React.ReactNode }) {
  const { t } = useLanguage();
  return (
    <div className="w-full max-w-[760px] mx-auto px-5 py-8">
      <h1 className="font-serif font-bold text-2xl sm:text-3xl text-green-deep mb-1.5">{t(title.en, title.bn)}</h1>
      <p className="text-xs text-muted mb-6">
        {t("Last updated:", "সর্বশেষ হালনাগাদ:")} {t(LAST_UPDATED.en, LAST_UPDATED.bn)}
      </p>
      <div className="flex flex-col gap-5 text-sm text-[#333] leading-relaxed">{children}</div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="font-serif font-semibold text-lg text-green-deep mb-1.5">{title}</h2>
      {children}
    </section>
  );
}

function IssuesLink() {
  const { t } = useLanguage();
  return (
    <a href={ISSUES_URL} target="_blank" rel="noopener noreferrer" className={linkClass}>
      {t("our GitHub issues page", "আমাদের GitHub issues পাতায়")}
    </a>
  );
}

export function PrivacyNotice() {
  const { t } = useLanguage();
  return (
    <LegalShell title={{ en: "Privacy notice", bn: "গোপনীয়তা নীতি" }}>
      <p>
        {t(
          "TakaTalks is a set of personal-finance calculators and a tracker for people in Bangladesh. This notice says what the site collects, where it is kept, for how long, and how to delete it.",
          "TakaTalks বাংলাদেশের মানুষের জন্য কিছু ব্যক্তিগত অর্থ-হিসাবের ক্যালকুলেটর ও একটি ট্র্যাকার। এই সাইট কী তথ্য নেয়, কোথায় রাখে, কতদিন রাখে এবং কীভাবে মুছবেন — এখানে তা বলা আছে।"
        )}
      </p>

      <Section title={t("Calculators: nothing leaves your device", "ক্যালকুলেটর: কিছুই আপনার ডিভাইস ছাড়ে না")}>
        <p>
          {t(
            "The calculators (tax, salary, savings, loans, zakat and the rest) run in your browser. What you type into them is not sent to us. Your language choice is saved in your browser only.",
            "ক্যালকুলেটরগুলো (কর, বেতন, সঞ্চয়, ঋণ, যাকাত ইত্যাদি) আপনার ব্রাউজারেই চলে। এগুলোতে যা লেখেন তা আমাদের কাছে আসে না। ভাষার পছন্দটি শুধু আপনার ব্রাউজারে সেভ থাকে।"
          )}
        </p>
      </Section>

      <Section title={t("The tracker: stored on our server", "ট্র্যাকার: আমাদের সার্ভারে সংরক্ষিত")}>
        <p>
          {t(
            "Only if you use the tracker, or save a reinvestment suggestion, we store on our server: your income entries (label, type, amount, how often), your investments (label, type, amount, dates, rate, payout), your tax profile if you save one, and reinvestment suggestions you save or open from a tracked investment. Your first save creates an anonymous account: no name or password, just a random ID kept in a cookie.",
            "শুধু ট্র্যাকার ব্যবহার করলে বা কোনো পুনঃবিনিয়োগ পরামর্শ সেভ করলে আমরা সার্ভারে রাখি: আপনার আয়ের এন্ট্রি (নাম, ধরন, পরিমাণ, কত দিন পরপর), বিনিয়োগ (নাম, ধরন, পরিমাণ, তারিখ, হার, প্রাপ্ত অর্থ), সেভ করলে আপনার ট্যাক্স প্রোফাইল, এবং যে পুনঃবিনিয়োগ পরামর্শ আপনি সেভ করেন বা ট্র্যাক করা বিনিয়োগ থেকে খোলেন। প্রথমবার সেভ করলে একটি নামহীন অ্যাকাউন্ট তৈরি হয়: নাম বা পাসওয়ার্ড নেই, শুধু একটি এলোমেলো আইডি, যা একটি কুকিতে থাকে।"
          )}
        </p>
      </Section>

      <Section title={t("Email or phone, if you link one", "ইমেইল বা ফোন, যদি যুক্ত করেন")}>
        <p>
          {t(
            "If you link an email address or phone number, for maturity reminders or to open your tracker on another device, we store it and send login links, codes and reminders through Resend (email) or WhatsApp (Meta). Links and codes expire within 15 minutes.",
            "মেয়াদপূর্তির রিমাইন্ডার পেতে বা অন্য ডিভাইসে ট্র্যাকার খুলতে ইমেইল বা ফোন নম্বর যুক্ত করলে আমরা তা সংরক্ষণ করি, এবং Resend (ইমেইল) বা WhatsApp (Meta)-এর মাধ্যমে লগইন লিংক, কোড ও রিমাইন্ডার পাঠাই। লিংক ও কোড ১৫ মিনিটের মধ্যে মেয়াদোত্তীর্ণ হয়।"
          )}
        </p>
      </Section>

      <Section title={t("Cookies", "কুকি")}>
        <ul className="list-disc pl-5 flex flex-col gap-1">
          <li>
            {t(
              "taka_uid keeps your tracker account in this browser. It is set only after your first save and lasts up to 2 years.",
              "taka_uid এই ব্রাউজারে আপনার ট্র্যাকার অ্যাকাউন্ট মনে রাখে। প্রথমবার সেভ করার পরেই এটি সেট হয় এবং সর্বোচ্চ ২ বছর থাকে।"
            )}
          </li>
          <li>{t("Site admins also get a login cookie.", "সাইটের অ্যাডমিনদের জন্য একটি লগইন কুকিও আছে।")}</li>
          <li>
            {t(
              "Videos on the homepage and the Videos page are embedded from YouTube, which may set its own cookies when a video loads.",
              "হোমপেজ ও ভিডিও পাতার ভিডিওগুলো YouTube থেকে যুক্ত; ভিডিও লোড হলে YouTube নিজস্ব কুকি সেট করতে পারে।"
            )}
          </li>
          <li>{t("We use no advertising cookies.", "আমরা কোনো বিজ্ঞাপনী কুকি ব্যবহার করি না।")}</li>
        </ul>
      </Section>

      <Section title={t("Analytics and server logs", "অ্যানালিটিক্স ও সার্ভার লগ")}>
        <p>
          {t(
            "We count page views with GoatCounter. It sets no cookies and records the page, the referring site, browser type and country, not who you are or what you type. Like any website, our host receives your IP address and browser details to serve each page. To stop abuse, we keep short-lived counters keyed by a one-way hash of your IP address; they expire within an hour.",
            "পেজ ভিউ গোনার জন্য আমরা GoatCounter ব্যবহার করি। এটি কোনো কুকি সেট করে না; শুধু কোন পাতা, কোন সাইট থেকে এসেছেন, ব্রাউজারের ধরন ও দেশ রাখে — আপনি কে বা কী লেখেন তা নয়। যেকোনো ওয়েবসাইটের মতো, পাতা দেখাতে আমাদের হোস্ট আপনার IP ঠিকানা ও ব্রাউজারের তথ্য পায়। অপব্যবহার ঠেকাতে আমরা আপনার IP ঠিকানার একমুখী হ্যাশ দিয়ে স্বল্পমেয়াদি গণনা রাখি, যা এক ঘণ্টার মধ্যে মুছে যায়।"
          )}
        </p>
      </Section>

      <Section title={t("Where it is stored", "কোথায় রাখা হয়")}>
        <p>
          {t(
            "The site runs on Vercel servers in the United States (Washington, D.C.). Tracker data is kept in a PostgreSQL database hosted by Neon. Both are outside Bangladesh, so your data is processed abroad.",
            "সাইটটি যুক্তরাষ্ট্রে (ওয়াশিংটন, ডি.সি.) Vercel-এর সার্ভারে চলে। ট্র্যাকারের তথ্য Neon-এর হোস্ট করা একটি PostgreSQL ডেটাবেসে থাকে। দুটিই বাংলাদেশের বাইরে, তাই আপনার তথ্য বিদেশে প্রক্রিয়াজাত হয়।"
          )}
        </p>
      </Section>

      <Section title={t("How long we keep it", "কতদিন রাখি")}>
        <p>
          {t(
            "Tracker data and any linked email or phone stay until you delete them. If you clear your cookies without linking an email or phone, you can no longer reach that tracker data, and it is not yet deleted automatically.",
            "ট্র্যাকারের তথ্য এবং যুক্ত ইমেইল বা ফোন, আপনি না মোছা পর্যন্ত থাকে। ইমেইল বা ফোন যুক্ত না করে কুকি মুছে ফেললে সেই ট্র্যাকারের তথ্যে আর পৌঁছানো যায় না, এবং তা এখনো স্বয়ংক্রিয়ভাবে মোছা হয় না।"
          )}
        </p>
      </Section>

      <Section title={t("Deleting your data", "আপনার তথ্য মুছবেন যেভাবে")}>
        <p>
          {t("Open the", "")}{" "}
          <Link href="/account" className={linkClass}>
            {t("Account page", "অ্যাকাউন্ট পাতায়")}
          </Link>{" "}
          {t(
            "and choose “Delete my data”. It permanently removes your income and investment entries, tax profile, reminders and email or phone from our server. Clearing cookies alone deletes nothing.",
            "গিয়ে “আমার ডেটা মুছে ফেলো” বেছে নিন। এতে আমাদের সার্ভার থেকে আপনার আয় ও বিনিয়োগের এন্ট্রি, ট্যাক্স প্রোফাইল, রিমাইন্ডার এবং ইমেইল বা ফোন স্থায়ীভাবে মুছে যায়। শুধু কুকি মুছলে কিছুই মোছে না।"
          )}
        </p>
      </Section>

      <Section title={t("Who else sees it", "আর কে দেখে")}>
        <p>
          {t(
            "We don't sell your data or use it for ads. It goes only to the services that run the site: Vercel (hosting), Neon (database), Resend and WhatsApp (only to send messages you asked for), GoatCounter (page counts) and YouTube (embedded videos).",
            "আমরা আপনার তথ্য বিক্রি করি না বা বিজ্ঞাপনে ব্যবহার করি না। তথ্য শুধু সাইট চালানোর সেবাগুলোর কাছে যায়: Vercel (হোস্টিং), Neon (ডেটাবেস), Resend ও WhatsApp (শুধু আপনার চাওয়া বার্তা পাঠাতে), GoatCounter (পেজ গণনা) ও YouTube (যুক্ত ভিডিও)।"
          )}
        </p>
      </Section>

      <Section title={t("Estimates, not advice", "আনুমানিক হিসাব, পরামর্শ নয়")}>
        <p>
          {t(
            "Tax and investment figures on this site are estimates, not tax, legal or investment advice. See the",
            "এই সাইটের কর ও বিনিয়োগের অঙ্কগুলো আনুমানিক হিসাব — কর, আইনি বা বিনিয়োগ পরামর্শ নয়। বিস্তারিত"
          )}{" "}
          <Link href="/terms" className={linkClass}>
            {t("terms of use", "ব্যবহারের শর্তাবলিতে")}
          </Link>
          {t(".", "।")}
        </p>
      </Section>

      <Section title={t("Questions", "প্রশ্ন")}>
        <p>
          {t("Ask on", "প্রশ্ন থাকলে")} <IssuesLink />
          {t(
            ". It is public, so don't post personal or financial details there. We will update this page, and the date above, when what we collect changes.",
            " লিখুন। পাতাটি সবার জন্য খোলা, তাই সেখানে ব্যক্তিগত বা আর্থিক তথ্য দেবেন না। আমরা কী তথ্য নিই তা বদলালে এই পাতা ও উপরের তারিখ হালনাগাদ করব।"
          )}
        </p>
      </Section>
    </LegalShell>
  );
}

export function TermsOfUse() {
  const { t } = useLanguage();
  return (
    <LegalShell title={{ en: "Terms of use", bn: "ব্যবহারের শর্তাবলি" }}>
      <Section title={t("What this site is", "এই সাইট কী")}>
        <p>
          {t(
            "TakaTalks offers free personal-finance calculators and a tracker for people in Bangladesh, alongside the TakaTalks videos. By using the site you accept these terms.",
            "TakaTalks বাংলাদেশের মানুষের জন্য বিনামূল্যে ব্যক্তিগত অর্থ-হিসাবের ক্যালকুলেটর ও একটি ট্র্যাকার দেয়, TakaTalks ভিডিওর পাশাপাশি। সাইটটি ব্যবহার করলে আপনি এই শর্তগুলো মেনে নেন।"
          )}
        </p>
      </Section>

      <Section title={t("Estimates, not advice", "আনুমানিক হিসাব, পরামর্শ নয়")}>
        <p>
          {t(
            "Every tax, salary, savings, loan, zakat and investment figure here is an estimate based on published rules and data as we understand them. Rules change with each budget, and our numbers can be wrong or out of date. Nothing here is tax, legal or investment advice, and it is not a tax return. File your return at etaxnbr.gov.bd, and check with NBR, your bank or a qualified adviser before you act.",
            "এখানকার প্রতিটি কর, বেতন, সঞ্চয়, ঋণ, যাকাত ও বিনিয়োগের অঙ্ক প্রকাশিত নিয়ম ও তথ্য আমরা যেভাবে বুঝি তার ভিত্তিতে আনুমানিক হিসাব। প্রতি বাজেটে নিয়ম বদলায়, আর আমাদের অঙ্ক ভুল বা পুরনো হতে পারে। এখানে কিছুই কর, আইনি বা বিনিয়োগ পরামর্শ নয়, এবং এটি আয়কর রিটার্ন নয়। রিটার্ন দাখিল করুন etaxnbr.gov.bd-তে, আর কিছু করার আগে এনবিআর, আপনার ব্যাংক বা যোগ্য পরামর্শকের সাথে মিলিয়ে নিন।"
          )}
        </p>
      </Section>

      <Section title={t("Bank rates and rankings", "ব্যাংক রেট ও ক্রম")}>
        <p>
          {t(
            "Bank rates and figures come from what banks publish and may be late or wrong. Any sorting or ranking is arithmetic for convenience, not a recommendation of a bank, fund or product.",
            "ব্যাংকের রেট ও তথ্য ব্যাংকগুলোর নিজেদের প্রকাশ থেকে নেওয়া, দেরিতে আসা বা ভুল হতে পারে। যেকোনো সাজানো বা ক্রম শুধু সুবিধার জন্য করা হিসাব — কোনো ব্যাংক, ফান্ড বা পণ্যের সুপারিশ নয়।"
          )}
        </p>
      </Section>

      <Section title={t("Your decisions", "আপনার সিদ্ধান্ত")}>
        <p>
          {t(
            "You decide what to do with your money. The site is free and provided as it is, and its features may change or stop. As far as the law allows, we are not liable for losses or penalties from decisions based on it.",
            "আপনার টাকা নিয়ে কী করবেন, সে সিদ্ধান্ত আপনার। সাইটটি বিনামূল্যে ও যেমন আছে তেমনভাবে দেওয়া হয়, এর সুবিধাগুলো বদলাতে বা বন্ধ হতে পারে। আইন যতটা অনুমতি দেয়, এর ভিত্তিতে নেওয়া সিদ্ধান্তের ক্ষতি বা জরিমানার দায় আমরা নিই না।"
          )}
        </p>
      </Section>

      <Section title={t("Fair use", "ন্যায্য ব্যবহার")}>
        <p>
          {t(
            "Don't try to break or overload the site, or reach anyone else's data.",
            "সাইটটি ভাঙার বা অতিরিক্ত চাপ দেওয়ার চেষ্টা করবেন না, অন্য কারও তথ্যে ঢোকার চেষ্টাও নয়।"
          )}
        </p>
      </Section>

      <Section title={t("Your data", "আপনার তথ্য")}>
        <p>
          {t("What we store and how to delete it is in the", "আমরা কী রাখি ও কীভাবে মুছবেন, তা আছে")}{" "}
          <Link href="/privacy" className={linkClass}>
            {t("privacy notice", "গোপনীয়তা নীতিতে")}
          </Link>
          {t(".", "।")}
        </p>
      </Section>

      <Section title={t("Questions", "প্রশ্ন")}>
        <p>
          {t("Ask on", "প্রশ্ন থাকলে")} <IssuesLink />
          {t(
            ". It is public, so don't post personal or financial details there.",
            " লিখুন। পাতাটি সবার জন্য খোলা, তাই সেখানে ব্যক্তিগত বা আর্থিক তথ্য দেবেন না।"
          )}
        </p>
      </Section>
    </LegalShell>
  );
}
