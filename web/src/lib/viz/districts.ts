/** Bangladesh's 64 districts grouped by division, in the order the challenge unlocks them. */

export type Division =
  | "dhaka"
  | "chattogram"
  | "rajshahi"
  | "khulna"
  | "barishal"
  | "sylhet"
  | "rangpur"
  | "mymensingh";

export const DIVISION_COLORS: Record<Division, string> = {
  dhaka: "#0b6e4f",
  chattogram: "#1d63a8",
  rajshahi: "#b83b3b",
  khulna: "#6b4fa0",
  barishal: "#0f8a8a",
  sylhet: "#4a8a2a",
  rangpur: "#c4722a",
  mymensingh: "#a33a77",
};

const RAW: [Division, string, string][] = [
  ["dhaka", "Dhaka", "ঢাকা"],
  ["dhaka", "Gazipur", "গাজীপুর"],
  ["dhaka", "Narayanganj", "নারায়ণগঞ্জ"],
  ["dhaka", "Narsingdi", "নরসিংদী"],
  ["dhaka", "Munshiganj", "মুন্সীগঞ্জ"],
  ["dhaka", "Manikganj", "মানিকগঞ্জ"],
  ["dhaka", "Tangail", "টাঙ্গাইল"],
  ["dhaka", "Kishoreganj", "কিশোরগঞ্জ"],
  ["dhaka", "Faridpur", "ফরিদপুর"],
  ["dhaka", "Madaripur", "মাদারীপুর"],
  ["dhaka", "Shariatpur", "শরীয়তপুর"],
  ["dhaka", "Rajbari", "রাজবাড়ী"],
  ["dhaka", "Gopalganj", "গোপালগঞ্জ"],
  ["chattogram", "Chattogram", "চট্টগ্রাম"],
  ["chattogram", "Cox's Bazar", "কক্সবাজার"],
  ["chattogram", "Bandarban", "বান্দরবান"],
  ["chattogram", "Rangamati", "রাঙ্গামাটি"],
  ["chattogram", "Khagrachhari", "খাগড়াছড়ি"],
  ["chattogram", "Feni", "ফেনী"],
  ["chattogram", "Noakhali", "নোয়াখালী"],
  ["chattogram", "Lakshmipur", "লক্ষ্মীপুর"],
  ["chattogram", "Cumilla", "কুমিল্লা"],
  ["chattogram", "Chandpur", "চাঁদপুর"],
  ["chattogram", "Brahmanbaria", "ব্রাহ্মণবাড়িয়া"],
  ["sylhet", "Sylhet", "সিলেট"],
  ["sylhet", "Moulvibazar", "মৌলভীবাজার"],
  ["sylhet", "Habiganj", "হবিগঞ্জ"],
  ["sylhet", "Sunamganj", "সুনামগঞ্জ"],
  ["mymensingh", "Mymensingh", "ময়মনসিংহ"],
  ["mymensingh", "Jamalpur", "জামালপুর"],
  ["mymensingh", "Sherpur", "শেরপুর"],
  ["mymensingh", "Netrokona", "নেত্রকোনা"],
  ["rajshahi", "Rajshahi", "রাজশাহী"],
  ["rajshahi", "Natore", "নাটোর"],
  ["rajshahi", "Naogaon", "নওগাঁ"],
  ["rajshahi", "Chapainawabganj", "চাঁপাইনবাবগঞ্জ"],
  ["rajshahi", "Pabna", "পাবনা"],
  ["rajshahi", "Sirajganj", "সিরাজগঞ্জ"],
  ["rajshahi", "Bogura", "বগুড়া"],
  ["rajshahi", "Joypurhat", "জয়পুরহাট"],
  ["rangpur", "Rangpur", "রংপুর"],
  ["rangpur", "Dinajpur", "দিনাজপুর"],
  ["rangpur", "Thakurgaon", "ঠাকুরগাঁও"],
  ["rangpur", "Panchagarh", "পঞ্চগড়"],
  ["rangpur", "Nilphamari", "নীলফামারী"],
  ["rangpur", "Lalmonirhat", "লালমনিরহাট"],
  ["rangpur", "Kurigram", "কুড়িগ্রাম"],
  ["rangpur", "Gaibandha", "গাইবান্ধা"],
  ["khulna", "Khulna", "খুলনা"],
  ["khulna", "Bagerhat", "বাগেরহাট"],
  ["khulna", "Satkhira", "সাতক্ষীরা"],
  ["khulna", "Jashore", "যশোর"],
  ["khulna", "Jhenaidah", "ঝিনাইদহ"],
  ["khulna", "Magura", "মাগুরা"],
  ["khulna", "Narail", "নড়াইল"],
  ["khulna", "Kushtia", "কুষ্টিয়া"],
  ["khulna", "Chuadanga", "চুয়াডাঙ্গা"],
  ["khulna", "Meherpur", "মেহেরপুর"],
  ["barishal", "Barishal", "বরিশাল"],
  ["barishal", "Bhola", "ভোলা"],
  ["barishal", "Patuakhali", "পটুয়াখালী"],
  ["barishal", "Barguna", "বরগুনা"],
  ["barishal", "Pirojpur", "পিরোজপুর"],
  ["barishal", "Jhalokathi", "ঝালকাঠি"],
];

export const DISTRICTS = RAW.map(([division, en, bn]) => ({ division, en, bn }));
