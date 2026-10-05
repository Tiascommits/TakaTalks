import type { VizDef } from "../engine";
import { loadingCar } from "./loadingCar";
import { financialFreedom } from "./financialFreedom";
import { dreamHouse } from "./dreamHouse";
import { districtChallenge } from "./districtChallenge";
import { matirBank } from "./matirBank";
import { salaryInKacchi } from "./salaryInKacchi";
import { hundredBox } from "./hundredBox";
import { debtFree } from "./debtFree";
import { takaShrink } from "./takaShrink";

/** Drawing code for every slug in src/lib/viz/registry.ts. */
export const VIZ_DEFS: Record<string, VizDef> = Object.fromEntries(
  [loadingCar, financialFreedom, dreamHouse, districtChallenge, matirBank, salaryInKacchi, hundredBox, debtFree, takaShrink].map(
    (d) => [d.slug, d]
  )
);
