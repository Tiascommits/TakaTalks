/**
 * What to tell someone when a tracker request fails, by HTTP status. `null` means
 * the request never got an answer (offline, timeout).
 */
export function requestErrorMessage(status: number | null): { en: string; bn: string } {
  if (status === 429) {
    return {
      en: "Too many saves in a short time. Wait a minute, then try again.",
      bn: "অল্প সময়ে অনেকবার সেভ হয়েছে। এক মিনিট অপেক্ষা করে আবার চেষ্টা করুন।",
    };
  }
  if (status === 400) {
    return {
      en: "The server did not accept these values. Check each field and try again.",
      bn: "সার্ভার এই মানগুলো নেয়নি। প্রতিটি ঘর দেখে আবার চেষ্টা করুন।",
    };
  }
  if (status === null) {
    return {
      en: "Couldn't reach TakaTalks. Check your connection and try again.",
      bn: "TakaTalks-এ পৌঁছানো যায়নি। ইন্টারনেট সংযোগ দেখে আবার চেষ্টা করুন।",
    };
  }
  return {
    en: "Something went wrong on our side. Your change was not saved. Try again in a few minutes.",
    bn: "আমাদের দিকে সমস্যা হয়েছে, পরিবর্তনটি সেভ হয়নি। কয়েক মিনিট পরে আবার চেষ্টা করুন।",
  };
}
