import {
  BROILER_STD_DATA,
  getBroilerBenchmark,
  getLayerBenchmark,
  LAYER_STD_DATA,
} from '../data/nrcBenchmarks';
import {
  BirdType,
  BroilerBreed,
  CalculatedProductCost,
  FarmVisitRecord,
  LayerBreed,
  OfficerProfile,
  PoultryBreed,
  ProductItem,
  SeasonType,
  SelectedProductPlan,
} from '../types/poultry';

export interface BodyWeightAnalysis {
  birdType: BirdType;
  breed?: PoultryBreed;
  ageValue: number;
  phaseLabel: string;
  targetBW: number;
  observedBW: number;
  fcrEstimate: number;
  waterMlPerBird: number;
  targetEggPct: number;
  weightDeltaGrams: number;
  weightDeficitGrams: number;
  achievementPct: number;
  isOptimalOrAbove: boolean; // >= 98%
  catchupFeedGramsPerBird: number;
  flockExtraFeedKg: number;
}

export function analyzeBodyWeight(
  birdType: BirdType,
  ageValue: number,
  observedBW: number,
  flockSize: number,
  breed?: PoultryBreed
): BodyWeightAnalysis {
  let targetBW = 200;
  let fcrEstimate = 0.94;
  let waterMlPerBird = 75;
  let targetEggPct = 0;
  let phaseLabel = 'Starter Phase';

  if (birdType === BirdType.Broiler) {
    const safeDay = Math.min(56, Math.max(1, Math.round(ageValue)));
    const bench = getBroilerBenchmark(safeDay, (breed as BroilerBreed) || 'Cobb 500');
    targetBW = bench.bw;
    fcrEstimate = bench.fcr;
    waterMlPerBird = bench.waterMlPerBird;
    phaseLabel = bench.phaseLabel;
  } else {
    const safeWeek = Math.min(72, Math.max(1, Math.round(ageValue)));
    const bench = getLayerBenchmark(safeWeek, (breed as LayerBreed) || 'BV 300');
    targetBW = bench.bw;
    fcrEstimate = safeWeek <= 6 ? 1.85 : safeWeek <= 18 ? 2.6 : 2.1;
    waterMlPerBird = bench.waterMlPerBird;
    targetEggPct = bench.targetEggPct;
    phaseLabel = bench.phaseLabel;
  }

  const safeFlock = Math.max(1, flockSize);
  const safeObserved = Math.max(0, observedBW);
  const weightDeltaGrams = safeObserved - targetBW;
  const weightDeficitGrams = Math.max(0, targetBW - safeObserved);
  const achievementPct = targetBW > 0 ? (safeObserved / targetBW) * 100 : 100;
  const isOptimalOrAbove = achievementPct >= 98;

  const catchupFeedGramsPerBird = weightDeficitGrams * fcrEstimate;
  const flockExtraFeedKg = (catchupFeedGramsPerBird * safeFlock) / 1000;

  return {
    birdType,
    breed,
    ageValue,
    phaseLabel,
    targetBW,
    observedBW: safeObserved,
    fcrEstimate,
    waterMlPerBird,
    targetEggPct,
    weightDeltaGrams,
    weightDeficitGrams,
    achievementPct,
    isOptimalOrAbove,
    catchupFeedGramsPerBird,
    flockExtraFeedKg,
  };
}

export function calculateProductDosageAndCost(
  product: ProductItem,
  plan: SelectedProductPlan,
  flockSize: number,
  waterMlPerBird: number
): CalculatedProductCost {
  const safeFlock = Math.max(1, flockSize);
  const sku =
    product.skus.find((s) => s.code === plan.selectedSkuCode) ||
    product.skus[0] || {
      code: 'DEFAULT',
      packName: 'Standard Pack',
      packSizeValue: 1,
      packUnit: 'L',
      baseUnits: 1000,
      ptr: 500,
      mrp: 650,
    };

  const doseRate =
    plan.customDose !== undefined && plan.customDose > 0 ? plan.customDose : product.standardDose;
  const days = Math.max(1, plan.days);

  let dailyQuantity = 0;
  if (product.dosageBasis === 'per_100_birds') {
    dailyQuantity = (safeFlock / 100) * doseRate;
  } else if (product.dosageBasis === 'per_1000_birds') {
    dailyQuantity = (safeFlock / 1000) * doseRate;
  } else if (product.dosageBasis === 'per_liter_water') {
    const totalDailyWaterLiters = (safeFlock * waterMlPerBird) / 1000;
    dailyQuantity = totalDailyWaterLiters * doseRate;
  } else if (product.dosageBasis === 'per_ton_feed') {
    const dailyFeedKg = (safeFlock * (waterMlPerBird / 2.2)) / 1000;
    const dailyFeedTons = dailyFeedKg / 1000;
    dailyQuantity = dailyFeedTons * doseRate;
  } else if (product.dosageBasis === 'per_kg_bw') {
    // approx 1.5kg average BW
    const totalFlockWeightKg = safeFlock * 1.5;
    dailyQuantity = totalFlockWeightKg * doseRate;
  } else {
    dailyQuantity = (safeFlock / 100) * doseRate;
  }

  const totalQuantity = dailyQuantity * days;
  const packsNeeded = totalQuantity / (sku.baseUnits || 1000);
  const packsRounded = Math.max(1, Math.ceil(packsNeeded - 0.0001));

  const exactUsedCostMrp = packsNeeded * sku.mrp;
  const exactUsedCostPtr = packsNeeded * sku.ptr;
  const commercialPackCostMrp = packsRounded * sku.mrp;
  const commercialPackCostPtr = packsRounded * sku.ptr;

  const costPerBirdExactMrp = exactUsedCostMrp / safeFlock;
  const costPerBirdExactPtr = exactUsedCostPtr / safeFlock;
  const costPerBirdCommercialMrp = commercialPackCostMrp / safeFlock;
  const costPerBirdCommercialPtr = commercialPackCostPtr / safeFlock;
  const costPerBirdPerDay = costPerBirdExactMrp / days;

  return {
    product,
    sku,
    doseRate,
    days,
    dailyQuantity,
    totalQuantity,
    packsNeeded,
    packsRounded,
    exactUsedCostMrp,
    exactUsedCostPtr,
    commercialPackCostMrp,
    commercialPackCostPtr,
    costPerBirdExactMrp,
    costPerBirdExactPtr,
    costPerBirdCommercialMrp,
    costPerBirdCommercialPtr,
    costPerBirdPerDay,
  };
}

export function formatQuantity(val: number, unit: 'ml' | 'gm'): string {
  if (val >= 1000) {
    const converted = val / 1000;
    const bigUnit = unit === 'ml' ? 'L' : 'kg';
    return `${converted.toFixed(2)} ${bigUnit}`;
  }
  return `${val.toFixed(1)} ${unit}`;
}

export function getCurrentSeason(): SeasonType {
  const month = new Date().getMonth() + 1; // 1-12
  if (month >= 3 && month <= 6) return 'Summer / Heat Stress';
  if (month >= 7 && month <= 9) return 'Monsoon / Wet Litter';
  if (month >= 11 || month <= 2) return 'Winter / Cold Ammonia';
  return 'Seasonal Transition';
}

export function buildFollowUpMailtoLink(visit: FarmVisitRecord, profile: OfficerProfile): string {
  const toEmail = profile.officerEmail || visit.officerEmail || 'sales.officer@example.com';
  const ccParam = visit.farmerEmail ? `&cc=${encodeURIComponent(visit.farmerEmail)}` : '';
  const visitDateFormatted = new Date(visit.recordedAt).toLocaleString('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
  const subject = `[7-Day Farm Call Follow-Up] ${visit.farmName} (${visit.farmerName}) — ${visit.breed || visit.birdType} Flock`;

  const productLines =
    visit.selectedProducts.length > 0
      ? visit.selectedProducts
          .map(
            (p, idx) =>
              `${idx + 1}. ${p.productName} [${p.packName}]: ${formatQuantity(p.totalQuantity, p.doseUnit)} for ${p.days}d | Cost: ${profile.currencySymbol}${p.costPerBird.toFixed(2)}/bird`
          )
          .join('\n')
      : 'Advisory consultation only.';

  const body = [
    `Hello ${profile.officerName || visit.officerName},`,
    ``,
    `This is your scheduled 7-Day Call Follow-Up reminder for your farm consultation recorded on ${visitDateFormatted}.`,
    `Business Officer: ${profile.officerName} (ID: ${profile.officerId || 'BO-1042'}) | BU: ${profile.buUnit || 'Poultry BU'} | Region: ${profile.region || 'Region'} | HQ: ${profile.hq || 'HQ'}`,
    ``,
    `--- CUSTOMER & FLOCK DETAILS ---`,
    `Farmer Name: ${visit.farmerName}`,
    `Farm Name: ${visit.farmName}`,
    `Phone (Call Now): ${visit.farmerPhone}`,
    `Location: ${visit.villageLocation || 'N/A'}`,
    `Flock: ${visit.flockSize.toLocaleString()} ${visit.birdType} · Breed: ${visit.breed || 'Standard'} (${
      visit.birdType === BirdType.Broiler ? `Day ${visit.ageValue} at visit -> Day ${visit.ageValue + 7} today` : `Week ${visit.ageValue} at visit -> Week ${visit.ageValue + 1} today`
    })`,
    `Recorded Weight vs Standard: ${visit.observedBW} g vs ${visit.targetBW} g (${
      visit.weightStatus === 'optimal' ? 'Appreciated - Standard Met' : `Deficit: ${visit.weightDeficitGrams} g/bird in ${visit.seasonObserved}`
    })`,
    ``,
    `--- VIRBAC PRODUCTS DISCUSSED & DOSAGE ---`,
    productLines,
    `Total Commercial Value: ${profile.currencySymbol}${visit.totalPrescriptionCost.toFixed(0)} (${profile.currencySymbol}${visit.totalCostPerBird.toFixed(2)} / bird)`,
    ``,
    `--- 7-DAY CALL FOLLOW-UP CHECKLIST ---`,
    `1. Call ${visit.farmerName} at ${visit.farmerPhone} to check flock health and appetite.`,
    `2. Inquire about body weight gain and FCR response over the past 7 days.`,
    `3. Verify compliance with Virbac administration schedule and check if repeat pack order is needed.`,
    visit.fieldNotes ? `\nPrevious Visit Observations: ${visit.fieldNotes}` : '',
  ]
    .filter(Boolean)
    .join('\n');

  return `mailto:${encodeURIComponent(toEmail)}?subject=${encodeURIComponent(subject)}${ccParam}&body=${encodeURIComponent(body)}`;
}

export async function dispatchStaticAutoFollowUpEmail(
  visit: FarmVisitRecord,
  profile: OfficerProfile
): Promise<boolean> {
  if (!profile.web3FormsKey.trim()) return false;
  try {
    const res = await fetch('https://api.web3forms.com/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        access_key: profile.web3FormsKey.trim(),
        subject: `[7-Day Farm Call Follow-Up] ${visit.farmName} (${visit.farmerName})`,
        from_name: 'Poultry Connect Field Suite',
        email: profile.officerEmail,
        farmer_name: visit.farmerName,
        farm_name: visit.farmName,
        farmer_phone: visit.farmerPhone,
        visit_recorded_at: visit.recordedAt,
        flock: `${visit.flockSize} ${visit.birdType} (${visit.breed || 'Standard'})`,
        season: visit.seasonObserved,
        products_discussed: visit.selectedProducts.map((p) => `${p.productName} (${p.packName})`).join(', '),
        cost_per_bird: `${profile.currencySymbol}${visit.totalCostPerBird.toFixed(2)}`,
      }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export function downloadFollowUpCalendarICS(visit: FarmVisitRecord, profile: OfficerProfile) {
  const due = new Date(visit.followUpDueAt);
  const end = new Date(due.getTime() + 30 * 60 * 1000);
  const toICSDate = (d: Date) => d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

  const summary = `Call Follow-Up: ${visit.farmerName} (${visit.farmName})`;
  const description = `7-Day Follow-Up Call. Phone: ${visit.farmerPhone}. Flock: ${visit.flockSize} ${visit.birdType} (${visit.breed || 'Standard'}). Season: ${visit.seasonObserved}. Products: ${visit.selectedProducts.map((p) => p.productName).join(', ')}.`;

  const ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Virbac Poultry Connect//Field CRM//EN',
    'BEGIN:VEVENT',
    `UID:followup-${visit.id}@poultryconnect.local`,
    `DTSTAMP:${toICSDate(new Date())}`,
    `DTSTART:${toICSDate(due)}`,
    `DTEND:${toICSDate(end)}`,
    `SUMMARY:${summary}`,
    `DESCRIPTION:${description.replace(/\n/g, '\\n')}`,
    `LOCATION:${visit.villageLocation || visit.farmName}`,
    'BEGIN:VALARM',
    'TRIGGER:-PT15M',
    'ACTION:DISPLAY',
    `DESCRIPTION:${summary}`,
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');

  const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `FollowUp_${visit.farmName.replace(/\s+/g, '_')}.ics`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function exportVisitsToCSV(visits: FarmVisitRecord[]) {
  const headers = [
    'Visit ID',
    'Visit Date & Time',
    '7-Day Follow-Up Due',
    'Follow-Up Status',
    'Farmer Name',
    'Farm Name',
    'Phone',
    'Village/Location',
    'Season Observed',
    'Bird Type',
    'Breed',
    'Flock Size',
    'Age (Day/Week)',
    'Target BW (g)',
    'Observed BW (g)',
    'Weight Status',
    'Deficit (g/bird)',
    'Products Selected',
    'Total Cost (MRP)',
    'Cost Per Bird',
    'Field Notes',
  ];

  const escapeCsv = (val: string | number | boolean) => `"${String(val ?? '').replace(/"/g, '""')}"`;

  const rows = visits.map((v) => [
    v.id,
    new Date(v.recordedAt).toLocaleString(),
    new Date(v.followUpDueAt).toLocaleString(),
    v.followUpStatus,
    v.farmerName,
    v.farmName,
    v.farmerPhone,
    v.villageLocation,
    v.seasonObserved,
    v.birdType,
    v.breed || 'Standard',
    v.flockSize,
    v.ageValue,
    v.targetBW,
    v.observedBW,
    v.weightStatus,
    v.weightDeficitGrams,
    v.selectedProducts.map((p) => `${p.productName} [${p.packName}]`).join('; '),
    v.totalPrescriptionCost.toFixed(2),
    v.totalCostPerBird.toFixed(2),
    v.fieldNotes,
  ]);

  const csvContent = [headers.map(escapeCsv).join(','), ...rows.map((r) => r.map(escapeCsv).join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Virbac_Poultry_Field_Visits_${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function triggerFollowUpEmail(visit: FarmVisitRecord, profile: OfficerProfile) {
  const mailtoUrl = buildFollowUpMailtoLink(visit, profile);
  window.location.href = mailtoUrl;
}

export function exportVisitsAsJSON(visits: FarmVisitRecord[]) {
  const dataStr = JSON.stringify(visits, null, 2);
  const blob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `PoultryConnect_Visits_Backup_${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function importVisitsFromJSON(jsonString: string): FarmVisitRecord[] | null {
  try {
    const parsed = JSON.parse(jsonString);
    if (Array.isArray(parsed)) {
      return parsed as FarmVisitRecord[];
    }
    return null;
  } catch {
    return null;
  }
}

export function getInitialSampleVisits(officerEmail: string): FarmVisitRecord[] {
  return createInitialSampleVisits(new Date().toISOString(), officerEmail);
}

export function createInitialSampleVisits(nowIso: string, officerEmail: string): FarmVisitRecord[] {
  const now = new Date(nowIso);
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000 - 2 * 60 * 60 * 1000);
  const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);

  return [
    {
      id: 'vis-sample-due',
      recordedAt: sevenDaysAgo.toISOString(),
      followUpDueAt: new Date(sevenDaysAgo.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      followUpStatus: 'pending',
      officerId: 'BO-1042',
      officerName: 'Preetam Sangam',
      officerEmail,
      farmerName: 'Maheshwar Reddy',
      farmName: 'Kaveri Agro Broiler Farms',
      farmerPhone: '+91 98492 63105',
      farmerEmail: 'kaveripoultry@example.com',
      villageLocation: 'Siddipet Cluster, Shed 2',
      seasonObserved: 'Summer / Heat Stress',
      birdType: BirdType.Broiler,
      breed: 'Cobb 500',
      flockSize: 10000,
      ageValue: 21,
      targetBW: 910,
      observedBW: 815,
      weightStatus: 'underweight',
      weightDeficitGrams: 95,
      extraFeedFlockKg: 1235,
      selectedReasonIds: ['rsn-summer-panting', 'rsn-summer-mineral-loss'],
      diagnosedDiseaseIds: ['dis-heat-stress'],
      selectedProducts: [
        {
          productId: 'prd-calgophos',
          productName: 'Calgophos',
          skuCode: 'AE94489',
          packName: '5 Litre',
          doseRate: 25,
          doseUnit: 'ml',
          dosageBasis: 'per_100_birds',
          days: 3,
          totalQuantity: 7500,
          packsRounded: 2,
          mrpPerPack: 3250,
          ptrPerPack: 2600,
          totalPackCostMrp: 6500,
          costPerBird: 0.4875,
        },
        {
          productId: 'prd-vimeral',
          productName: 'Vimeral Forte',
          skuCode: 'AE93889',
          packName: '5 Litre',
          doseRate: 15,
          doseUnit: 'ml',
          dosageBasis: 'per_100_birds',
          days: 5,
          totalQuantity: 7500,
          packsRounded: 2,
          mrpPerPack: 7885,
          ptrPerPack: 6308,
          totalPackCostMrp: 15770,
          costPerBird: 1.182,
        },
        {
          productId: 'prd-brotone',
          productName: 'Brotone',
          skuCode: 'AE96299',
          packName: 'Brotone 5 Litre',
          doseRate: 20,
          doseUnit: 'ml',
          dosageBasis: 'per_100_birds',
          days: 5,
          totalQuantity: 10000,
          packsRounded: 2,
          mrpPerPack: 2400,
          ptrPerPack: 1828.57,
          totalPackCostMrp: 4800,
          costPerBird: 0.48,
        },
      ],
      totalPrescriptionCost: 27070,
      totalCostPerBird: 2.1495,
      fieldNotes: 'Day 21 Cobb 500 flock 95g underweight due to severe summer heat stress and thermal alkalosis. Advised 3-day Calgophos (acidic minerals) + 5-day Vimeral Forte & Brotone. Scheduled 7-day follow-up call for Day 28 body weight check.',
    },
    {
      id: 'vis-sample-recent',
      recordedAt: twoDaysAgo.toISOString(),
      followUpDueAt: new Date(twoDaysAgo.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      followUpStatus: 'pending',
      officerId: 'BO-1042',
      officerName: 'Preetam Sangam',
      officerEmail,
      farmerName: 'Venkatesh Goud',
      farmName: 'Swarna Layer Breeders',
      farmerPhone: '+91 99123 84510',
      farmerEmail: '',
      villageLocation: 'Namakkal / Karimnagar Highway',
      seasonObserved: 'Summer / Heat Stress',
      birdType: BirdType.Layer,
      breed: 'BV 300',
      flockSize: 18000,
      ageValue: 30,
      targetBW: 1595,
      observedBW: 1610,
      observedEggPct: 95,
      targetEggPct: 95,
      weightStatus: 'optimal',
      weightDeficitGrams: 0,
      extraFeedFlockKg: 0,
      selectedReasonIds: [],
      diagnosedDiseaseIds: [],
      selectedProducts: [
        {
          productId: 'prd-kalzol',
          productName: 'Kalzol Forte',
          skuCode: 'AF94529',
          packName: 'Kalzol Forte 10 kg',
          doseRate: 1000,
          doseUnit: 'gm',
          dosageBasis: 'per_ton_feed',
          days: 14,
          totalQuantity: 10000,
          packsRounded: 1,
          mrpPerPack: 3000,
          ptrPerPack: 2400,
          totalPackCostMrp: 3000,
          costPerBird: 0.1667,
        },
      ],
      totalPrescriptionCost: 3000,
      totalCostPerBird: 0.1667,
      fieldNotes: 'BV 300 layer flock achieving 95% HD lay and 1610g body weight! Appreciated farm supervisor and positioned Kalzol Forte for shell thickness maintenance.',
    },
  ];
}
