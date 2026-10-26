import React, { useMemo, useState } from 'react';
import {
  Award,
  AlertTriangle,
  Check,
  Printer,
  Save,
  Search,
  Share2,
  RotateCcw,
  Calendar,
  CloudSun,
  Scale,
  Egg,
  Layers,
  ArrowDown,
  Plus,
  Trash2,
  DollarSign,
  TrendingDown,
  Sparkles,
} from 'lucide-react';
import {
  BROILER_BREED_OPTIONS,
  getBroilerBenchmark,
  getLayerBenchmark,
  LAYER_BREED_OPTIONS,
} from '../data/nrcBenchmarks';
import { SEASONAL_UNDERWEIGHT_REASONS } from '../data/seasonalReasons';
import { LAYER_SPECIFIC_ISSUES } from '../data/layerIssues';
import { PrintFarmerReportModal } from './PrintFarmerReportModal';
import {
  BirdType,
  BroilerBreed,
  FarmVisitRecord,
  LayerBreed,
  OfficerProfile,
  PoultryBreed,
  ProductItem,
  ProductSKU,
  SeasonType,
  SelectedProductPlan,
} from '../types/poultry';
import {
  analyzeBodyWeight,
  calculateProductDosageAndCost,
  downloadFollowUpCalendarICS,
  formatQuantity,
  getCurrentSeason,
} from '../utils/calculations';

interface FarmVisitWorkbenchProps {
  products: ProductItem[];
  officerProfile: OfficerProfile;
  preselectedProductIds: string[];
  preselectedDiseaseIds: string[];
  onClearPreselected: () => void;
  onSaveVisit: (visit: FarmVisitRecord) => void;
  onNavigateToFollowUps: () => void;
}

function toLocalDateTimeInputValue(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours()
  )}:${pad(date.getMinutes())}`;
}

export const FarmVisitWorkbench: React.FC<FarmVisitWorkbenchProps> = ({
  products,
  officerProfile,
  preselectedProductIds,
  preselectedDiseaseIds,
  onClearPreselected,
  onSaveVisit,
  onNavigateToFollowUps,
}) => {
  // Farm & Customer Details
  const [visitDateTime, setVisitDateTime] = useState<string>(() =>
    toLocalDateTimeInputValue(new Date())
  );
  const [farmerName, setFarmerName] = useState<string>('');
  const [farmName, setFarmName] = useState<string>('');
  const [farmerPhone, setFarmerPhone] = useState<string>('');
  const [farmerEmail, setFarmerEmail] = useState<string>('');
  const [villageLocation, setVillageLocation] = useState<string>('');

  // Season & Flock Parameters
  const [seasonObserved, setSeasonObserved] = useState<SeasonType>(getCurrentSeason());
  const [birdType, setBirdType] = useState<BirdType>(BirdType.Broiler);
  const [broilerBreed, setBroilerBreed] = useState<BroilerBreed>('Cobb 500');
  const [layerBreed, setLayerBreed] = useState<LayerBreed>('BV 300');
  const [ageValue, setAgeValue] = useState<number>(21);
  const [observedBW, setObservedBW] = useState<number>(840);
  const [flockSize, setFlockSize] = useState<number>(10000);
  const [observedEggPct, setObservedEggPct] = useState<number>(85);
  const [eggPricePerUnit, setEggPricePerUnit] = useState<number>(5.5);
  const [selectedLayerIssueIds, setSelectedLayerIssueIds] = useState<string[]>([
    'layer-thin-cracked-shells',
  ]);
  const [customWaterMl, setCustomWaterMl] = useState<string>('');

  // Seasonal Underweight Root-Causes
  const [selectedReasonIds, setSelectedReasonIds] = useState<string[]>([]);

  // Pricing Mode Toggle: MRP vs PTR (Price to Retailer)
  const [pricingMode, setPricingMode] = useState<'mrp' | 'ptr'>('mrp');

  // Selected Products with exact SKU Codes from catalog
  const [selectedPlans, setSelectedPlans] = useState<Record<string, SelectedProductPlan>>(() => {
    const initial: Record<string, SelectedProductPlan> = {
      'prd-calgophos': { productId: 'prd-calgophos', selectedSkuCode: 'AE94489', days: 3 }, // 5L
      'prd-brotone': { productId: 'prd-brotone', selectedSkuCode: 'AE96299', days: 5 }, // 5L
      'prd-vimeral': { productId: 'prd-vimeral', selectedSkuCode: 'AE93889', days: 5 }, // Vimeral Forte 5L
    };
    return initial;
  });

  // Handle incoming preselected products from Diseases / Autopsy
  React.useEffect(() => {
    if (preselectedProductIds.length > 0) {
      setSelectedPlans((prev) => {
        const next = { ...prev };
        preselectedProductIds.forEach((id) => {
          const found = products.find((p) => p.id === id);
          if (found && !next[id]) {
            next[id] = {
              productId: id,
              selectedSkuCode: found.skus[0]?.code || '',
              days: found.defaultDays,
            };
          }
        });
        return next;
      });
      onClearPreselected();
    }
  }, [preselectedProductIds, products, onClearPreselected]);

  const [productSearch, setProductSearch] = useState<string>('');
  const [productCategoryFilter, setProductCategoryFilter] = useState<string>('ALL');
  const [fieldNotes, setFieldNotes] = useState<string>('');
  const [validationError, setValidationError] = useState<string>('');
  const [lastSavedVisit, setLastSavedVisit] = useState<FarmVisitRecord | null>(null);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState<boolean>(false);

  const currentBreed: PoultryBreed = birdType === BirdType.Broiler ? broilerBreed : layerBreed;

  // Switch bird type cleanly
  const handleBirdTypeChange = (type: BirdType) => {
    setBirdType(type);
    if (type === BirdType.Broiler) {
      setAgeValue(21);
      setObservedBW(840);
      setSelectedPlans({
        'prd-calgophos': { productId: 'prd-calgophos', selectedSkuCode: 'AE94489', days: 3 },
        'prd-brotone': { productId: 'prd-brotone', selectedSkuCode: 'AE96299', days: 5 },
        'prd-vimeral': { productId: 'prd-vimeral', selectedSkuCode: 'AE93889', days: 5 },
      });
    } else {
      setAgeValue(26);
      setObservedBW(1560);
      setObservedEggPct(84);
      setSelectedPlans({
        'prd-calgophos': { productId: 'prd-calgophos', selectedSkuCode: 'AE94489', days: 3 },
        'prd-kalzol': { productId: 'prd-kalzol', selectedSkuCode: 'AE96869', days: 5 },
        'prd-vitablend': { productId: 'prd-vitablend', selectedSkuCode: 'AL93889', days: 4 },
      });
    }
    setCustomWaterMl('');
  };

  // Standard Body Weight Analysis grounded in selected breed
  const bwAnalysis = useMemo(
    () => analyzeBodyWeight(birdType, ageValue, observedBW, flockSize, currentBreed),
    [birdType, ageValue, observedBW, flockSize, currentBreed]
  );

  // Layer-Specific Hen-Day Lay and Financial Loss Calculations based on layer breed
  const targetEggPct = useMemo(() => {
    if (birdType !== BirdType.Layer) return 0;
    return getLayerBenchmark(ageValue, layerBreed)?.targetEggPct || 0;
  }, [birdType, ageValue, layerBreed]);

  const isLayingPhase = birdType === BirdType.Layer && ageValue >= 18 && targetEggPct > 0;

  const targetDailyEggs = useMemo(() => {
    if (!isLayingPhase) return 0;
    return Math.round((flockSize * targetEggPct) / 100);
  }, [isLayingPhase, flockSize, targetEggPct]);

  const observedDailyEggs = useMemo(() => {
    if (!isLayingPhase) return 0;
    return Math.round((flockSize * observedEggPct) / 100);
  }, [isLayingPhase, flockSize, observedEggPct]);

  const dailyEggDeficit = useMemo(() => {
    if (!isLayingPhase) return 0;
    return Math.max(0, targetDailyEggs - observedDailyEggs);
  }, [isLayingPhase, targetDailyEggs, observedDailyEggs]);

  const eggDeficitPct = useMemo(() => {
    if (!isLayingPhase) return 0;
    return Math.max(0, targetEggPct - observedEggPct);
  }, [isLayingPhase, targetEggPct, observedEggPct]);

  const dailyFinancialLoss = useMemo(() => {
    if (!isLayingPhase) return 0;
    return Math.round(dailyEggDeficit * eggPricePerUnit);
  }, [isLayingPhase, dailyEggDeficit, eggPricePerUnit]);

  const monthlyFinancialLoss = useMemo(() => {
    return dailyFinancialLoss * 30;
  }, [dailyFinancialLoss]);

  const toggleLayerIssue = (issueId: string) => {
    setSelectedLayerIssueIds((prev) => {
      const exists = prev.includes(issueId);
      if (exists) {
        return prev.filter((id) => id !== issueId);
      } else {
        const next = [...prev, issueId];
        const issue = LAYER_SPECIFIC_ISSUES.find((i) => i.id === issueId);
        if (issue && issue.recommendedProductIds.length > 0) {
          setSelectedPlans((prevPlans) => {
            const updated = { ...prevPlans };
            issue.recommendedProductIds.forEach((pid) => {
              const prod = products.find((p) => p.id === pid);
              if (prod && !updated[pid]) {
                updated[pid] = {
                  productId: pid,
                  selectedSkuCode: prod.skus[0]?.code || '',
                  days: prod.defaultDays,
                };
              }
            });
            return updated;
          });
        }
        return next;
      }
    });
  };

  const handleAddIssueProducts = (pids: string[]) => {
    setSelectedPlans((prevPlans) => {
      const updated = { ...prevPlans };
      pids.forEach((pid) => {
        const prod = products.find((p) => p.id === pid);
        if (prod && !updated[pid]) {
          updated[pid] = {
            productId: pid,
            selectedSkuCode: prod.skus[0]?.code || '',
            days: prod.defaultDays,
          };
        }
      });
      return updated;
    });
  };

  const effectiveWaterMlPerBird = useMemo(() => {
    const custom = parseFloat(customWaterMl);
    if (!isNaN(custom) && custom > 0) return custom;
    return bwAnalysis.waterMlPerBird;
  }, [customWaterMl, bwAnalysis.waterMlPerBird]);

  // Seasonal reasons matching current season and bird type
  const activeSeasonalReasons = useMemo(() => {
    return SEASONAL_UNDERWEIGHT_REASONS.filter(
      (r) => r.season === seasonObserved && r.birdTypes.includes(birdType)
    );
  }, [seasonObserved, birdType]);

  // Product categories for filter
  const productCategories = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => set.add(p.category));
    return ['ALL', ...Array.from(set)];
  }, [products]);

  // Calculate Product Economics
  const calculatedSelectedProducts = useMemo(() => {
    return Object.values(selectedPlans)
      .map((plan) => {
        const product = products.find((p) => p.id === plan.productId);
        if (!product) return null;
        return calculateProductDosageAndCost(
          product,
          plan,
          flockSize,
          effectiveWaterMlPerBird
        );
      })
      .filter((item): item is NonNullable<typeof item> => item !== null);
  }, [selectedPlans, products, flockSize, effectiveWaterMlPerBird]);

  const totalCommercialPackCost = useMemo(() => {
    return calculatedSelectedProducts.reduce(
      (sum, c) =>
        sum + (pricingMode === 'mrp' ? c.commercialPackCostMrp : c.commercialPackCostPtr),
      0
    );
  }, [calculatedSelectedProducts, pricingMode]);

  const totalCostPerBirdExact = useMemo(() => {
    return calculatedSelectedProducts.reduce(
      (sum, c) =>
        sum + (pricingMode === 'mrp' ? c.costPerBirdExactMrp : c.costPerBirdExactPtr),
      0
    );
  }, [calculatedSelectedProducts, pricingMode]);

  const totalCostPerBirdPack = useMemo(() => {
    const safeFlock = Math.max(1, flockSize);
    return totalCommercialPackCost / safeFlock;
  }, [totalCommercialPackCost, flockSize]);

  // Filter Catalog for selection
  const filteredCatalog = useMemo(() => {
    return products.filter((p) => {
      const matchesCat = productCategoryFilter === 'ALL' || p.category === productCategoryFilter;
      const q = productSearch.trim().toLowerCase();
      const matchesQuery =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.composition.toLowerCase().includes(q) ||
        p.positioning.toLowerCase().includes(q) ||
        p.shortCode.toLowerCase().includes(q) ||
        p.skus.some((s) => s.code.toLowerCase().includes(q) || s.packName.toLowerCase().includes(q));
      return matchesCat && matchesQuery;
    });
  }, [products, productCategoryFilter, productSearch]);

  const toggleReason = (id: string) => {
    setSelectedReasonIds((prev) =>
      prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id]
    );
  };

  const toggleProduct = (product: ProductItem) => {
    setSelectedPlans((prev) => {
      const next = { ...prev };
      if (next[product.id]) {
        delete next[product.id];
      } else {
        next[product.id] = {
          productId: product.id,
          selectedSkuCode: product.skus[0]?.code || '',
          days: product.defaultDays,
          customDose: product.standardDose,
        };
      }
      return next;
    });
  };

  const updateProductPlan = (productId: string, patch: Partial<SelectedProductPlan>) => {
    setSelectedPlans((prev) => {
      const existing = prev[productId];
      if (!existing) return prev;
      return {
        ...prev,
        [productId]: { ...existing, ...patch },
      };
    });
  };

  const applySeasonalPreset = () => {
    if (seasonObserved === 'Summer / Heat Stress') {
      setSelectedPlans({
        'prd-calgophos': { productId: 'prd-calgophos', selectedSkuCode: 'AE94489', days: 3 },
        'prd-vimeral': { productId: 'prd-vimeral', selectedSkuCode: 'AE93889', days: 5 },
        'prd-brotone': { productId: 'prd-brotone', selectedSkuCode: 'AE96299', days: 5 },
      });
    } else if (seasonObserved === 'Monsoon / Wet Litter') {
      setSelectedPlans({
        'prd-toximar': { productId: 'prd-toximar', selectedSkuCode: 'AF91129', days: 14 },
        'prd-addon': { productId: 'prd-addon', selectedSkuCode: 'AF98889', days: 7 },
        'prd-brotone': { productId: 'prd-brotone', selectedSkuCode: 'AE96299', days: 5 },
      });
    } else if (seasonObserved === 'Winter / Cold Ammonia') {
      setSelectedPlans({
        'prd-trox': { productId: 'prd-trox', selectedSkuCode: 'AF96829', days: 3 },
        'prd-hepono': { productId: 'prd-hepono', selectedSkuCode: 'AF95689', days: 5 },
        'prd-vitagro': { productId: 'prd-vitagro', selectedSkuCode: 'AE94549', days: 5 },
      });
    } else {
      setSelectedPlans({
        'prd-groviplex': { productId: 'prd-groviplex', selectedSkuCode: 'AW94329', days: 7 },
        'prd-vitablend': { productId: 'prd-vitablend', selectedSkuCode: 'AL93889', days: 4 },
        'prd-calgophos': { productId: 'prd-calgophos', selectedSkuCode: 'AE94489', days: 3 },
      });
    }
  };

  const handleRecordFarmVisit = () => {
    if (!farmerName.trim() || !farmName.trim() || !farmerPhone.trim()) {
      setValidationError(
        'Please enter Farmer Name, Farm Name, and Mobile Number before saving the consultation record.'
      );
      return;
    }
    setValidationError('');

    const parsedDate = visitDateTime ? new Date(visitDateTime) : new Date();
    const recordedIso = isNaN(parsedDate.getTime())
      ? new Date().toISOString()
      : parsedDate.toISOString();
    const followUpDueIso = new Date(
      new Date(recordedIso).getTime() + 7 * 24 * 60 * 60 * 1000
    ).toISOString();

    const record: FarmVisitRecord = {
      id: `vis-${Date.now()}`,
      recordedAt: recordedIso,
      followUpDueAt: followUpDueIso,
      followUpStatus: 'pending',
      officerId: officerProfile.officerId,
      boName: officerProfile.officerName,
      boEmail: officerProfile.officerEmail,
      boPhone: officerProfile.officerPhone,
      buUnit: officerProfile.buUnit,
      region: officerProfile.region,
      hq: officerProfile.hq,
      officerName: officerProfile.officerName,
      officerEmail: officerProfile.officerEmail,
      farmerName: farmerName.trim(),
      farmName: farmName.trim(),
      farmerPhone: farmerPhone.trim(),
      farmerEmail: farmerEmail.trim(),
      villageLocation: villageLocation.trim(),
      seasonObserved,
      birdType,
      breed: currentBreed,
      flockSize,
      ageValue,
      targetBW: bwAnalysis.targetBW,
      observedBW,
      observedEggPct: birdType === BirdType.Layer ? observedEggPct : undefined,
      targetEggPct: birdType === BirdType.Layer ? targetEggPct : undefined,
      eggPricePerUnit: birdType === BirdType.Layer ? eggPricePerUnit : undefined,
      targetEggCount: birdType === BirdType.Layer ? targetDailyEggs : undefined,
      observedEggCount: birdType === BirdType.Layer ? observedDailyEggs : undefined,
      dailyEggDeficit: birdType === BirdType.Layer ? dailyEggDeficit : undefined,
      dailyFinancialLoss: birdType === BirdType.Layer ? dailyFinancialLoss : undefined,
      monthlyFinancialLoss: birdType === BirdType.Layer ? monthlyFinancialLoss : undefined,
      selectedLayerIssueIds: birdType === BirdType.Layer ? selectedLayerIssueIds : [],
      weightStatus: bwAnalysis.isOptimalOrAbove ? 'optimal' : 'underweight',
      weightDeficitGrams: bwAnalysis.weightDeficitGrams,
      extraFeedFlockKg: bwAnalysis.flockExtraFeedKg,
      selectedReasonIds: bwAnalysis.isOptimalOrAbove ? [] : selectedReasonIds,
      diagnosedDiseaseIds: preselectedDiseaseIds,
      selectedProducts: calculatedSelectedProducts.map((c) => ({
        productId: c.product.id,
        productName: c.product.name,
        skuCode: c.sku.code,
        packName: c.sku.packName,
        doseRate: c.doseRate,
        doseUnit: c.product.doseUnit,
        dosageBasis: c.product.dosageBasis,
        days: c.days,
        totalQuantity: c.totalQuantity,
        packsRounded: c.packsRounded,
        mrpPerPack: c.sku.mrp,
        ptrPerPack: c.sku.ptr,
        totalPackCostMrp: c.commercialPackCostMrp,
        costPerBird: c.costPerBirdExactMrp,
      })),
      totalPrescriptionCost: totalCommercialPackCost,
      totalCostPerBird: totalCostPerBirdExact,
      fieldNotes: fieldNotes.trim(),
    };

    onSaveVisit(record);
    setLastSavedVisit(record);
  };

  const currentLiveVisit: FarmVisitRecord = useMemo(() => {
    if (lastSavedVisit) return lastSavedVisit;
    const parsedDate = visitDateTime ? new Date(visitDateTime) : new Date();
    const recordedIso = isNaN(parsedDate.getTime())
      ? new Date().toISOString()
      : parsedDate.toISOString();
    return {
      id: 'current-preview',
      recordedAt: recordedIso,
      followUpDueAt: new Date(new Date(recordedIso).getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      followUpStatus: 'pending',
      officerId: officerProfile.officerId,
      boName: officerProfile.officerName,
      boEmail: officerProfile.officerEmail,
      boPhone: officerProfile.officerPhone,
      buUnit: officerProfile.buUnit,
      region: officerProfile.region,
      hq: officerProfile.hq,
      officerName: officerProfile.officerName,
      officerEmail: officerProfile.officerEmail,
      farmerName: farmerName.trim() || 'Farmer (Sample)',
      farmName: farmName.trim() || 'Poultry Farm',
      farmerPhone: farmerPhone.trim() || officerProfile.officerPhone,
      farmerEmail: farmerEmail.trim(),
      villageLocation: villageLocation.trim() || officerProfile.hq,
      seasonObserved,
      birdType,
      breed: currentBreed,
      flockSize,
      ageValue,
      targetBW: bwAnalysis.targetBW,
      observedBW,
      observedEggPct: birdType === BirdType.Layer ? observedEggPct : undefined,
      targetEggPct: birdType === BirdType.Layer ? targetEggPct : undefined,
      eggPricePerUnit: birdType === BirdType.Layer ? eggPricePerUnit : undefined,
      targetEggCount: birdType === BirdType.Layer ? targetDailyEggs : undefined,
      observedEggCount: birdType === BirdType.Layer ? observedDailyEggs : undefined,
      dailyEggDeficit: birdType === BirdType.Layer ? dailyEggDeficit : undefined,
      dailyFinancialLoss: birdType === BirdType.Layer ? dailyFinancialLoss : undefined,
      monthlyFinancialLoss: birdType === BirdType.Layer ? monthlyFinancialLoss : undefined,
      selectedLayerIssueIds: birdType === BirdType.Layer ? selectedLayerIssueIds : [],
      weightStatus: bwAnalysis.isOptimalOrAbove ? 'optimal' : 'underweight',
      weightDeficitGrams: bwAnalysis.weightDeficitGrams,
      extraFeedFlockKg: bwAnalysis.flockExtraFeedKg,
      selectedReasonIds: bwAnalysis.isOptimalOrAbove ? [] : selectedReasonIds,
      diagnosedDiseaseIds: preselectedDiseaseIds,
      selectedProducts: calculatedSelectedProducts.map((c) => ({
        productId: c.product.id,
        productName: c.product.name,
        skuCode: c.sku.code,
        packName: c.sku.packName,
        doseRate: c.doseRate,
        doseUnit: c.product.doseUnit,
        dosageBasis: c.product.dosageBasis,
        days: c.days,
        totalQuantity: c.totalQuantity,
        packsRounded: c.packsRounded,
        mrpPerPack: c.sku.mrp,
        ptrPerPack: c.sku.ptr,
        totalPackCostMrp: c.commercialPackCostMrp,
        costPerBird: c.costPerBirdExactMrp,
      })),
      totalPrescriptionCost: totalCommercialPackCost,
      totalCostPerBird: totalCostPerBirdExact,
      fieldNotes: fieldNotes.trim() || 'Standard seasonal health protocol and biosecurity advice provided.',
    };
  }, [
    lastSavedVisit,
    visitDateTime,
    officerProfile,
    farmerName,
    farmName,
    farmerPhone,
    farmerEmail,
    villageLocation,
    seasonObserved,
    birdType,
    currentBreed,
    flockSize,
    ageValue,
    bwAnalysis,
    observedBW,
    observedEggPct,
    selectedReasonIds,
    preselectedDiseaseIds,
    calculatedSelectedProducts,
    totalCommercialPackCost,
    totalCostPerBirdExact,
    fieldNotes,
    targetDailyEggs,
    observedDailyEggs,
    dailyEggDeficit,
    dailyFinancialLoss,
    monthlyFinancialLoss,
    eggPricePerUnit,
    targetEggPct,
    selectedLayerIssueIds,
  ]);

  const handleShareWhatsAppSummary = () => {
    const sym = officerProfile.currencySymbol;
    const statusLine = bwAnalysis.isOptimalOrAbove
      ? `Exemplary Growth! Observed ${observedBW}g meets/exceeds standard benchmark ${bwAnalysis.targetBW}g for ${currentBreed} (${bwAnalysis.achievementPct.toFixed(1)}%).`
      : `Flock is ${bwAnalysis.weightDeficitGrams.toFixed(0)}g underweight against ${bwAnalysis.targetBW}g ${currentBreed} standard in ${seasonObserved}. Approx extra feed required: ${bwAnalysis.flockExtraFeedKg.toFixed(1)} kg across ${flockSize.toLocaleString()} birds.`;

    const reasonsText =
      selectedReasonIds.length > 0
        ? `\n*Probable Seasonal Factors Noted:*\n` +
          selectedReasonIds
            .map((id) => {
              const r = activeSeasonalReasons.find((x) => x.id === id);
              return r ? `- ${r.title}` : '';
            })
            .filter(Boolean)
            .join('\n')
        : '';

    const prodText = calculatedSelectedProducts
      .map(
        (c, i) =>
          `${i + 1}. *${c.product.name}* [${c.sku.packName}] (Code: ${c.sku.code})\n   Dose: ${c.doseRate}${c.product.doseUnit} × ${c.days} days | Total: ${formatQuantity(c.totalQuantity, c.product.doseUnit)} | Cost: ${sym}${c.costPerBirdExactMrp.toFixed(2)}/bird`
      )
      .join('\n\n');

    const text = [
      `*Virbac Poultry Field Technical Consultation*`,
      `Business Officer: ${officerProfile.officerName} (${officerProfile.officerId})`,
      `Farm: ${farmName || 'Valued Farm'} (${farmerName || 'Farmer'})`,
      `Flock: ${flockSize.toLocaleString()} ${birdType} · Breed: ${currentBreed} · ${birdType === BirdType.Broiler ? `Day ${ageValue}` : `Week ${ageValue}`}`,
      `Season: ${seasonObserved}`,
      ``,
      `*Flock Assessment:*`,
      statusLine,
      reasonsText,
      calculatedSelectedProducts.length > 0 ? `\n*Recommended Virbac Portfolio & Economics:*` : '',
      prodText,
      calculatedSelectedProducts.length > 0
        ? `\nTotal Farmer Investment: *${sym}${totalCostPerBirdExact.toFixed(2)} per bird*`
        : '',
      `\nNext Technical Follow-Up Call: 7 days from visit (${officerProfile.officerName})`,
    ]
      .filter(Boolean)
      .join('\n');

    const cleanPhone = farmerPhone.replace(/[^0-9]/g, '');
    const waUrl = cleanPhone
      ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`
      : `https://wa.me/?text=${encodeURIComponent(text)}`;

    const link = document.createElement('a');
    link.href = waUrl;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.click();
  };

  const resetFormForNextFarm = () => {
    setVisitDateTime(toLocalDateTimeInputValue(new Date()));
    setFarmerName('');
    setFarmName('');
    setFarmerPhone('');
    setFarmerEmail('');
    setVillageLocation('');
    setFieldNotes('');
    setSelectedReasonIds([]);
    setLastSavedVisit(null);
    setValidationError('');
  };

  return (
    <div className="mx-auto max-w-7xl px-3 sm:px-6 lg:px-8 pb-20">
      {/* Top Banner Toolbar */}
      <div className="mb-5 flex flex-col justify-between gap-3 border-b border-slate-200 pb-4 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-md bg-blue-100 px-2 py-0.5 text-xs font-black text-blue-900 font-mono">
              {officerProfile.officerId || 'BO-1042'}
            </span>
            <span className="text-xs font-bold text-slate-700">
              {officerProfile.officerName} · {officerProfile.hq}
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-0.5">
            Farm Visit <span className="text-blue-700">Workbench</span>
          </h1>
        </div>

        <div className="no-print flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white p-1">
            <button
              type="button"
              onClick={() => setPricingMode('mrp')}
              className={`rounded px-2.5 py-1 text-xs font-semibold cursor-pointer ${
                pricingMode === 'mrp'
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Farmer MRP (₹)
            </button>
            <button
              type="button"
              onClick={() => setPricingMode('ptr')}
              className={`rounded px-2.5 py-1 text-xs font-semibold cursor-pointer ${
                pricingMode === 'ptr'
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Trade PTR (₹)
            </button>
          </div>

          <button
            type="button"
            onClick={() => setIsPrintModalOpen(true)}
            className="inline-flex min-h-[38px] items-center gap-1.5 rounded-xl border border-blue-600 bg-blue-50 px-3.5 py-1.5 text-xs font-bold text-blue-800 hover:bg-blue-100 transition-colors cursor-pointer shadow-2xs"
          >
            <Printer className="h-3.5 w-3.5 text-blue-700" />
            <span>Print Report</span>
          </button>

          <button
            type="button"
            onClick={handleShareWhatsAppSummary}
            className="inline-flex min-h-[38px] items-center gap-1.5 rounded-xl border border-emerald-600 bg-emerald-50 px-3.5 py-1.5 text-xs font-bold text-emerald-800 hover:bg-emerald-100 cursor-pointer shadow-2xs"
          >
            <Share2 className="h-3.5 w-3.5 text-emerald-700" />
            <span>WhatsApp</span>
          </button>

          <button
            type="button"
            onClick={resetFormForNextFarm}
            className="inline-flex min-h-[38px] items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-200 cursor-pointer"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>New Visit</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Customer Record & Flock Benchmark Sections */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 items-start">
        {/* LEFT COLUMN: Section 01 Customer & Farm Record */}
        <div className="space-y-6 lg:col-span-6">
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-base font-bold text-slate-900">01. Customer &amp; Farm Record</h2>
                <p className="text-xs text-slate-500">Record customer details with instant save</p>
              </div>
              <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold text-emerald-800 border border-emerald-200">
                +7d Reminder
              </span>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-3.5 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Visit Date &amp; Exact Time <span className="text-red-600">*</span>
                </label>
                <input
                  type="datetime-local"
                  value={visitDateTime}
                  onChange={(e) => setVisitDateTime(e.target.value)}
                  className="min-h-[42px] w-full rounded-xl border border-slate-300 bg-white px-3 py-2 font-mono text-sm tabular-nums text-slate-900 focus:border-blue-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Farmer Name <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Ramesh Babu"
                  value={farmerName}
                  onChange={(e) => setFarmerName(e.target.value)}
                  className="min-h-[42px] w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-blue-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Poultry Farm Name <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Sri Sai Poultry Farm"
                  value={farmName}
                  onChange={(e) => setFarmName(e.target.value)}
                  className="min-h-[42px] w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-blue-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Mobile / WhatsApp Number <span className="text-red-600">*</span>
                </label>
                <input
                  type="tel"
                  placeholder="+91 98480 00000"
                  value={farmerPhone}
                  onChange={(e) => setFarmerPhone(e.target.value)}
                  className="min-h-[42px] w-full rounded-xl border border-slate-300 px-3 py-2 font-mono text-sm tabular-nums text-slate-900 focus:border-blue-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Village / Shed Location
                </label>
                <input
                  type="text"
                  placeholder="e.g. Siddipet Cluster, Shed 2"
                  value={villageLocation}
                  onChange={(e) => setVillageLocation(e.target.value)}
                  className="min-h-[42px] w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-blue-600 focus:outline-none"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Farmer Email (Optional for automated reports)
                </label>
                <input
                  type="email"
                  placeholder="farmer@poultrymail.com"
                  value={farmerEmail}
                  onChange={(e) => setFarmerEmail(e.target.value)}
                  className="min-h-[42px] w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-blue-600 focus:outline-none"
                />
              </div>
            </div>

            {/* Direct, Unmissable SAVE BUTTON in Section 01 */}
            <div className="mt-5 pt-4 border-t border-slate-200">
              <button
                type="button"
                onClick={handleRecordFarmVisit}
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3.5 px-4 text-sm font-black text-white shadow-md hover:bg-emerald-700 transition-all cursor-pointer active:scale-98"
              >
                <Save className="h-5 w-5" />
                <span>Save Farm Visit Record (+7d Follow-Up Auto-Scheduled)</span>
              </button>

              {validationError && (
                <div className="mt-2.5 rounded-xl border border-red-200 bg-red-50 p-2.5 text-xs font-bold text-red-800 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-red-600 shrink-0" />
                  <span>{validationError}</span>
                </div>
              )}

              {lastSavedVisit && (
                <div className="mt-3 rounded-xl border border-emerald-300 bg-emerald-50 p-3 text-xs text-emerald-950 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 shadow-2xs">
                  <div className="flex items-center gap-2 font-bold">
                    <Check className="h-4 w-4 text-emerald-700 shrink-0" />
                    <span>✓ Record saved for {lastSavedVisit.farmName}! 7d reminder armed.</span>
                  </div>
                  <button
                    type="button"
                    onClick={onNavigateToFollowUps}
                    className="text-xs font-extrabold text-emerald-800 underline hover:text-emerald-950 cursor-pointer text-left sm:text-right"
                  >
                    View in 7-Day CRM →
                  </button>
                </div>
              )}
            </div>
          </section>

          {/* Section 02: Season & Breed Parameters */}
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  02. Seasonal Context &amp; Breed Standards
                </h2>
                <p className="text-xs text-slate-500">
                  Standards dynamically adjust as per chosen breed
                </p>
              </div>
              <span className="text-xs font-bold text-blue-800 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
                {currentBreed}
              </span>
            </div>

            {/* Observed Season Selector */}
            <div className="mt-4">
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Observed Season on Farm
              </label>
              <div className="grid grid-cols-2 gap-1.5 rounded-xl bg-slate-100 p-1 text-xs">
                {(
                  [
                    'Summer / Heat Stress',
                    'Monsoon / Wet Litter',
                    'Winter / Cold Ammonia',
                    'Seasonal Transition',
                  ] as const
                ).map((season) => (
                  <button
                    key={season}
                    type="button"
                    onClick={() => setSeasonObserved(season)}
                    className={`rounded-lg px-2.5 py-2 font-bold transition-all cursor-pointer ${
                      seasonObserved === season
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {season.split(' / ')[0]}
                  </button>
                ))}
              </div>
            </div>

            {/* Bird Type & Breed Selector */}
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Flock Category
                </label>
                <div className="grid grid-cols-2 gap-1 rounded-xl bg-slate-100 p-1">
                  <button
                    type="button"
                    onClick={() => handleBirdTypeChange(BirdType.Broiler)}
                    className={`rounded-lg px-2.5 py-2 text-xs font-bold transition-all cursor-pointer ${
                      birdType === BirdType.Broiler
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Broiler
                  </button>
                  <button
                    type="button"
                    onClick={() => handleBirdTypeChange(BirdType.Layer)}
                    className={`rounded-lg px-2.5 py-2 text-xs font-bold transition-all cursor-pointer ${
                      birdType === BirdType.Layer
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Layer
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {birdType === BirdType.Broiler ? 'Broiler Breed' : 'Layer Breed'}
                </label>
                <select
                  value={birdType === BirdType.Broiler ? broilerBreed : layerBreed}
                  onChange={(e) => {
                    if (birdType === BirdType.Broiler) {
                      setBroilerBreed(e.target.value as BroilerBreed);
                    } else {
                      setLayerBreed(e.target.value as LayerBreed);
                    }
                  }}
                  className="min-h-[42px] w-full rounded-xl border border-blue-300 bg-blue-50/50 px-3 py-2 text-xs font-bold text-blue-900 focus:border-blue-600 focus:outline-none"
                >
                  {birdType === BirdType.Broiler ? (
                    <>
                      <option value="Cobb 500">Cobb 500 (Indian Benchmark)</option>
                      <option value="Ross 308">Ross 308 (High Yield)</option>
                      <option value="Hubbard">Hubbard (Resilient Frame)</option>
                    </>
                  ) : (
                    <>
                      <option value="BV 300">BV 300 (Venkateshwara Indian White)</option>
                      <option value="Hy-Line W-36">Hy-Line W-36 (Efficiency White)</option>
                      <option value="Lohmann White">Lohmann White (High Shell Strength)</option>
                      <option value="Lohmann Brown">Lohmann Brown (Brown Egg Layer)</option>
                    </>
                  )}
                </select>
              </div>
            </div>

            {/* Flock Size, Age, and Observed Performance Inputs */}
            <div className="mt-4 grid grid-cols-1 gap-3.5 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {birdType === BirdType.Broiler
                    ? `Broiler Age (Day 1–56) · Standards for ${broilerBreed}`
                    : `Layer Flock Age (Week 1–72) · Standards for ${layerBreed}`}
                </label>
                <select
                  value={ageValue}
                  onChange={(e) => setAgeValue(Number(e.target.value))}
                  className="min-h-[42px] w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-medium tabular-nums text-slate-900 focus:border-blue-600 focus:outline-none"
                >
                  {birdType === BirdType.Broiler
                    ? Array.from({ length: 56 }, (_, i) => i + 1).map((d) => {
                        const b = getBroilerBenchmark(d, broilerBreed);
                        return (
                          <option key={d} value={d}>
                            Day {d} — {broilerBreed} Target: {b.bw}g · FCR {b.fcr.toFixed(2)}
                          </option>
                        );
                      })
                    : Array.from({ length: 72 }, (_, i) => i + 1).map((w) => {
                        const b = getLayerBenchmark(w, layerBreed);
                        return (
                          <option key={w} value={w}>
                            Week {w} — {layerBreed} Target: {b.bw}g
                            {b.targetEggPct > 0 ? ` · ${b.targetEggPct}% Hen-Day Lay` : ''}
                          </option>
                        );
                      })}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Flock Bird Count
                </label>
                <input
                  type="number"
                  min={100}
                  step={500}
                  value={flockSize}
                  onChange={(e) => setFlockSize(Math.max(1, Number(e.target.value)))}
                  className="min-h-[42px] w-full rounded-xl border border-slate-300 px-3 py-2 text-sm font-mono tabular-nums text-slate-900 focus:border-blue-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Observed Average BW (grams)
                </label>
                <input
                  type="number"
                  min={10}
                  value={observedBW}
                  onChange={(e) => setObservedBW(Math.max(0, Number(e.target.value)))}
                  className="min-h-[42px] w-full rounded-xl border border-slate-300 px-3 py-2 text-sm font-mono tabular-nums text-slate-900 focus:border-blue-600 focus:outline-none"
                />
              </div>

              {birdType === BirdType.Layer && isLayingPhase && (
                <>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Observed Hen-Day Lay %
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      step={0.5}
                      value={observedEggPct}
                      onChange={(e) => setObservedEggPct(Number(e.target.value))}
                      className="min-h-[42px] w-full rounded-xl border border-slate-300 px-3 py-2 text-sm font-mono tabular-nums text-slate-900 focus:border-blue-600 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Egg Farm-Gate Price (₹/egg)
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={20}
                      step={0.1}
                      value={eggPricePerUnit}
                      onChange={(e) => setEggPricePerUnit(Number(e.target.value))}
                      className="min-h-[42px] w-full rounded-xl border border-slate-300 px-3 py-2 text-sm font-mono tabular-nums text-slate-900 focus:border-blue-600 focus:outline-none"
                    />
                  </div>
                </>
              )}
            </div>
          </section>
        </div>

        {/* RIGHT COLUMN: Performance Assessment & Seasonal Diagnostics */}
        <div className="space-y-6 lg:col-span-6">
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  03. Performance Assessment vs {currentBreed} Standard
                </h2>
                <p className="text-xs text-slate-500">
                  {birdType === BirdType.Broiler
                    ? `Day ${ageValue} · Target: ${bwAnalysis.targetBW}g`
                    : `Week ${ageValue} · Target: ${bwAnalysis.targetBW}g (${targetEggPct}% Lay)`}
                </p>
              </div>
              <span
                className={`rounded-full px-2.5 py-0.5 text-xs font-extrabold border ${
                  bwAnalysis.isOptimalOrAbove
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                    : 'bg-amber-50 text-amber-800 border-amber-300'
                }`}
              >
                {bwAnalysis.isOptimalOrAbove ? 'Standard Met' : 'Underweight'}
              </span>
            </div>

            {/* Assessment Cards */}
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
              <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3">
                <p className="text-[11px] font-bold text-slate-500 uppercase">Breed Target</p>
                <p className="mt-1 text-xl font-black text-slate-900 font-mono tabular-nums">
                  {bwAnalysis.targetBW} g
                </p>
                <p className="text-[10px] text-slate-500">{currentBreed}</p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3">
                <p className="text-[11px] font-bold text-slate-500 uppercase">Observed Weight</p>
                <p className="mt-1 text-xl font-black text-slate-900 font-mono tabular-nums">
                  {observedBW} g
                </p>
                <p
                  className={`text-[10px] font-bold ${
                    bwAnalysis.isOptimalOrAbove ? 'text-emerald-700' : 'text-amber-700'
                  }`}
                >
                  {bwAnalysis.achievementPct.toFixed(1)}% of Target
                </p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3 col-span-2 sm:col-span-1">
                <p className="text-[11px] font-bold text-slate-500 uppercase">Weight Deficit</p>
                <p
                  className={`mt-1 text-xl font-black font-mono tabular-nums ${
                    bwAnalysis.isOptimalOrAbove ? 'text-emerald-700' : 'text-red-700'
                  }`}
                >
                  {bwAnalysis.weightDeficitGrams > 0
                    ? `-${bwAnalysis.weightDeficitGrams.toFixed(0)} g`
                    : 'Optimal'}
                </p>
                <p className="text-[10px] text-slate-500">
                  {bwAnalysis.weightDeficitGrams > 0
                    ? `Extra Feed: ~${bwAnalysis.flockExtraFeedKg.toFixed(0)} kg`
                    : 'Target Achieved'}
                </p>
              </div>
            </div>

            {/* Layer Production Economics if Layer in Lay */}
            {birdType === BirdType.Layer && isLayingPhase && (
              <div className="mt-4 rounded-xl border border-blue-200 bg-blue-50/60 p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-blue-950 flex items-center gap-1.5">
                    <Egg className="h-4 w-4 text-blue-700" /> Layer Egg Production Impact ({layerBreed})
                  </span>
                  <span className="rounded bg-blue-200/80 px-2 py-0.5 text-[11px] font-mono font-bold text-blue-900">
                    Observed: {observedEggPct}% vs Target: {targetEggPct}%
                  </span>
                </div>

                {observedEggPct < targetEggPct ? (
                  <div className="pt-1 text-xs text-slate-800 space-y-1">
                    <p className="text-red-800 font-bold">
                      ⚠️ Hen-Day Deficit: -{eggDeficitPct.toFixed(1)}% ({dailyEggDeficit.toLocaleString()} lost eggs/day)
                    </p>
                    <p className="text-slate-700">
                      Estimated Revenue Loss: <strong className="text-red-700 font-mono">₹{dailyFinancialLoss.toLocaleString()}/day</strong> (~₹{monthlyFinancialLoss.toLocaleString()}/month).
                    </p>
                  </div>
                ) : (
                  <p className="text-xs font-bold text-emerald-800">
                    🌟 Exemplary Hen-Day Lay! Flock meets/exceeds {layerBreed} standard benchmark.
                  </p>
                )}
              </div>
            )}

            {/* Seasonal Reasons & Farm Actions */}
            <div className="mt-4 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                  Seasonal Indicators &amp; Actions ({seasonObserved})
                </h3>
                <button
                  type="button"
                  onClick={applySeasonalPreset}
                  className="rounded-lg bg-blue-50 border border-blue-200 px-2.5 py-1 text-[11px] font-bold text-blue-800 hover:bg-blue-100 cursor-pointer shadow-2xs"
                >
                  Load Seasonal Rx Preset
                </button>
              </div>

              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {activeSeasonalReasons.map((reason) => {
                  const checked = selectedReasonIds.includes(reason.id);
                  return (
                    <div
                      key={reason.id}
                      onClick={() => toggleReason(reason.id)}
                      className={`rounded-xl border p-3 cursor-pointer transition-all ${
                        checked
                          ? 'border-blue-500 bg-blue-50/70 shadow-xs'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-start gap-2.5">
                        <div
                          className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                            checked
                              ? 'border-blue-700 bg-blue-700 text-white'
                              : 'border-slate-300 bg-white'
                          }`}
                        >
                          {checked && <Check className="h-3 w-3" />}
                        </div>
                        <div className="flex-1 text-xs">
                          <p className="font-bold text-slate-900">{reason.title}</p>
                          <p className="mt-1 text-[11px] text-slate-600 leading-relaxed">
                            {reason.pathophysiology}
                          </p>
                          <p className="mt-1.5 text-[11px] font-semibold text-emerald-800">
                            Action: {reason.fieldAction}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Field Notes Input */}
            <div className="mt-4 pt-3 border-t border-slate-100">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Field Officer Discussion Notes &amp; Recommendations
              </label>
              <textarea
                rows={2}
                placeholder="Record farm commitments, feed formula observations, and administration timing instructions..."
                value={fieldNotes}
                onChange={(e) => setFieldNotes(e.target.value)}
                className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-900 focus:border-blue-600 focus:outline-none"
              />
            </div>
          </section>
        </div>
      </div>

      {/* FULL-WIDTH SECTION 04:
          USER REQUIREMENT: "allow the Business officer to select the products 1st and down show the cost" */}
      <section className="mt-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-xs">
        <div className="border-b border-slate-100 pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <span className="rounded-full bg-blue-50 px-3 py-1 text-[11px] font-bold text-blue-900 border border-blue-200">
                Step 1: Product Selection &nbsp;➔&nbsp; Step 2: Configured SKU &amp; Cost
              </span>
              <h2 className="mt-2 text-xl font-black text-slate-900 tracking-tight">
                04. Position Specific Products, Select Pack SKUs &amp; Calculate Exact Farmer Cost Per Bird
              </h2>
              <p className="mt-0.5 text-xs text-slate-500">
                Select products from the portfolio below; configured SKU packs and calculated farmer costs appear directly underneath.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500">Selected Products:</span>
              <span className="rounded-full bg-blue-700 px-3 py-0.5 text-xs font-extrabold text-white">
                {calculatedSelectedProducts.length}
              </span>
            </div>
          </div>
        </div>

        {/* STEP 1: PRODUCT SELECTION FIRST */}
        <div className="mt-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-blue-900 flex items-center gap-1.5">
              <Plus className="h-4 w-4 text-blue-700" /> Step 1: Select Virbac Products to Prescribe
            </h3>
            <span className="text-xs text-slate-500">
              Showing {filteredCatalog.length} products
            </span>
          </div>

          {/* Search & Category Filter */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="search"
                placeholder="Search products by brand (e.g. Vimeral, Brotone, Calgophos, Kalzol)..."
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                className="min-h-[42px] w-full rounded-xl border border-slate-300 bg-white pl-9 pr-3 py-2 text-xs sm:text-sm text-slate-900 focus:border-blue-600 focus:outline-none"
              />
            </div>
            <select
              value={productCategoryFilter}
              onChange={(e) => setProductCategoryFilter(e.target.value)}
              className="min-h-[42px] rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-800 focus:border-blue-600 focus:outline-none"
            >
              {productCategories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat === 'ALL' ? 'All Portfolio Categories' : cat}
                </option>
              ))}
            </select>
          </div>

          {/* Product Cards Grid */}
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 max-h-[440px] overflow-y-auto pr-1">
            {filteredCatalog.map((prod) => {
              const isSelected = Boolean(selectedPlans[prod.id]);
              return (
                <div
                  key={prod.id}
                  onClick={() => toggleProduct(prod)}
                  className={`flex flex-col justify-between rounded-2xl border p-3.5 cursor-pointer transition-all ${
                    isSelected
                      ? 'border-blue-600 bg-blue-50/50 shadow-sm ring-1 ring-blue-600'
                      : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-xs'
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-1.5">
                      <div>
                        <span className="text-[10px] font-bold text-slate-500 uppercase">
                          {prod.category}
                        </span>
                        <h4 className="text-sm font-black text-slate-900">{prod.name}</h4>
                      </div>
                      <div
                        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border ${
                          isSelected
                            ? 'border-blue-700 bg-blue-700 text-white'
                            : 'border-slate-300 bg-white'
                        }`}
                      >
                        {isSelected && <Check className="h-3.5 w-3.5" />}
                      </div>
                    </div>

                    <p className="mt-1 text-[11px] font-semibold text-blue-900 italic line-clamp-1">
                      "{prod.positioning}"
                    </p>

                    <p className="mt-1 text-[11px] text-slate-600 line-clamp-2">
                      <strong>Comp:</strong> {prod.composition}
                    </p>
                  </div>

                  <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                    <span className="text-slate-500 font-mono">
                      Std: {prod.standardDose} {prod.doseUnit}
                    </span>
                    <span
                      className={`font-bold ${
                        isSelected ? 'text-blue-700' : 'text-slate-700'
                      }`}
                    >
                      {isSelected ? '✓ Selected' : '+ Select Product'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* STEP 2: DOWN SHOW THE COST & CONFIGURED SKU TABLE */}
        <div className="mt-8 pt-6 border-t-2 border-slate-100">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
            <div>
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-emerald-900 flex items-center gap-1.5">
                <ArrowDown className="h-4 w-4 text-emerald-700" /> Step 2: Configured SKUs, Dosages &amp; Calculated Farmer Cost Per Bird
              </h3>
              <p className="text-xs text-slate-500">
                Configure pack SKUs, course duration, and analyze exact per-bird and commercial pack economics.
              </p>
            </div>
            <div className="text-xs font-bold text-slate-600">
              Active Pricing: <span className="font-mono text-blue-900 uppercase">{pricingMode}</span>
            </div>
          </div>

          {calculatedSelectedProducts.length > 0 ? (
            <div className="space-y-4">
              <div className="overflow-x-auto rounded-2xl border border-slate-200">
                <table className="w-full border-collapse text-left text-xs">
                  <thead className="bg-slate-100 text-slate-800">
                    <tr>
                      <th className="px-3.5 py-3 font-bold">Positioned Product</th>
                      <th className="px-3 py-3 font-bold">Selected SKU Pack (from Catalog)</th>
                      <th className="px-3 py-3 text-right font-bold">Dose Rate</th>
                      <th className="px-3 py-3 text-right font-bold">Days</th>
                      <th className="px-3 py-3 text-right font-bold">Flock Quantity</th>
                      <th className="px-3 py-3 text-right font-bold">Packs</th>
                      <th className="px-3 py-3 text-right font-bold">Pack {pricingMode.toUpperCase()} (₹)</th>
                      <th className="px-3.5 py-3 text-right font-bold text-emerald-800">
                        Farmer Cost / Bird ({officerProfile.currencySymbol})
                      </th>
                      <th className="no-print px-3 py-3 text-center font-bold">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 bg-white">
                    {calculatedSelectedProducts.map((item) => (
                      <tr key={item.product.id} className="hover:bg-slate-50/80">
                        <td className="px-3.5 py-3">
                          <p className="font-bold text-slate-900">{item.product.name}</p>
                          <p className="text-[11px] text-slate-500 line-clamp-1">
                            {item.product.positioning}
                          </p>
                        </td>

                        <td className="px-3 py-3">
                          <select
                            aria-label={`SKU for ${item.product.name}`}
                            value={item.sku.code}
                            onChange={(e) =>
                              updateProductPlan(item.product.id, { selectedSkuCode: e.target.value })
                            }
                            className="rounded-lg border border-slate-300 bg-white px-2 py-1 font-mono text-xs tabular-nums text-slate-900"
                          >
                            {item.product.skus.map((s) => (
                              <option key={s.code} value={s.code}>
                                {s.packName} — Code: {s.code} (MRP ₹{s.mrp} | PTR ₹{s.ptr})
                              </option>
                            ))}
                          </select>
                        </td>

                        <td className="px-3 py-3 text-right">
                          <div className="inline-flex items-center gap-1">
                            <input
                              type="number"
                              min={0.1}
                              step={0.5}
                              aria-label={`Dose for ${item.product.name}`}
                              value={item.doseRate}
                              onChange={(e) =>
                                updateProductPlan(item.product.id, {
                                  customDose: Math.max(0.1, Number(e.target.value)),
                                })
                              }
                              className="w-16 rounded-lg border border-slate-300 px-1.5 py-1 text-right font-mono text-xs tabular-nums"
                            />
                            <span className="text-[10px] text-slate-500 whitespace-nowrap">
                              {item.product.doseUnit}/
                              {item.product.dosageBasis === 'per_100_birds'
                                ? '100b'
                                : item.product.dosageBasis === 'per_1000_birds'
                                ? '1000b'
                                : 'L'}
                            </span>
                          </div>
                        </td>

                        <td className="px-3 py-3 text-right">
                          <input
                            type="number"
                            min={1}
                            max={30}
                            aria-label={`Days for ${item.product.name}`}
                            value={item.days}
                            onChange={(e) =>
                              updateProductPlan(item.product.id, {
                                days: Math.max(1, Number(e.target.value)),
                              })
                            }
                            className="w-14 rounded-lg border border-slate-300 px-1.5 py-1 text-right font-mono text-xs tabular-nums"
                          />
                        </td>

                        <td className="px-3 py-3 text-right font-mono font-medium text-slate-800 tabular-nums">
                          {formatQuantity(item.totalQuantity, item.product.doseUnit)}
                        </td>

                        <td className="px-3 py-3 text-right font-mono text-slate-700 tabular-nums">
                          {item.packsRounded} × {item.sku.packName}
                        </td>

                        <td className="px-3 py-3 text-right font-mono text-slate-900 tabular-nums">
                          {pricingMode === 'mrp'
                            ? `₹${item.commercialPackCostMrp.toFixed(0)}`
                            : `₹${item.commercialPackCostPtr.toFixed(0)}`}
                          <span className="block text-[10px] text-slate-500">
                            Unit: {pricingMode === 'mrp' ? `₹${item.sku.mrp}` : `₹${item.sku.ptr}`}
                          </span>
                        </td>

                        <td className="px-3.5 py-3 text-right font-mono text-sm font-black text-emerald-700 tabular-nums">
                          {officerProfile.currencySymbol}
                          {(pricingMode === 'mrp'
                            ? item.costPerBirdExactMrp
                            : item.costPerBirdExactPtr
                          ).toFixed(2)}
                          <span className="block text-[10px] font-normal text-slate-500">
                            {officerProfile.currencySymbol}
                            {item.costPerBirdPerDay.toFixed(2)}/bird/day
                          </span>
                        </td>

                        <td className="no-print px-3 py-3 text-center">
                          <button
                            type="button"
                            onClick={() => toggleProduct(item.product)}
                            className="rounded-lg p-1 text-slate-400 hover:text-red-700 hover:bg-red-50 cursor-pointer"
                            title="Remove product"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* High-Impact Economics Summary Banner */}
              <div className="flex flex-col justify-between gap-4 rounded-2xl border border-slate-200 bg-slate-900 p-5 text-white sm:flex-row sm:items-center shadow-md">
                <div>
                  <p className="text-xs text-slate-400 uppercase tracking-wider font-bold">
                    Farmer Investment Overview
                  </p>
                  <p className="mt-1 text-sm text-slate-200">
                    Flock: <strong className="text-white">{flockSize.toLocaleString()} {currentBreed} {birdType}</strong> birds · {calculatedSelectedProducts.length} Virbac Products
                  </p>
                  <p className="text-xs text-slate-300">
                    Commercial Pack Purchase Value ({pricingMode.toUpperCase()}):{' '}
                    <strong className="font-mono text-white tabular-nums">
                      {officerProfile.currencySymbol}
                      {totalCommercialPackCost.toFixed(0)}
                    </strong>
                  </p>
                </div>

                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <p className="text-[11px] text-slate-400 font-bold uppercase">
                      Net Dosage Cost / Bird
                    </p>
                    <p className="font-mono text-2xl sm:text-3xl font-black text-emerald-400 tabular-nums">
                      {officerProfile.currencySymbol}
                      {totalCostPerBirdExact.toFixed(2)}
                    </p>
                    <p className="text-[10px] text-slate-400">per bird total course</p>
                  </div>

                  <div className="text-right border-l border-slate-700 pl-6">
                    <p className="text-[11px] text-slate-400 font-bold uppercase">
                      Pack Cost / Bird
                    </p>
                    <p className="font-mono text-lg font-bold text-slate-200 tabular-nums">
                      {officerProfile.currencySymbol}
                      {totalCostPerBirdPack.toFixed(2)}
                    </p>
                    <p className="text-[10px] text-slate-400">including buffer stock</p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-300 p-8 text-center bg-slate-50/50">
              <p className="text-sm font-bold text-slate-700">No products positioned yet.</p>
              <p className="mt-1 text-xs text-slate-500">
                Click "+ Select Product" on any card in Step 1 above to add it to the prescription and calculate exact farmer costs.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* STICKY MOBILE BOTTOM BAR FOR BUSINESS OFFICER IN THE FIELD */}
      <div className="fixed bottom-0 left-0 right-0 z-30 border-t border-slate-200 bg-white/95 backdrop-blur-md px-4 py-2.5 shadow-lg sm:hidden">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-bold text-slate-900">
              {farmName || farmerName || 'Farm Visit'}
            </p>
            <p className="text-[11px] font-mono text-emerald-700 font-bold">
              {officerProfile.currencySymbol}
              {totalCostPerBirdExact.toFixed(2)}/bird ({calculatedSelectedProducts.length} Rx)
            </p>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={handleRecordFarmVisit}
              className="rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-black text-white shadow-xs active:scale-95 cursor-pointer flex items-center gap-1"
            >
              <Save className="h-4 w-4" />
              <span>Save Record</span>
            </button>
            <button
              type="button"
              onClick={() => setIsPrintModalOpen(true)}
              className="rounded-xl border border-slate-300 bg-slate-100 p-2 text-slate-700 hover:bg-slate-200 cursor-pointer"
              title="Print"
            >
              <Printer className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Printable Farmer Advisory & Prescription Modal */}
      <PrintFarmerReportModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        visit={currentLiveVisit}
        officerProfile={officerProfile}
      />
    </div>
  );
};
