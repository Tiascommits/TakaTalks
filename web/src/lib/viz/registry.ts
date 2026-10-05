/**
 * Catalogue of the shareable visualizers at /viz/<slug>. Server-safe (no
 * canvas code) so page metadata and the hub can read it; the drawing code for
 * each slug lives in src/components/viz/defs.
 */

export type VizMeta = {
  slug: string;
  icon: string;
  title: { en: string; bn: string };
  /** One-liner on the hub card and in link previews. */
  hook: { en: string; bn: string };
  tag: { en: string; bn: string };
};

export const VIZ_LIST: VizMeta[] = [
  {
    slug: "loading_car",
    icon: "🚗",
    title: { en: "Loading… My Dream Ride", bn: "লোডিং… আমার স্বপ্নের গাড়ি" },
    hook: {
      en: "Car, bike or CNG — watch it load like a download bar as you save.",
      bn: "গাড়ি, বাইক বা সিএনজি — সঞ্চয়ের সাথে ডাউনলোড বারের মতো লোড হতে দেখুন।",
    },
    tag: { en: "START HERE", bn: "এখান থেকে শুরু" },
  },
  {
    slug: "financial_freedom",
    icon: "🎲",
    title: { en: "Freedom Ludo", bn: "স্বাধীনতার সাপ-লুডু" },
    hook: {
      en: "Your road to financial freedom as a snakes & ladders board. Which square are you on?",
      bn: "আর্থিক স্বাধীনতার পথ — সাপ-লুডুর বোর্ডে। আপনি কোন ঘরে আছেন?",
    },
    tag: { en: "WHEN CAN I QUIT?", bn: "কবে চাকরি ছাড়ব?" },
  },
  {
    slug: "dream_house",
    icon: "🧱",
    title: { en: "Brick by Brick", bn: "ইট ইট করে স্বপ্নের বাড়ি" },
    hook: {
      en: "Every brick is a chunk of your flat or house fund. Lay them as you save.",
      bn: "প্রতিটি ইট আপনার বাড়ি/ফ্ল্যাট তহবিলের এক টুকরো। সঞ্চয় করুন, ইট বসান।",
    },
    tag: { en: "FLAT · PLOT · HOUSE", bn: "ফ্ল্যাট · প্লট · বাড়ি" },
  },
  {
    slug: "district_challenge",
    icon: "🗺️",
    title: { en: "64-District Savings Challenge", bn: "৬৪ জেলা সঞ্চয় চ্যালেঞ্জ" },
    hook: {
      en: "Split your goal into 64 districts. Conquer Bangladesh one taka at a time.",
      bn: "লক্ষ্যকে ৬৪ জেলায় ভাগ করুন। টাকায় টাকায় বাংলাদেশ জয় করুন।",
    },
    tag: { en: "CONQUER BD", bn: "দেশ জয়" },
  },
  {
    slug: "matir_bank",
    icon: "🏺",
    title: { en: "Matir Bank", bn: "মাটির ব্যাংক" },
    hook: {
      en: "Umrah, wedding, laptop, Cox's Bazar trip — fill the clay piggy bank for anything.",
      bn: "উমরাহ, বিয়ে, ল্যাপটপ, কক্সবাজার ট্রিপ — যেকোনো লক্ষ্যে মাটির ব্যাংক ভরান।",
    },
    tag: { en: "ANY GOAL", bn: "যেকোনো লক্ষ্য" },
  },
  {
    slug: "salary_in_kacchi",
    icon: "🍛",
    title: { en: "My Salary in Kacchi", bn: "আমার বেতন কত প্লেট কাচ্চি?" },
    hook: {
      en: "Your pay in plates of kacchi, cups of cha, kilos of ilish and iPhones.",
      bn: "আপনার বেতন — কাচ্চির প্লেট, চায়ের কাপ, ইলিশের কেজি আর আইফোনে।",
    },
    tag: { en: "JUST FOR FUN", bn: "মজার হিসাব" },
  },
  {
    slug: "hundred_box",
    icon: "✅",
    title: { en: "100-Box Challenge", bn: "১০০ ঘর সঞ্চয় চ্যালেঞ্জ" },
    hook: {
      en: "Print it, stick it on the wall, tick a box each time you save. 100 boxes = ৳5.05 lakh.",
      bn: "প্রিন্ট করে দেয়ালে লাগান, প্রতিবার সঞ্চয়ে একটি ঘর টিক দিন। ১০০ ঘর = ৳৫.০৫ লাখ।",
    },
    tag: { en: "PRINT & TICK", bn: "প্রিন্ট করে টিক দিন" },
  },
  {
    slug: "debt_free",
    icon: "⛓️",
    title: { en: "Break the Chain", bn: "ঋণের শিকল ভাঙো" },
    hook: {
      en: "Every EMI breaks a link. See the month you'll be debt-free.",
      bn: "প্রতিটি কিস্তিতে একটি শিকল ভাঙে। দেখুন কোন মাসে ঋণমুক্ত হবেন।",
    },
    tag: { en: "DEBT-FREE DATE", bn: "ঋণমুক্তির তারিখ" },
  },
  {
    slug: "taka_shrink",
    icon: "💸",
    title: { en: "The Shrinking Taka", bn: "টাকা ছোট হয়ে যাচ্ছে" },
    hook: {
      en: "Cash under the mattress vs. invested — what your money really buys in 10 years.",
      bn: "তোশকের নিচে নগদ বনাম বিনিয়োগ — ১০ বছর পর আপনার টাকায় আসলে কী কেনা যাবে।",
    },
    tag: { en: "INFLATION, SEEN", bn: "মূল্যস্ফীতি চোখে দেখুন" },
  },
];

export function getVizMeta(slug: string): VizMeta | undefined {
  return VIZ_LIST.find((v) => v.slug === slug);
}
