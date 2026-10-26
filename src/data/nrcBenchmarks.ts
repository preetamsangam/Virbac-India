import { BroilerBenchmark, BroilerBreed, LayerBenchmark, LayerBreed } from '../types/poultry';

// Benchmark curves for standard broiler breeds (Day 1 to 56)
// Cobb 500 (Indian industry standard benchmark)
const COBB_500_DATA: Record<number, BroilerBenchmark> = {
  1: { day: 1, bw: 42, fcr: 0.20, waterMlPerBird: 25, phaseLabel: 'Pre-Starter (Day 1–7)' },
  2: { day: 2, bw: 58, fcr: 0.35, waterMlPerBird: 32, phaseLabel: 'Pre-Starter (Day 1–7)' },
  3: { day: 3, bw: 76, fcr: 0.48, waterMlPerBird: 40, phaseLabel: 'Pre-Starter (Day 1–7)' },
  4: { day: 4, bw: 99, fcr: 0.60, waterMlPerBird: 48, phaseLabel: 'Pre-Starter (Day 1–7)' },
  5: { day: 5, bw: 126, fcr: 0.72, waterMlPerBird: 56, phaseLabel: 'Pre-Starter (Day 1–7)' },
  6: { day: 6, bw: 159, fcr: 0.83, waterMlPerBird: 65, phaseLabel: 'Pre-Starter (Day 1–7)' },
  7: { day: 7, bw: 200, fcr: 0.94, waterMlPerBird: 75, phaseLabel: 'Pre-Starter (Day 1–7)' },
  8: { day: 8, bw: 232, fcr: 0.97, waterMlPerBird: 84, phaseLabel: 'Starter Phase (Day 8–21)' },
  9: { day: 9, bw: 268, fcr: 1.00, waterMlPerBird: 93, phaseLabel: 'Starter Phase (Day 8–21)' },
  10: { day: 10, bw: 307, fcr: 1.03, waterMlPerBird: 103, phaseLabel: 'Starter Phase (Day 8–21)' },
  11: { day: 11, bw: 349, fcr: 1.07, waterMlPerBird: 113, phaseLabel: 'Starter Phase (Day 8–21)' },
  12: { day: 12, bw: 393, fcr: 1.10, waterMlPerBird: 123, phaseLabel: 'Starter Phase (Day 8–21)' },
  13: { day: 13, bw: 439, fcr: 1.14, waterMlPerBird: 134, phaseLabel: 'Starter Phase (Day 8–21)' },
  14: { day: 14, bw: 485, fcr: 1.18, waterMlPerBird: 145, phaseLabel: 'Starter Phase (Day 8–21)' },
  15: { day: 15, bw: 538, fcr: 1.20, waterMlPerBird: 156, phaseLabel: 'Starter Phase (Day 8–21)' },
  16: { day: 16, bw: 593, fcr: 1.22, waterMlPerBird: 168, phaseLabel: 'Starter Phase (Day 8–21)' },
  17: { day: 17, bw: 651, fcr: 1.24, waterMlPerBird: 180, phaseLabel: 'Starter Phase (Day 8–21)' },
  18: { day: 18, bw: 712, fcr: 1.25, waterMlPerBird: 192, phaseLabel: 'Starter Phase (Day 8–21)' },
  19: { day: 19, bw: 775, fcr: 1.27, waterMlPerBird: 204, phaseLabel: 'Starter Phase (Day 8–21)' },
  20: { day: 20, bw: 841, fcr: 1.29, waterMlPerBird: 216, phaseLabel: 'Starter Phase (Day 8–21)' },
  21: { day: 21, bw: 910, fcr: 1.30, waterMlPerBird: 228, phaseLabel: 'Starter Phase (Day 8–21)' },
  22: { day: 22, bw: 981, fcr: 1.32, waterMlPerBird: 240, phaseLabel: 'Grower Phase (Day 22–35)' },
  23: { day: 23, bw: 1054, fcr: 1.33, waterMlPerBird: 252, phaseLabel: 'Grower Phase (Day 22–35)' },
  24: { day: 24, bw: 1130, fcr: 1.35, waterMlPerBird: 264, phaseLabel: 'Grower Phase (Day 22–35)' },
  25: { day: 25, bw: 1208, fcr: 1.37, waterMlPerBird: 276, phaseLabel: 'Grower Phase (Day 22–35)' },
  26: { day: 26, bw: 1289, fcr: 1.38, waterMlPerBird: 288, phaseLabel: 'Grower Phase (Day 22–35)' },
  27: { day: 27, bw: 1372, fcr: 1.40, waterMlPerBird: 300, phaseLabel: 'Grower Phase (Day 22–35)' },
  28: { day: 28, bw: 1480, fcr: 1.41, waterMlPerBird: 312, phaseLabel: 'Grower Phase (Day 22–35)' },
  29: { day: 29, bw: 1565, fcr: 1.43, waterMlPerBird: 324, phaseLabel: 'Grower Phase (Day 22–35)' },
  30: { day: 30, bw: 1655, fcr: 1.45, waterMlPerBird: 336, phaseLabel: 'Grower Phase (Day 22–35)' },
  31: { day: 31, bw: 1748, fcr: 1.47, waterMlPerBird: 348, phaseLabel: 'Grower Phase (Day 22–35)' },
  32: { day: 32, bw: 1843, fcr: 1.49, waterMlPerBird: 360, phaseLabel: 'Grower Phase (Day 22–35)' },
  33: { day: 33, bw: 1941, fcr: 1.51, waterMlPerBird: 372, phaseLabel: 'Grower Phase (Day 22–35)' },
  34: { day: 34, bw: 2042, fcr: 1.52, waterMlPerBird: 384, phaseLabel: 'Grower Phase (Day 22–35)' },
  35: { day: 35, bw: 2150, fcr: 1.54, waterMlPerBird: 396, phaseLabel: 'Grower Phase (Day 22–35)' },
  36: { day: 36, bw: 2245, fcr: 1.56, waterMlPerBird: 408, phaseLabel: 'Finisher Phase (Day 36–56)' },
  37: { day: 37, bw: 2342, fcr: 1.58, waterMlPerBird: 418, phaseLabel: 'Finisher Phase (Day 36–56)' },
  38: { day: 38, bw: 2441, fcr: 1.60, waterMlPerBird: 428, phaseLabel: 'Finisher Phase (Day 36–56)' },
  39: { day: 39, bw: 2541, fcr: 1.62, waterMlPerBird: 438, phaseLabel: 'Finisher Phase (Day 36–56)' },
  40: { day: 40, bw: 2643, fcr: 1.64, waterMlPerBird: 448, phaseLabel: 'Finisher Phase (Day 36–56)' },
  41: { day: 41, bw: 2746, fcr: 1.66, waterMlPerBird: 458, phaseLabel: 'Finisher Phase (Day 36–56)' },
  42: { day: 42, bw: 2850, fcr: 1.68, waterMlPerBird: 468, phaseLabel: 'Finisher Phase (Day 36–56)' },
  43: { day: 43, bw: 2950, fcr: 1.70, waterMlPerBird: 478, phaseLabel: 'Finisher Phase (Day 36–56)' },
  44: { day: 44, bw: 3050, fcr: 1.71, waterMlPerBird: 488, phaseLabel: 'Finisher Phase (Day 36–56)' },
  45: { day: 45, bw: 3150, fcr: 1.73, waterMlPerBird: 498, phaseLabel: 'Finisher Phase (Day 36–56)' },
  46: { day: 46, bw: 3250, fcr: 1.74, waterMlPerBird: 508, phaseLabel: 'Finisher Phase (Day 36–56)' },
  47: { day: 47, bw: 3350, fcr: 1.75, waterMlPerBird: 518, phaseLabel: 'Finisher Phase (Day 36–56)' },
  48: { day: 48, bw: 3450, fcr: 1.76, waterMlPerBird: 526, phaseLabel: 'Finisher Phase (Day 36–56)' },
  49: { day: 49, bw: 3550, fcr: 1.78, waterMlPerBird: 534, phaseLabel: 'Finisher Phase (Day 36–56)' },
  50: { day: 50, bw: 3650, fcr: 1.79, waterMlPerBird: 542, phaseLabel: 'Finisher Phase (Day 36–56)' },
  51: { day: 51, bw: 3750, fcr: 1.80, waterMlPerBird: 550, phaseLabel: 'Finisher Phase (Day 36–56)' },
  52: { day: 52, bw: 3850, fcr: 1.81, waterMlPerBird: 558, phaseLabel: 'Finisher Phase (Day 36–56)' },
  53: { day: 53, bw: 3950, fcr: 1.81, waterMlPerBird: 566, phaseLabel: 'Finisher Phase (Day 36–56)' },
  54: { day: 54, bw: 4050, fcr: 1.82, waterMlPerBird: 574, phaseLabel: 'Finisher Phase (Day 36–56)' },
  55: { day: 55, bw: 4150, fcr: 1.82, waterMlPerBird: 582, phaseLabel: 'Finisher Phase (Day 36–56)' },
  56: { day: 56, bw: 4250, fcr: 1.83, waterMlPerBird: 590, phaseLabel: 'Finisher Phase (Day 36–56)' },
};

// Ross 308 (Fast growth, high breast meat yield)
const ROSS_308_DATA: Record<number, BroilerBenchmark> = (() => {
  const data: Record<number, BroilerBenchmark> = {};
  for (let d = 1; d <= 56; d++) {
    const base = COBB_500_DATA[d];
    // Ross 308 has ~4-5% higher early/mid weight and slightly lower FCR
    const bwMult = d <= 21 ? 1.055 : d <= 35 ? 1.042 : 1.038;
    const fcrMult = 0.985;
    data[d] = {
      day: d,
      bw: Math.round(base.bw * bwMult),
      fcr: Number((base.fcr * fcrMult).toFixed(2)),
      waterMlPerBird: Math.round(base.waterMlPerBird * 1.03),
      phaseLabel: base.phaseLabel,
    };
  }
  return data;
})();

// Hubbard (Hardy, balanced growth, robust Indian tropical resilience)
const HUBBARD_DATA: Record<number, BroilerBenchmark> = (() => {
  const data: Record<number, BroilerBenchmark> = {};
  for (let d = 1; d <= 56; d++) {
    const base = COBB_500_DATA[d];
    // Hubbard has slightly lower initial body weight, strong skeletal frame
    const bwMult = d <= 14 ? 0.97 : d <= 35 ? 0.975 : 0.98;
    const fcrMult = 1.01;
    data[d] = {
      day: d,
      bw: Math.round(base.bw * bwMult),
      fcr: Number((base.fcr * fcrMult).toFixed(2)),
      waterMlPerBird: base.waterMlPerBird,
      phaseLabel: base.phaseLabel,
    };
  }
  return data;
})();

// Layer Benchmarks
// Venkateshwara BV 300 (Standard commercial Indian layer benchmark)
const BV_300_DATA: Record<number, LayerBenchmark> = (() => {
  const data: Record<number, LayerBenchmark> = {};
  const keyPoints: [number, number, number, number][] = [
    [1, 65, 12, 0],
    [2, 110, 18, 0],
    [3, 175, 24, 0],
    [4, 245, 30, 0],
    [5, 325, 35, 0],
    [6, 410, 40, 0],
    [7, 500, 45, 0],
    [8, 590, 49, 0],
    [9, 680, 53, 0],
    [10, 770, 57, 0],
    [11, 855, 61, 0],
    [12, 935, 65, 0],
    [13, 1010, 68, 0],
    [14, 1080, 71, 0],
    [15, 1145, 74, 0],
    [16, 1205, 78, 0],
    [17, 1265, 82, 3],
    [18, 1325, 86, 15],
    [19, 1385, 92, 42],
    [20, 1440, 98, 70],
    [22, 1510, 105, 90],
    [25, 1560, 109, 95],
    [30, 1595, 110, 95],
    [35, 1615, 110, 94],
    [40, 1630, 111, 92],
    [45, 1645, 111, 90],
    [50, 1655, 110, 88],
    [55, 1665, 110, 85],
    [60, 1675, 109, 82],
    [65, 1685, 109, 79],
    [72, 1695, 108, 75],
  ];

  for (let w = 1; w <= 72; w++) {
    let lower = keyPoints[0];
    let upper = keyPoints[keyPoints.length - 1];
    for (let i = 0; i < keyPoints.length - 1; i++) {
      if (w >= keyPoints[i][0] && w <= keyPoints[i + 1][0]) {
        lower = keyPoints[i];
        upper = keyPoints[i + 1];
        break;
      }
    }
    const span = upper[0] - lower[0] || 1;
    const ratio = (w - lower[0]) / span;
    const bw = Math.round(lower[1] + (upper[1] - lower[1]) * ratio);
    const feed = Math.round(lower[2] + (upper[2] - lower[2]) * ratio);
    const egg = Math.round(lower[3] + (upper[3] - lower[3]) * ratio);
    const phaseLabel =
      w <= 6
        ? 'Chick Brooding (Wk 1–6)'
        : w <= 18
        ? 'Pullet Grower & Pre-Lay (Wk 7–18)'
        : w <= 45
        ? 'Peak Laying Phase (Wk 19–45)'
        : 'Mid-to-Late Lay (Wk 46–72)';
    data[w] = {
      week: w,
      bw,
      feedGramsPerDay: feed,
      waterMlPerBird: Math.round(feed * 2.15),
      targetEggPct: egg,
      phaseLabel,
    };
  }
  return data;
})();

// Hy-Line W-36 (Leaner white leghorn, high feed conversion efficiency, 96% peak)
const HY_LINE_DATA: Record<number, LayerBenchmark> = (() => {
  const data: Record<number, LayerBenchmark> = {};
  for (let w = 1; w <= 72; w++) {
    const base = BV_300_DATA[w];
    const bw = Math.round(base.bw * 0.96); // slightly lighter frame
    const egg = w >= 23 && w <= 42 ? Math.min(97, base.targetEggPct + 1) : base.targetEggPct;
    data[w] = {
      week: w,
      bw,
      feedGramsPerDay: Math.round(base.feedGramsPerDay * 0.96),
      waterMlPerBird: Math.round(base.waterMlPerBird * 0.96),
      targetEggPct: egg,
      phaseLabel: base.phaseLabel,
    };
  }
  return data;
})();

// Lohmann White (High shell strength, persistent lay)
const LOHMANN_WHITE_DATA: Record<number, LayerBenchmark> = (() => {
  const data: Record<number, LayerBenchmark> = {};
  for (let w = 1; w <= 72; w++) {
    const base = BV_300_DATA[w];
    data[w] = {
      week: w,
      bw: Math.round(base.bw * 0.98),
      feedGramsPerDay: base.feedGramsPerDay,
      waterMlPerBird: base.waterMlPerBird,
      targetEggPct: base.targetEggPct,
      phaseLabel: base.phaseLabel,
    };
  }
  return data;
})();

// Lohmann Brown (Brown egg layer, heavier body weight, larger egg size)
const LOHMANN_BROWN_DATA: Record<number, LayerBenchmark> = (() => {
  const data: Record<number, LayerBenchmark> = {};
  for (let w = 1; w <= 72; w++) {
    const base = BV_300_DATA[w];
    const bw = Math.round(base.bw * 1.18); // Brown layers are heavier (1.9-2.0kg)
    const feed = Math.round(base.feedGramsPerDay * 1.08); // Higher feed intake
    data[w] = {
      week: w,
      bw,
      feedGramsPerDay: feed,
      waterMlPerBird: Math.round(feed * 2.15),
      targetEggPct: base.targetEggPct,
      phaseLabel: base.phaseLabel,
    };
  }
  return data;
})();

// Helper lookup functions by Breed
export function getBroilerBenchmark(day: number, breed: BroilerBreed = 'Cobb 500'): BroilerBenchmark {
  const safeDay = Math.min(56, Math.max(1, Math.round(day)));
  let dataset = COBB_500_DATA;
  if (breed === 'Ross 308') {
    dataset = ROSS_308_DATA;
  } else if (breed === 'Hubbard') {
    dataset = HUBBARD_DATA;
  }
  return dataset[safeDay] || dataset[7];
}

export function getLayerBenchmark(week: number, breed: LayerBreed = 'BV 300'): LayerBenchmark {
  const safeWeek = Math.min(72, Math.max(1, Math.round(week)));
  let dataset = BV_300_DATA;
  if (breed === 'Hy-Line W-36') {
    dataset = HY_LINE_DATA;
  } else if (breed === 'Lohmann White') {
    dataset = LOHMANN_WHITE_DATA;
  } else if (breed === 'Lohmann Brown') {
    dataset = LOHMANN_BROWN_DATA;
  }
  return dataset[safeWeek] || dataset[20];
}

// Backwards-compatible default benchmark exports
export const BROILER_STD_DATA = COBB_500_DATA;
export const LAYER_STD_DATA = BV_300_DATA;

export const BROILER_BREED_OPTIONS: BroilerBreed[] = ['Cobb 500', 'Ross 308', 'Hubbard'];
export const LAYER_BREED_OPTIONS: LayerBreed[] = ['BV 300', 'Hy-Line W-36', 'Lohmann White', 'Lohmann Brown'];
