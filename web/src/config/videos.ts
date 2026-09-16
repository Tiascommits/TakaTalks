export type VideoFormat = "short" | "long";
export type VideoPlatform = "facebook" | "youtube" | "local";

export type VideoEntry = {
  id: string;
  format: VideoFormat;
  platform: VideoPlatform;
  title: { en: string; bn: string };
  description: { en: string; bn: string };
  url: string;
  /** Optional in-app tool this video walks through, shown as a follow-up CTA. */
  relatedTool?: { href: string; label: { en: string; bn: string } };
};

export const VIDEOS: VideoEntry[] = [
  {
    id: "same-income-different-tax",
    format: "short",
    platform: "local",
    title: {
      en: "Same income, three different tax bills",
      bn: "একই ইনকাম, তিনজন মানুষ — কিন্তু ট্যাক্স তিন রকম!",
    },
    description: {
      en: "Why three people with identical income can end up owing different amounts of tax.",
      bn: "একই ইনকাম হওয়া সত্ত্বেও তিনজন মানুষের ট্যাক্স আলাদা হয় কেন — কারণটা জানলে অবাক হয়ে যাবেন।",
    },
    url: "/videos/same-income-different-tax.mp4",
    relatedTool: {
      href: "/calculator",
      label: { en: "Try the Tax Calculator", bn: "ট্যাক্স ক্যালকুলেটর ব্যবহার করুন" },
    },
  },
  {
    id: "tax-slabs-explained",
    format: "long",
    platform: "local",
    title: {
      en: "Bangladesh's income tax slabs, explained",
      bn: "বাংলাদেশের ট্যাক্স স্ল্যাব বোঝা যাক",
    },
    description: {
      en: "A walkthrough of how each tax slab and rate actually applies to your income.",
      bn: "আপনার ইনকামে প্রতিটি ট্যাক্স স্ল্যাব ও হার কীভাবে প্রযোজ্য হয়, তার বিস্তারিত আলোচনা।",
    },
    url: "/videos/tax-slabs-explained.mp4",
    relatedTool: {
      href: "/calculator",
      label: { en: "Try the Tax Calculator", bn: "ট্যাক্স ক্যালকুলেটর ব্যবহার করুন" },
    },
  },
];

export const SHORT_VIDEOS = VIDEOS.filter((v) => v.format === "short");
export const LONG_VIDEOS = VIDEOS.filter((v) => v.format === "long");
