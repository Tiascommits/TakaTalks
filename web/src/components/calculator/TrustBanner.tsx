export function TrustBanner() {
  return (
    <div className="max-w-[1160px] mx-auto mt-4 px-5">
      <div className="flex items-center gap-2 bg-[#EFF6F1] border border-green text-green-deep text-sm font-semibold px-4 py-3 mb-3">
        <span className="w-2 h-2 rounded-full bg-green shrink-0" />
        <span>
          এই হিসাব তোমার device-এ হয়, কোথাও পাঠানো হয় না। No signup, no account, kono data
          server-e jay na।
        </span>
      </div>
      <div className="bg-[#FBEFEF] border border-red text-red text-xs px-4 py-2.5">
        Ei ta ekটা estimate tool, official filing na। Rules budget e change hoy, tai kichu cap
        simplified. Actual return filing er jonno <strong>etaxnbr.gov.bd</strong> use koro ba tax
        practitioner dekhao।
      </div>
    </div>
  );
}
