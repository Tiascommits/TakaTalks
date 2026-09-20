export type VideoFormat = "short" | "long";
export type VideoPlatform = "facebook" | "youtube" | "local";

export type VideoEntry = {
  id: string;
  format: VideoFormat;
  platform: VideoPlatform;
  title: { en: string; bn: string };
  description: { en: string; bn: string };
  url: string;
  /** Native pixel dimensions of the source file, so the player is sized to
   *  the video's actual aspect ratio instead of a guess from `format`. */
  width: number;
  height: number;
  /** Optional in-app tool this video walks through, shown as a follow-up CTA. */
  relatedTool?: { href: string; label: { en: string; bn: string } };
};

export const VIDEOS: VideoEntry[] = [
  {
    id: "same-income-different-tax",
    format: "short",
    platform: "youtube",
    title: {
      en: "Same income, three different tax bills",
      bn: "একই ইনকাম, কিন্তু ট্যাক্স আলাদা কেন?",
    },
    description: {
      en: "Why three people with identical income can end up owing different amounts of tax.",
      bn: "একই ইনকাম হওয়া সত্ত্বেও তিনজন মানুষের ট্যাক্স আলাদা হয় কেন — কারণটা জানলে অবাক হয়ে যাবেন।",
    },
    url: "https://www.youtube.com/watch?v=7kCVi0ERRpc",
    width: 720,
    height: 406,
    relatedTool: {
      href: "/calculator",
      label: { en: "Try the Tax Calculator", bn: "ট্যাক্স ক্যালকুলেটর ব্যবহার করুন" },
    },
  },
  {
    id: "save-25k-income-tax",
    format: "long",
    platform: "youtube",
    title: {
      en: "Save Up To 25,000 Tk on Income Tax!",
      bn: "Income Tax থেকে ২৫,০০০ টাকা বাঁচান!",
    },
    description: {
      en: "Learn how to get a 5% incentive on your payable tax by filing your NBR return early.",
      bn: "আপনার ইনকাম ট্যাক্স থেকে ২৫,০০০ টাকা পর্যন্ত বাঁচিয়ে ফেলার সুযোগ দিচ্ছে NBR!",
    },
    url: "https://www.youtube.com/watch?v=RI7ECp8hTw4",
    width: 1920,
    height: 1080,
    relatedTool: {
      href: "/calculator",
      label: { en: "Try the Tax Calculator", bn: "ট্যাক্স ক্যালকুলেটর ব্যবহার করুন" },
    },
  },
  {
    id: "formula-of-income-tax",
    format: "short",
    platform: "youtube",
    title: {
      en: "Income Tax Calculation Shortcut Formula",
      bn: "ইনকাম ট্যাক্স হিসাব করার সবচেয়ে সহজ নিয়ম",
    },
    description: {
      en: "A simple shortcut formula to calculate your income tax instantly without complex slabs.",
      bn: "ইনকাম ট্যাক্সের হিসাব নিয়ে প্যারা খাচ্ছেন? এই ভিডিওতে আমরা শর্টকাট ফর্মুলা শিখিয়েছি!",
    },
    url: "https://www.youtube.com/watch?v=deMCuihZ408",
    width: 1080,
    height: 1920,
    relatedTool: {
      href: "/calculator",
      label: { en: "Try the Tax Calculator", bn: "ট্যাক্স ক্যালকুলেটর ব্যবহার করুন" },
    },
  }
];

export const SHORT_VIDEOS = VIDEOS.filter((v) => v.format === "short");
export const LONG_VIDEOS = VIDEOS.filter((v) => v.format === "long");
