import { BasicTaxHeader } from "@/components/basic-tax/BasicTaxHeader";
import { BasicTaxCalculator } from "@/components/basic-tax/BasicTaxCalculator";

export const metadata = {
  title: "বেসিক ইনকাম ট্যাক্স হিসাব — TakaTalks",
  description: "আপনার বছরের মোট ইনকাম দিয়ে basic slab tax হিসাব করুন এক মিনিটে — কোনো সাইনআপ ছাড়া।",
};

export default function TaxBasicCalculationPage() {
  return (
    <>
      <BasicTaxHeader />
      <BasicTaxCalculator />
    </>
  );
}
