# Content calendar, return season 2026-27 (10 Nov 2026 - 15 Jan 2027)

8 weeks, 3 drafts each: a 45-60 second video script, a Facebook post, a 5-slide carousel. 24 drafts. Tia or the owner records and posts; nothing here has been posted. No posts 3-9 Nov (owner away).

Every link points to `https://www.takatalks.com/calculator` with `?src=fb` (Facebook), `?src=yt` (YouTube) or `?src=tt` (TikTok), so the channel shows up in GoatCounter (unverified: that GoatCounter reads `src` as the referrer was not confirmed today; if it does not, the query string still appears in the path list).

## Sources (every number below carries one of these tags)

- **[R:field]**: `TAX_RULES.field` or `TAXPAYER_CATEGORIES` in `web/src/config/tax-rules-2025-26.ts` (the calculator's own rules, on `experimental`).
- **[FAQ]**: NBR, "FAQ- e-Return 2026", Q46, https://nbr.gov.bd/uploads/news-scroller/FAQ_e-Return_-_2026.pdf, fetched 2026-11-01. Q46(3) ka-gha: 1 Jul-30 Sep 5% credit (max ৳25,000); 1 Oct-31 Dec no credit, no additional tax; 1 Jan-31 Mar additional tax 2% of net payable tax (min ৳3,000); 1 Apr-30 Jun 5% (min ৳5,000); self-assessed returns until 30 Jun 2027. Q46(1): Sanchayapatra income imports with "Import From NSD". Q46(2): tax deducted at source under s.120 is added with "Claim".
- **[KPMG pN]**: KPMG Bangladesh, "Bangladesh Tax 2026" (15 Jul 2026), page N, https://assets.kpmg.com/content/dam/kpmg/bd/pdf/Tax/Bangladesh_Tax_2026.pdf, fetched 2026-11-01.
- **[Act]**: Income Tax Act 2023, Sixth Schedule, Part I, para 21 (as cited in `tax-rules-2025-26.ts`, NBR's English text, https://nbr.gov.bd/uploads/acts/Income_tax_act_2023.pdf).

Before posting, check that `TAX_RULES` has not changed since this file (`git log -1 web/src/config/tax-rules-2025-26.ts`). The worked examples are plain arithmetic on the cited rule; run each through the calculator once before recording.

---

## W1, Mon 10 Nov: "৩১ ডিসেম্বর, ৩০ নভেম্বর না"

**Video script (50 s)**
> [Hook, on screen "৩০ নভেম্বর ❌ ৩১ ডিসেম্বর ✅"] এখনো ভাবছেন ৩০ নভেম্বর রিটার্নের শেষ দিন? এ বছর নিয়ম বদলেছে।
> এখন আর একটা "ট্যাক্স ডে" নেই। ১ অক্টোবর থেকে ৩১ ডিসেম্বরের মধ্যে রিটার্ন দিলে কোনো বাড়তি কর নেই [FAQ Q46(3)(kha); R:returnNoExtraTaxBy]।
> ১ জানুয়ারি থেকে দিলে নীট প্রদেয় করের ২% বাড়তি, কমপক্ষে ৩,০০০ টাকা [FAQ Q46(3)(ga)]।
> তাই হাতে প্রায় সাত সপ্তাহ আছে। কত কর আসবে, takatalks.com-এ ২ মিনিটে হিসাব করে নিন। বিজ্ঞাপন নেই, ফ্রি, আপনার সংখ্যা আপনার ফোনেই থাকে।

**Facebook post**
> ৩০ নভেম্বর না, ৩১ ডিসেম্বর।
> ২০২৬-২৭ করবর্ষে রিটার্ন দাখিলের নিয়ম [NBR e-Return FAQ ২০২৬, প্রশ্ন ৪৬(৩)]:
> • ১ অক্টোবর - ৩১ ডিসেম্বর: কোনো বাড়তি কর নেই
> • ১ জানুয়ারি - ৩১ মার্চ: নীট প্রদেয় করের ২%, কমপক্ষে ৳৩,০০০
> • ১ এপ্রিল - ৩০ জুন: ৫%, কমপক্ষে ৳৫,০০০
> নিজের কর কত, এখনই দেখে নিন: https://www.takatalks.com/calculator?src=fb

**Carousel**
1. ৩০ নভেম্বর ❌ ৩১ ডিসেম্বর ✅
2. "ট্যাক্স ডে" আর নেই, এখন সময়ভিত্তিক নিয়ম [FAQ Q46(3)]
3. ১ অক্টোবর - ৩১ ডিসেম্বর: বাড়তি কর ০ [FAQ Q46(3)(kha)]
4. ১ জানুয়ারি থেকে: ২%, কমপক্ষে ৳৩,০০০; ১ এপ্রিল থেকে: ৫%, কমপক্ষে ৳৫,০০০ [FAQ Q46(3)(ga)(gha)]
5. ২ মিনিটে হিসাব: takatalks.com/calculator

## W2, Mon 17 Nov: "৪ লাখ পর্যন্ত করমুক্ত (নারী / ৬৫+ ৪.৫ লাখ)"

**Video script (55 s)**
> [Hook] বছরে ৪ লাখ টাকার কম আয়? তাহলে আপনার আয়কর শূন্য।
> করমুক্ত সীমা [R:TAXPAYER_CATEGORIES; KPMG p46]: সাধারণ ৪ লাখ, নারী ও ৬৫ বছরের বেশি বয়সী ৪.৫ লাখ, তৃতীয় লিঙ্গ ও প্রতিবন্ধী ৫.২৫ লাখ, গেজেটভুক্ত যুদ্ধাহত মুক্তিযোদ্ধা ও জুলাই যোদ্ধা ৫.৫ লাখ।
> প্রতিবন্ধী সন্তানের বাবা বা মা (একজন) আরও ৫০,০০০ টাকা বেশি পান [R:disabledChildTaxFreeAddOn; KPMG p46]।
> চাকরিজীবী হলে বেতনের এক-তৃতীয়াংশ বা ৫ লাখ, যেটা কম, তাও বাদ যায় [R:salaryExemptionFraction, salaryExemptionCap; KPMG p45]।
> নিজের সীমা আর কর দেখুন takatalks.com-এ।

**Facebook post**
> আপনার করমুক্ত আয়ের সীমা কত? [আয়বর্ষ ২০২৫-২৬, KPMG Bangladesh Tax 2026, পৃ. ৪৬]
> • সাধারণ: ৳৪,০০,০০০
> • নারী / ৬৫+: ৳৪,৫০,০০০
> • তৃতীয় লিঙ্গ / প্রতিবন্ধী: ৳৫,২৫,০০০
> • গেজেটভুক্ত যুদ্ধাহত মুক্তিযোদ্ধা / জুলাই যোদ্ধা: ৳৫,৫০,০০০
> • প্রতিবন্ধী সন্তানের বাবা বা মা (একজন): +৳৫০,০০০
> সীমার নিচে থাকলেও রিটার্ন লাগতে পারে। হিসাব: https://www.takatalks.com/calculator?src=fb

**Carousel**
1. ৪ লাখের কম আয়? কর ০
2. সাধারণ ৪ লাখ · নারী/৬৫+ ৪.৫ লাখ [R:TAXPAYER_CATEGORIES]
3. তৃতীয় লিঙ্গ/প্রতিবন্ধী ৫.২৫ লাখ · যুদ্ধাহত মুক্তিযোদ্ধা/জুলাই যোদ্ধা ৫.৫ লাখ [KPMG p46]
4. প্রতিবন্ধী সন্তানের বাবা/মা: +৫০,০০০ [KPMG p46]
5. বাকিটা ১০% থেকে শুরু [R:slabs] → takatalks.com/calculator

## W3, Mon 24 Nov: rebate "৩% / ১০% / ৭.৫ লাখ"

**Video script (60 s)**
> [Hook] সঞ্চয়পত্র বা DPS করেন? তাহলে কর কমানোর সুযোগ আছে।
> রিবেট হলো তিনটার মধ্যে যেটা সবচেয়ে কম [R:rebateRateOfIncome, rebateRateOfInvestment, rebateCap; KPMG p47]: করযোগ্য আয়ের ৩%, যোগ্য বিনিয়োগের ১০%, অথবা ৭.৫ লাখ টাকা।
> উদাহরণ: করযোগ্য আয় ১০ লাখ, বিনিয়োগ ১ লাখ। আয়ের ৩% = ৩০,০০০; বিনিয়োগের ১০% = ১০,০০০। রিবেট ১০,০০০।
> DPS-এ বছরে ১,২০,০০০ পর্যন্ত, সঞ্চয়পত্র আর সরকারি বন্ড মিলিয়ে ৫ লাখ পর্যন্ত ধরা হয় [R:dpsCap, sharedGroupCap; KPMG p47]।
> নিজের রিবেট দেখুন takatalks.com-এ।

**Facebook post**
> বিনিয়োগ করলে কর কমে। কতটা? তিনটার মধ্যে যেটা কম [KPMG Bangladesh Tax 2026, পৃ. ৪৭]:
> ১) করযোগ্য আয়ের ৩%
> ২) যোগ্য বিনিয়োগের ১০%
> ৩) ৳৭,৫০,০০০
> সীমা: DPS বছরে ৳১,২০,০০০; সঞ্চয়পত্র + সরকারি বন্ড মিলিয়ে ৳৫,০০,০০০।
> উদাহরণ: আয় ১০ লাখ, বিনিয়োগ ১ লাখ → রিবেট ১০,০০০।
> নিজের হিসাব: https://www.takatalks.com/calculator?src=fb

**Carousel**
1. বিনিয়োগ = কম কর
2. রিবেট = সবচেয়ে কমটা: আয়ের ৩% · বিনিয়োগের ১০% · ৭.৫ লাখ [R:rebate*]
3. উদাহরণ: আয় ১০ লাখ, বিনিয়োগ ১ লাখ → ১০,০০০
4. DPS ১.২ লাখ/বছর · সঞ্চয়পত্র + বন্ড ৫ লাখ [R:dpsCap, sharedGroupCap]
5. takatalks.com/calculator, ঘর ৫ "বিনিয়োগ"

## W4, Mon 1 Dec: প্রথম রিটার্ন, ন্যূনতম কর ৳১,০০০

**Video script (50 s)**
> [Hook] এ বছর প্রথম রিটার্ন দিচ্ছেন? সুখবর আছে।
> করযোগ্য আয় থাকলে সাধারণত ন্যূনতম কর ৫,০০০ টাকা। কিন্তু নতুন করদাতার জন্য ন্যূনতম কর ১,০০০ টাকা [R:minTax, minTaxNewTaxpayer; KPMG p47]।
> আর প্রথমবার রিটার্ন দিলে সময় আয়বর্ষ শেষ হওয়ার পরের ৩০ জুন পর্যন্ত, মানে ৩০ জুন ২০২৭ [KPMG p45]।
> তবু ডিসেম্বরেই সেরে ফেলুন। ক্যালকুলেটরে "এটা আমার প্রথম রিটার্ন" টিক দিলেই ১,০০০ টাকার নিয়ম ধরা হয়। takatalks.com।

**Facebook post**
> প্রথম রিটার্ন? ন্যূনতম কর ৳১,০০০, ৳৫,০০০ না [KPMG Bangladesh Tax 2026, পৃ. ৪৭]।
> প্রথমবার দাখিলকারীদের সময় আয়বর্ষ শেষের পরের ৩০ জুন পর্যন্ত [একই, পৃ. ৪৫]।
> দরকার: TIN, বেতনের সনদ বা আয়ের হিসাব, ব্যাংক স্টেটমেন্ট।
> হিসাব করুন ("এটা আমার প্রথম রিটার্ন" টিক দিন): https://www.takatalks.com/calculator?src=fb

**Carousel**
1. প্রথম রিটার্ন? পড়ুন
2. ন্যূনতম কর: সাধারণ ৳৫,০০০ · নতুন করদাতা ৳১,০০০ [R:minTax, minTaxNewTaxpayer]
3. প্রথমবার: সময় ৩০ জুন ২০২৭ পর্যন্ত [KPMG p45]
4. লাগবে: TIN, আয়ের কাগজ, ব্যাংক স্টেটমেন্ট
5. "এটা আমার প্রথম রিটার্ন" টিক দিন → takatalks.com/calculator

## W5, Mon 8 Dec: ফ্রিল্যান্সার

**Video script (55 s)**
> [Hook] ফ্রিল্যান্সার? আপনার আয় করমুক্ত হতে পারে, একটা শর্তে।
> আইটি ফ্রিল্যান্সিং আর সফটওয়্যার/আইটিইএস আয় ৩০ জুন ২০২৭ পর্যন্ত পুরোপুরি করমুক্ত [Act; R:freelanceExemptionEnds]।
> শর্ত: ১ জুলাই ২০২৪ থেকে ব্যবসার সব আয়, খরচ আর বিনিয়োগ ব্যাংক ট্রান্সফারে হতে হবে [Act]।
> শর্ত না মানলে এই আয় অন্য আয়ের মতোই করযোগ্য।
> takatalks.com/freelance-এ টিক দিয়ে দুইভাবেই দেখে নিন।

**Facebook post**
> ফ্রিল্যান্সারদের জন্য: আইটি ফ্রিল্যান্সিং ও সফটওয়্যার/আইটিইএস আয় ৩০ জুন ২০২৭ পর্যন্ত করমুক্ত [আয়কর আইন ২০২৩, ষষ্ঠ তফসিল, অংশ ১, অনুচ্ছেদ ২১]।
> শর্ত: ব্যবসার সব আয়, খরচ ও বিনিয়োগ ১ জুলাই ২০২৪ থেকে ব্যাংক ট্রান্সফারে।
> নগদে লেনদেন থাকলে এই সুবিধা নেই।
> হিসাব: https://www.takatalks.com/freelance?src=fb

**Carousel**
1. ফ্রিল্যান্সার? কর ০ হতে পারে
2. আইটি ফ্রিল্যান্সিং + সফটওয়্যার/আইটিইএস: ৩০ জুন ২০২৭ পর্যন্ত করমুক্ত [Act]
3. শর্ত: সব লেনদেন ব্যাংক ট্রান্সফারে, ১ জুলাই ২০২৪ থেকে [Act]
4. শর্ত না মানলে: সাধারণ হারে কর [R:slabs]
5. takatalks.com/freelance

## W6, Mon 21 Dec: শেষ ১০ দিনের চেকলিস্ট

**Video script (50 s)**
> [Hook] ৩১ ডিসেম্বর আর ১০ দিন। চেকলিস্ট মিলিয়ে নিন।
> এক: TIN আর ই-রিটার্নের লগইন। দুই: বেতনের সনদ বা আয়ের হিসাব। তিন: ব্যাংক স্টেটমেন্ট আর FDR-এর সার্টিফিকেট।
> চার: সঞ্চয়পত্র? সার্টিফিকেট লাগবে না, "Import From NSD" বোতামে তথ্য চলে আসে [FAQ Q46(1)]। পাঁচ: উৎসে কাটা কর "Claim" বোতামে যোগ হয় [FAQ Q46(2)]।
> ৩১ ডিসেম্বরের পর ২%, কমপক্ষে ৩,০০০ টাকা বাড়তি [FAQ Q46(3)(ga)]। আগে কর হিসাব করুন takatalks.com-এ, তারপর etaxnbr.gov.bd।

**Facebook post**
> ৩১ ডিসেম্বরের আগে চেকলিস্ট:
> ☐ TIN ও etaxnbr.gov.bd লগইন
> ☐ বেতনের সনদ / আয়ের হিসাব
> ☐ ব্যাংক স্টেটমেন্ট, FDR সার্টিফিকেট
> ☐ সঞ্চয়পত্র: "Import From NSD" [NBR e-Return FAQ ২০২৬, প্রশ্ন ৪৬(১)]
> ☐ উৎসে কাটা কর: "Claim" [প্রশ্ন ৪৬(২)]
> ১ জানুয়ারি থেকে বাড়তি কর: ২%, কমপক্ষে ৳৩,০০০ [প্রশ্ন ৪৬(৩)]।
> আগে হিসাব: https://www.takatalks.com/calculator?src=fb

**Carousel**
1. আর ১০ দিন: চেকলিস্ট
2. TIN · লগইন · বেতনের সনদ · ব্যাংক স্টেটমেন্ট
3. সঞ্চয়পত্র → "Import From NSD" [FAQ Q46(1)]
4. উৎসে কাটা কর → "Claim" [FAQ Q46(2)]
5. ৩১ ডিসেম্বর পর্যন্ত বাড়তি কর ০ [FAQ Q46(3)(kha)] → takatalks.com/calculator

## W7, Fri 1 Jan: "২%, কমপক্ষে ৳৩,০০০"

**Video script (45 s)**
> [Hook] ৩১ ডিসেম্বর মিস করেছেন? এখনো দেরি হয়নি, কিন্তু খরচ বেড়েছে।
> ১ জানুয়ারি থেকে ৩১ মার্চ রিটার্ন দিলে নীট প্রদেয় করের ২% বাড়তি, কমপক্ষে ৩,০০০ টাকা [FAQ Q46(3)(ga); R:lateFilingExtraTax]।
> ১ এপ্রিল থেকে সেটা ৫%, কমপক্ষে ৫,০০০ [FAQ Q46(3)(gha)]। তাই এই সপ্তাহেই দিন।
> কত বাড়তি আসবে, takatalks.com-এ দেখুন।

**Facebook post**
> ৩১ ডিসেম্বর পার হয়ে গেছে। এখন রিটার্ন দিলে নীট প্রদেয় করের ২% বাড়তি, কমপক্ষে ৳৩,০০০ (৩১ মার্চ পর্যন্ত) [NBR e-Return FAQ ২০২৬, প্রশ্ন ৪৬(৩)(গ)]।
> ১ এপ্রিল থেকে ৫%, কমপক্ষে ৳৫,০০০। যত তাড়াতাড়ি, তত কম।
> প্রথমবার দিচ্ছেন? আপনার সময় ৩০ জুন পর্যন্ত [KPMG Bangladesh Tax 2026, পৃ. ৪৫]।
> হিসাব: https://www.takatalks.com/calculator?src=fb

**Carousel**
1. ৩১ ডিসেম্বর মিস?
2. ১ জানু - ৩১ মার্চ: ২%, কমপক্ষে ৳৩,০০০ [FAQ Q46(3)(ga)]
3. ১ এপ্রিল - ৩০ জুন: ৫%, কমপক্ষে ৳৫,০০০ [FAQ Q46(3)(gha)]
4. প্রথমবার? ৩০ জুন পর্যন্ত [KPMG p45]
5. এই সপ্তাহেই → takatalks.com/calculator

## W8, Wed 13 Jan: "৩১ মার্চের পর ৫%"

**Video script (45 s)**
> [Hook] রিটার্ন এখনো বাকি? ৩১ মার্চ মাথায় রাখুন।
> এখন দিলে বাড়তি ২%, কমপক্ষে ৩,০০০ [FAQ Q46(3)(ga)]। ১ এপ্রিল থেকে ৫%, কমপক্ষে ৫,০০০ [FAQ Q46(3)(gha)]।
> স্বনির্ধারণী পদ্ধতিতে রিটার্ন নেওয়া হবে ৩০ জুন ২০২৭ পর্যন্ত [FAQ Q46(3)]।
> মার্চের ভিড়ের আগে, এই মাসেই। takatalks.com।

**Facebook post**
> জানুয়ারিতে দিলে ২% (কমপক্ষে ৳৩,০০০)। এপ্রিলে দিলে ৫% (কমপক্ষে ৳৫,০০০) [NBR e-Return FAQ ২০২৬, প্রশ্ন ৪৬(৩)]।
> শেষ সীমা ৩০ জুন ২০২৭।
> মার্চের ভিড় আর সার্ভারের চাপের আগে এই মাসেই সেরে ফেলুন।
> হিসাব: https://www.takatalks.com/calculator?src=fb

**Carousel**
1. রিটার্ন বাকি? ৩১ মার্চ মনে রাখুন
2. এখন: ২%, কমপক্ষে ৳৩,০০০ [FAQ Q46(3)(ga)]
3. ১ এপ্রিল থেকে: ৫%, কমপক্ষে ৳৫,০০০ [FAQ Q46(3)(gha)]
4. শেষ সীমা ৩০ জুন ২০২৭ [FAQ Q46(3)]
5. takatalks.com/calculator

---

Open points (for the owner):
- "নীট প্রদেয় কর" is NBR's wording; whether it is before or after tax deducted at source is item 1 of `docs/practitioner-sheet-2026-11.md`. The copy quotes NBR and gives no worked late-tax example until that is answered.
- The video "সীমার নিচে থাকলেও রিটার্ন লাগতে পারে" (W2 post) is deliberately vague: who must file regardless of income is not in `TAX_RULES` and was not checked today.
- "মার্চের ভিড় আর সার্ভারের চাপ" (W8) is a general expectation, unverified.
