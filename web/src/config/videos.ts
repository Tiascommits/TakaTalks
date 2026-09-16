export type VideoFormat = "short" | "long";
export type VideoPlatform = "facebook" | "youtube";

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
    id: "fb-share-19sfrzz1mm",
    format: "short",
    platform: "facebook",
    title: {
      en: "TakaTalks Short",
      bn: "টাকাটকস শর্ট",
    },
    description: {
      en: "A quick money tip from the TakaTalks feed.",
      bn: "টাকাটকস ফিড থেকে একটি দ্রুত অর্থ-বিষয়ক টিপস।",
    },
    url: "https://www.facebook.com/share/v/19SFrZz1mm/",
    relatedTool: {
      href: "/calculator",
      label: { en: "Try the Tax Calculator", bn: "ট্যাক্স ক্যালকুলেটর ব্যবহার করুন" },
    },
  },
];

export const SHORT_VIDEOS = VIDEOS.filter((v) => v.format === "short");
export const LONG_VIDEOS = VIDEOS.filter((v) => v.format === "long");
