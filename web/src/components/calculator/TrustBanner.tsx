"use client";

import { useLanguage } from "@/lib/i18n";

export function TrustBanner() {
  const { t } = useLanguage();

  return (
    <div className="max-w-[1160px] mx-auto mt-4 px-5">
      <div className="flex items-center gap-2 bg-[#EFF6F1] border border-green text-green-deep text-sm font-semibold px-4 py-3 mb-3">
        <span className="w-2 h-2 rounded-full bg-green shrink-0" />
        <span>
          {t(
            "This calculation happens on your device — nothing is sent anywhere. No signup, no account, no data goes to a server.",
            "এই হিসাব তোমার device-এ হয়, কোথাও পাঠানো হয় না। No signup, no account, kono data server-e jay na।"
          )}
        </span>
      </div>
      <div className="bg-[#FBEFEF] border border-red text-red text-xs px-4 py-2.5">
        {t(
          "This is an estimate tool, not an official filing. Rules change every budget, so some caps are simplified. For an actual return filing, use ",
          "Ei ta ekটা estimate tool, official filing na। Rules budget e change hoy, tai kichu cap simplified. Actual return filing er jonno "
        )}
        <strong>etaxnbr.gov.bd</strong>
        {t(" or consult a tax practitioner.", " use koro ba tax practitioner dekhao।")}
      </div>
    </div>
  );
}
