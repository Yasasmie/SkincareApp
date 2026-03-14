// services/diseaseRoutineService.ts

export type SkincareRoutine = {
  phase: "morning" | "evening" | "weekly";
  steps: string[];
};

export type DiseaseRecommendation = {
  disease: string;
  severity: "low" | "medium" | "high";
  description: string;
  routines: SkincareRoutine[];
  avoid: string[];
  tips: string[];
  consult: boolean; // should user consult a dermatologist?
};

const CONDITION_ALIASES: Record<string, string> = {
  acne: "acne",
  pimples: "acne",
  pimple: "acne",
  breakout: "acne",
  breakouts: "acne",
  dry: "dry",
  dryness: "dry",
  dryskin: "dry",
  oily: "oily",
  oiliness: "oily",
  oilyskin: "oily",
  wrinkle: "wrinkles",
  wrinkles: "wrinkles",
  fine_line: "wrinkles",
  fine_lines: "wrinkles",
  fineline: "wrinkles",
  finelines: "wrinkles",
  darkspot: "darkspots",
  darkspots: "darkspots",
  dark_spot: "darkspots",
  dark_spots: "darkspots",
  hyperpigmentation: "darkspots",
  blackhead: "blackheads",
  blackheads: "blackheads",
  black_head: "blackheads",
  black_heads: "blackheads",
  normal: "normal",
  healthy: "healthy",
  healthyskin: "healthy",
};

// Comprehensive disease-to-routine mapping
const DISEASE_RECOMMENDATIONS: Record<string, DiseaseRecommendation> = {
  // Acne
  acne: {
    disease: "Acne",
    severity: "medium",
    description:
      "Inflammatory skin condition characterized by pimples and breakouts",
    routines: [
      {
        phase: "morning",
        steps: [
          "Rinse face with lukewarm water",
          "Use salicylic acid cleanser (0.5-2%)",
          "Apply benzoyl peroxide spot treatment (2.5%)",
          "Use oil-free, non-comedogenic moisturizer",
          "Apply sunscreen SPF 30+",
        ],
      },
      {
        phase: "evening",
        steps: [
          "Remove makeup with gentle cleanser",
          "Use salicylic acid or glycolic acid toner",
          "Apply retinoid treatment (start 2-3x/week)",
          "Apply lightweight moisturizer",
          "Spot treat with benzoyl peroxide if needed",
        ],
      },
      {
        phase: "weekly",
        steps: [
          "Use gentle exfoliating scrub 1-2x",
          "Apply clay mask once weekly",
          "Do not over-exfoliate; avoid harsh scrubs",
        ],
      },
    ],
    avoid: [
      "Heavy oils",
      "Comedogenic products",
      "Touching face frequently",
      "Stress",
    ],
    tips: [
      "Keep pillowcase clean; change 2-3x/week",
      "Avoid pore-clogging makeup",
      "Drink plenty of water",
      "Reduce dairy and high-glycemic foods",
    ],
    consult: true,
  },

  // Eczema
  eczema: {
    disease: "Eczema",
    severity: "high",
    description:
      "Chronic inflammatory condition causing itching and dry patches",
    routines: [
      {
        phase: "morning",
        steps: [
          "Wash with lukewarm water (avoid hot water)",
          "Use fragrance-free, gentle cleanser",
          "Pat skin dry gently (leave slightly damp)",
          "Apply thick moisturizing cream or ointment",
          "Use mineral sunscreen SPF 30+",
        ],
      },
      {
        phase: "evening",
        steps: [
          "Remove makeup gently with oil-based cleanser",
          "Wash with lukewarm water and gentle cleanser",
          "Apply thick moisturizer or prescribed eczema cream",
          "Consider applying occlusive layer (vaseline)",
          "Apply prescribed steroid cream if needed",
        ],
      },
      {
        phase: "weekly",
        steps: [
          "Gentle oat-based bath or soak (10-15 min)",
          "Apply thick moisturizer immediately after",
          "Avoid over-bathing; reduces natural oils",
        ],
      },
    ],
    avoid: [
      "Alcohol-based products",
      "Fragrances",
      "Hot water",
      "Harsh soaps",
      "Stress",
    ],
    tips: [
      "Use humidifier in dry environments",
      "Wear soft, breathable fabrics",
      "Manage stress through meditation/yoga",
      "Identify and avoid personal triggers",
      "Keep nails short to prevent scratching",
    ],
    consult: true,
  },

  // Psoriasis
  psoriasis: {
    disease: "Psoriasis",
    severity: "high",
    description: "Autoimmune condition causing thick, scaly patches",
    routines: [
      {
        phase: "morning",
        steps: [
          "Shower with lukewarm water",
          "Use moisturizing, fragrance-free cleanser",
          "Gently remove scales with soft brush",
          "Apply prescribed topical steroid if needed",
          "Use heavy-duty moisturizer",
          "Apply sunscreen SPF 50+",
        ],
      },
      {
        phase: "evening",
        steps: [
          "Soak affected areas in lukewarm water with oils",
          "Gently soften and remove scales",
          "Apply prescribed medicated cream/ointment",
          "Apply thick barrier moisturizer",
          "Cover with soft cotton clothing",
        ],
      },
      {
        phase: "weekly",
        steps: [
          "Use salicylic acid ointment to soften scales",
          "Gentle exfoliation with soft cloth",
          "Deep moisturizing treatment/mask",
          "Consider coal tar treatment (consult doctor)",
        ],
      },
    ],
    avoid: ["Stress", "Infections", "Alcohol", "Smoking", "Cold weather"],
    tips: [
      "Maintain humidity in living space",
      "Manage stress actively",
      "Get moderate sun exposure (15-20 min/day)",
      "Avoid skin injuries and irritation",
      "Keep skin moisturized constantly",
    ],
    consult: true,
  },

  // Rosacea
  rosacea: {
    disease: "Rosacea",
    severity: "medium",
    description: "Chronic condition causing facial redness and inflammation",
    routines: [
      {
        phase: "morning",
        steps: [
          "Rinse with cool (not cold) water",
          "Use gentle, non-stripping cleanser",
          "Pat dry gently",
          "Apply soothing, fragrance-free toner",
          "Apply lightweight, calming moisturizer",
          "Use mineral sunscreen SPF 30+ (avoid physical trauma)",
        ],
      },
      {
        phase: "evening",
        steps: [
          "Remove makeup with gentle oil cleanser",
          "Rinse with cool water",
          "Apply soothing toner or essence",
          "Use calming serum (niacinamide, azelaic acid)",
          "Apply fragrance-free moisturizer",
          "Consider prescribed topical metronidazole if prescribed",
        ],
      },
      {
        phase: "weekly",
        steps: [
          "Use gentle PHA exfoliant 1x/week",
          "Apply soothing mask (oat-based, centella)",
          "Avoid harsh scrubs and strong treatments",
        ],
      },
    ],
    avoid: [
      "Hot water",
      "Spicy foods",
      "Alcohol",
      "Extreme temperatures",
      "Harsh products",
    ],
    tips: [
      "Identify personal triggers (food, weather, stress)",
      "Use cooling techniques (cool compresses)",
      "Avoid dramatic temperature changes",
      "Use azelaic acid 15-20%",
      "Protect from sun consistently",
    ],
    consult: true,
  },

  // Melasma
  melasma: {
    disease: "Melasma",
    severity: "low",
    description: "Hyperpigmentation disorder causing brown/gray patches",
    routines: [
      {
        phase: "morning",
        steps: [
          "Use gentle, pH-balanced cleanser",
          "Apply vitamin C serum (15-20% L-ascorbic acid)",
          "Apply lightweight moisturizer",
          "Use broad-spectrum sunscreen SPF 50+ (essential)",
          "Consider using mineral sunscreen with iron oxides",
        ],
      },
      {
        phase: "evening",
        steps: [
          "Use gentle cleanser",
          "Apply hydrating toner",
          "Use hydroquinone 4% OR tretinoin (prescribed)",
          "Apply niacinamide serum",
          "Use moisturizer with peptides",
        ],
      },
      {
        phase: "weekly",
        steps: [
          "Use gentle chemical exfoliant (AHA/BHA)",
          "Apply brightening mask with kojic acid",
          "Hydrating treatment",
        ],
      },
    ],
    avoid: [
      "Sun exposure",
      "Oral contraceptives (if possible)",
      "Irritating products",
      "Heat",
    ],
    tips: [
      "Daily SPF 50+ is CRITICAL",
      "Reapply sunscreen every 2 hours",
      "Wear protective clothing outdoors",
      "Use physical blockers (hats, sunglasses)",
      "Combine treatments: Hydroquinone + Tretinoin + Vitamin C",
    ],
    consult: true,
  },

  // Dermatitis / Contact Dermatitis
  dermatitis: {
    disease: "Contact Dermatitis",
    severity: "medium",
    description: "Allergic or irritant reaction causing itching and redness",
    routines: [
      {
        phase: "morning",
        steps: [
          "Rinse with lukewarm water only (avoid cleanser initially)",
          "Pat dry gently",
          "Apply prescribed steroid cream if needed",
          "Use hypoallergenic moisturizer",
          "Apply sunscreen (hypoallergenic, fragrance-free)",
        ],
      },
      {
        phase: "evening",
        steps: [
          "Rinse with cool water",
          "Pat dry gently",
          "Apply antihistamine or prescribed ointment",
          "Apply barrier repair moisturizer",
          "Avoid scratching (wear cotton gloves if needed)",
        ],
      },
      {
        phase: "weekly",
        steps: [
          "No exfoliation during active dermatitis",
          "Do not use any products except prescribed treatments",
          "Focus on barrier repair",
        ],
      },
    ],
    avoid: [
      "Known allergen",
      "Fragrances",
      "Dyes",
      "Harsh fabrics",
      "Hot water",
    ],
    tips: [
      "Identify and eliminate the causative agent",
      "Wear soft, hypoallergenic gloves when cleaning",
      "Use fragrance-free, hypoallergenic products exclusively",
      "Keep nails short to prevent scratching",
      "Consider allergy testing",
    ],
    consult: true,
  },

  // Warts
  warts: {
    disease: "Warts",
    severity: "low",
    description: "Viral skin growth caused by HPV infection",
    routines: [
      {
        phase: "morning",
        steps: [
          "Wash with gentle soap",
          "Keep area clean and dry",
          "Apply salicylic acid treatment (12-17%)",
          "Cover if needed",
          "Apply moisturizer to surrounding skin",
        ],
      },
      {
        phase: "evening",
        steps: [
          "Soak wart in warm water for 10-15 minutes",
          "Gently file with pumice or emery board",
          "Apply salicylic acid patch or liquid",
          "Cover with bandage",
          "Keep area mosit overnight",
        ],
      },
      {
        phase: "weekly",
        steps: [
          "Consider cryotherapy or laser treatment",
          "Keep consistent with daily treatment",
          "Monitor for new warts",
        ],
      },
    ],
    avoid: [
      "Picking at wart",
      "Sharing towels",
      "Public pools",
      "Spreads to other areas",
    ],
    tips: [
      "Warts are contagious; avoid spreading",
      "Self-treatment takes 8-12 weeks",
      "Professional removal more effective",
      "Boost immune system (vitamin C, sleep)",
      "Avoid cuts or injuries to wart area",
    ],
    consult: false,
  },

  // Vitiligo
  vitiligo: {
    disease: "Vitiligo",
    severity: "high",
    description: "Depigmentation disorder causing white patches on skin",
    routines: [
      {
        phase: "morning",
        steps: [
          "Use gentle cleanser",
          "Apply prescribed topical steroid to patches",
          "Apply broad-spectrum sunscreen SPF 50+ to white patches",
          "Consider makeup to cover patches if desired",
          "Use moisturizer",
        ],
      },
      {
        phase: "evening",
        steps: [
          "Use gentle cleanser",
          "Apply prescribed topical steroid or calcineurin inhibitor",
          "Apply nourishing moisturizer",
          "Keep patches moisturized",
        ],
      },
      {
        phase: "weekly",
        steps: [
          "Gentle exfoliation on unaffected areas only",
          "Deep moisturizing treatment",
          "Monitor for new depigmented areas",
          "Consider phototherapy (consult dermatologist)",
        ],
      },
    ],
    avoid: [
      "Sun exposure on patches",
      "Skin trauma",
      "Stress",
      "Certain foods",
    ],
    tips: [
      "Religiously protect white patches from sun",
      "Manage stress through counseling or meditation",
      "Consider phototherapy options (PUVA, NB-UVB)",
      "Topical treatments work best on face",
      "Cosmetic solutions available (camouflage makeup)",
    ],
    consult: true,
  },

  // Sunburn
  sunburn: {
    disease: "Sunburn",
    severity: "low",
    description: "UV-induced skin damage causing redness and pain",
    routines: [
      {
        phase: "morning",
        steps: [
          "Rinse with cool (not cold) water",
          "Apply aloe vera gel liberally",
          "Use lightweight, fragrance-free moisturizer",
          "Avoid makeup if possible",
          "Wear protective clothing",
          "Reapply aloe every 3 hours",
        ],
      },
      {
        phase: "evening",
        steps: [
          "Apply cool compress for 10-15 minutes",
          "Apply aloe vera or hydrocortisone 1% cream",
          "Take ibuprofen if needed",
          "Drink plenty of water",
          "Avoid further sun exposure",
        ],
      },
      {
        phase: "weekly",
        steps: [
          "Gently exfoliate peeling skin once healing starts",
          "Continue moisturizing",
          "Prevent future burns with prevention",
        ],
      },
    ],
    avoid: [
      "Further sun exposure",
      "Hot water",
      "Tight clothing",
      "Petroleum products",
    ],
    tips: [
      "Sunburn recovery takes 7-10 days",
      "Prevention is critical; use SPF 30+",
      "Reapply sunscreen every 2 hours",
      "Wear UV-protective clothing",
      "Avoid peak sun hours (10am-4pm)",
    ],
    consult: false,
  },

  // Healthy Skin (No conditions detected)
  healthy: {
    disease: "Healthy Skin",
    severity: "low",
    description: "No major skin conditions detected. Focus on maintenance.",
    routines: [
      {
        phase: "morning",
        steps: [
          "Cleanse with gentle, pH-balanced cleanser",
          "Apply hydrating toner",
          "Use lightweight moisturizer",
          "Apply sunscreen SPF 30+ (non-negotiable)",
          "Optional: Use vitamin serum or light treatment",
        ],
      },
      {
        phase: "evening",
        steps: [
          "Remove makeup gently with micellar water",
          "Cleanse with gentle cleanser",
          "Apply toner or essence",
          "Use nourishing night moisturizer",
          "Optional: Retinol or antioxidant serum 2-3x/week",
        ],
      },
      {
        phase: "weekly",
        steps: [
          "Gentle exfoliation 1-2x (chemical or manual)",
          "Hydrating or brightening mask",
          "Deep cleansing treatment",
        ],
      },
    ],
    avoid: [
      "Excessive sun exposure",
      "Harsh products",
      "Overwashing",
      "Smoking",
      "Dehydration",
    ],
    tips: [
      "Consistency is key; maintain routine",
      "Always use SPF during the day",
      "Hydration is essential",
      "Get enough sleep (7-9 hours)",
      "Eat antioxidant-rich foods",
    ],
    consult: false,
  },

  // Skin Types (Oily, Dry, Combination, Normal, Sensitive)
  oily: {
    disease: "Oily Skin",
    severity: "low",
    description:
      "Excess sebum (oil) production leading to shiny appearance and potential breakouts.",
    routines: [
      {
        phase: "morning",
        steps: [
          "Cleanse with oil-control gel or foam cleanser",
          "Apply mattifying toner (preferably with salicylic acid 0.5-2%)",
          "Use lightweight, oil-free moisturizer",
          "Apply matte sunscreen SPF 30+ (oil-free formula)",
          "Optional: Apply blotting paper after cleansing",
        ],
      },
      {
        phase: "evening",
        steps: [
          "Double cleanse: oil cleanser first, then gel/foam cleanser",
          "Apply clarifying toner",
          "Use lightweight gel moisturizer",
          "Optional: Apply lightweight acne treatment (benzoyl peroxide or niacinamide)",
        ],
      },
      {
        phase: "weekly",
        steps: [
          "Clay mask or charcoal mask (1-2x weekly)",
          "Gentle exfoliation with salicylic acid (1-2x weekly)",
          "Oil-control sheet mask",
        ],
      },
    ],
    avoid: [
      "Heavy, occlusive moisturizers",
      "Oil-based products",
      "Comedogenic (pore-clogging) products",
      "Excess heat exposure",
      "Touching your face frequently",
    ],
    tips: [
      "Use blotting papers throughout the day",
      "Avoid heavy makeup; use gel or powder formulas",
      "Keep skin hydrated with lightweight moisturizers (dehydration causes more oil)",
      "Reduce dairy and high-glycemic foods",
      "Wash face 2-3 times daily with lukewarm water",
    ],
    consult: false,
  },

  dry: {
    disease: "Dry Skin",
    severity: "medium",
    description:
      "Insufficient moisture retention leading to flaking, tightness, and discomfort.",
    routines: [
      {
        phase: "morning",
        steps: [
          "Gentle creamy cleanser (avoid stripping)",
          "Apply hydrating toner or essence",
          "Use rich, nourishing moisturizer with hyaluronic acid or ceramides",
          "Apply sunscreen SPF 30+ (moisturizing formula)",
          "Optional: Apply facial oil on top of moisturizer",
        ],
      },
      {
        phase: "evening",
        steps: [
          "Use gentle micellar water or cream cleanser",
          "Apply hydrating toner",
          "Use intensive night cream or moisturizer",
          "Apply facial oil or serum (squalane, rosehip, jojoba)",
        ],
      },
      {
        phase: "weekly",
        steps: [
          "Hydrating sheet mask (2-3x weekly)",
          "Gentle exfoliation with enzyme-based exfoliant (1x weekly)",
          "Rich, nourishing peel-off mask",
        ],
      },
    ],
    avoid: [
      "Hot water (use lukewarm)",
      "Harsh, stripping cleansers",
      "Excessive exfoliation",
      "Alcohol-based products",
      "Prolonged sun exposure without SPF",
    ],
    tips: [
      "Hydrate internally; drink plenty of water",
      "Use a humidifier in indoor spaces",
      "Apply moisturizer to damp skin for better absorption",
      "Layer hydrating products (toner → serum → moisturizer)",
      "Avoid overheating with hot showers",
      "Increase omega-3 intake from fish, nuts, seeds",
    ],
    consult: false,
  },

  combination: {
    disease: "Combination Skin",
    severity: "low",
    description:
      "Mix of oily and dry areas, typically oily T-zone and dry cheeks.",
    routines: [
      {
        phase: "morning",
        steps: [
          "Gentle, pH-balanced cleanser (not too harsh or moisturizing)",
          "Apply lightweight hydrating toner",
          "Use lightweight moisturizer; apply more on dry areas",
          "Apply matte sunscreen SPF 30+",
          "Optional: Use blotting papers on T-zone after application",
        ],
      },
      {
        phase: "evening",
        steps: [
          "Gentle cleanse (micellar water or light cleanser)",
          "Apply balancing toner",
          "Use lightweight moisturizer (adjust amounts by zone)",
          "Optional: Apply heavier moisturizer on dry areas only",
        ],
      },
      {
        phase: "weekly",
        steps: [
          "Use targeted masks: clay for T-zone, hydrating for cheeks (2-3x weekly)",
          "Gentle exfoliation with AHA/BHA (1-2x weekly)",
          "Balancing or clarifying mask",
        ],
      },
    ],
    avoid: [
      "One-size-fits-all heavy products",
      "Overly stripping or over-moisturizing",
      "Skipping moisturizer on any area",
      "Mixing too many actives",
      "Heavy makeup",
    ],
    tips: [
      "Treat different zones differently",
      "Use a lightweight moisturizer as base for all zones",
      "Add extra moisturizer or oil to dry areas only",
      "Use blotting papers on oily zones without over-washing",
      "Balance water and oil with mid-weight products",
      "Maintain consistent hydration",
    ],
    consult: false,
  },

  normal: {
    disease: "Normal Skin",
    severity: "low",
    description:
      "Well-balanced moisture and oil production with minimal issues.",
    routines: [
      {
        phase: "morning",
        steps: [
          "Gentle cleanser (water-based or lightweight)",
          "Apply hydrating toner or essence",
          "Use lightweight to medium moisturizer",
          "Apply sunscreen SPF 30+",
          "Optional: Add brightening serum",
        ],
      },
      {
        phase: "evening",
        steps: [
          "Gentle cleanse",
          "Apply toner or essence",
          "Use nourishing moisturizer",
          "Optional: Apply lightweight treatment serum (vitamin C, niacinamide)",
        ],
      },
      {
        phase: "weekly",
        steps: [
          "Regular exfoliation (1-2x weekly, mechanical or chemical)",
          "Hydrating or nourishing mask",
          "Optional: Targeted treatment as needed",
        ],
      },
    ],
    avoid: [
      "Overly harsh products",
      "Excessive actives",
      "Skipping sunscreen",
      "Dehydration",
      "Inconsistent routines",
    ],
    tips: [
      "Maintain a consistent routine",
      "Always use SPF during the day",
      "Keep skin hydrated",
      "Get adequate sleep",
      "Eat balanced, antioxidant-rich diet",
      "Manage stress for skin health",
    ],
    consult: false,
  },

  sensitive: {
    disease: "Sensitive Skin",
    severity: "high",
    description:
      "Reactive skin prone to irritation, redness, and inflammation from various triggers.",
    routines: [
      {
        phase: "morning",
        steps: [
          "Cleanse with hypoallergenic, fragrance-free, gentle cleanser",
          "Apply soothing toner (preferably with centella asiatica or aloe vera)",
          "Use hypoallergenic moisturizer with calming ingredients (ceramides, niacinamide)",
          "Apply mineral or physical sunscreen SPF 30+ (zinc oxide/titanium dioxide)",
          "Avoid any actives in the morning",
        ],
      },
      {
        phase: "evening",
        steps: [
          "Gentle cream or micellar cleanser",
          "Apply soothing, hydrating toner",
          "Use rich, hypoallergenic moisturizer",
          "Optional: Apply soothing serum (centella, panthenol) if irritated",
        ],
      },
      {
        phase: "weekly",
        steps: [
          "Gentle hydrating mask (1x weekly if tolerated)",
          "Avoid exfoliation or use very gentle physical exfoliation (1x every 2 weeks)",
          "Soothing, calming treatment mask",
        ],
      },
    ],
    avoid: [
      "Fragrance (natural or synthetic)",
      "Essential oils",
      "Strong actives (high % retinol, strong acids)",
      "Physical exfoliation",
      "Hot water",
      "Products with alcohol or sulfates",
      "Multiple actives combined",
    ],
    tips: [
      "Do a patch test before trying new products (24-48 hours)",
      "Introduce one new product at a time, spacing 2 weeks apart",
      "Keep routine simple and minimal",
      "Use fragrance-free, dermatologist-recommended products",
      "Always patch test new sunscreen",
      "Keep a skincare diary to identify triggers",
      "Consider gentle probiotics for skin barrier support",
    ],
    consult: true,
  },

  wrinkles: {
    disease: "Wrinkles & Fine Lines",
    severity: "low",
    description:
      "Fine lines and wrinkles caused by aging, sun exposure, and loss of collagen elasticity.",
    routines: [
      {
        phase: "morning",
        steps: [
          "Gentle cleanser (avoid harsh soaps)",
          "Apply hydrating toner",
          "Apply vitamin C serum (15-20% concentration)",
          "Use rich, collagen-boosting moisturizer",
          "Apply sunscreen SPF 50+ (essential for prevention)",
        ],
      },
      {
        phase: "evening",
        steps: [
          "Gentle cleanser",
          "Apply retinol treatment (0.3-0.5% for beginners, increase gradually)",
          "Use peptide-rich serum or eye cream",
          "Apply nourishing night cream",
          "Optional: Apply eye cream with retinol around orbital area",
        ],
      },
      {
        phase: "weekly",
        steps: [
          "Hydrating or nourishing mask (2x weekly)",
          "Gentle exfoliation with AHA/BHA (1x weekly)",
          "Collagen-boosting sheet mask",
        ],
      },
    ],
    avoid: [
      "Excessive sun exposure without SPF",
      "Smoking and alcohol",
      "Dehydration",
      "Harsh products",
      "Sleeping on your face",
    ],
    tips: [
      "Use broad-spectrum SPF 50+ daily (most important)",
      "Stay hydrated internally",
      "Use retinol consistently (2-3x weekly, gradually increase)",
      "Apply moisturizer to damp skin for better absorption",
      "Sleep 7-9 hours for skin regeneration",
      "Eat collagen-boosting foods (citrus, berries, fish)",
      "Use facial massage to improve blood circulation",
    ],
    consult: false,
  },

  pores: {
    disease: "Large Pores",
    severity: "low",
    description:
      "Enlarged pores often caused by excess oil production or loss of skin elasticity.",
    routines: [
      {
        phase: "morning",
        steps: [
          "Cleanse with salicylic acid cleanser (0.5-2%)",
          "Apply pore-minimizing toner with niacinamide (4-5%)",
          "Use lightweight, non-comedogenic moisturizer",
          "Apply pore-refining primer (optional for makeup)",
          "Apply matte sunscreen SPF 30+",
        ],
      },
      {
        phase: "evening",
        steps: [
          "Double cleanse: oil cleanser then gel cleanser",
          "Apply clarifying toner",
          "Use niacinamide serum (4-5%)",
          "Apply lightweight hydrating moisturizer",
          "Optional: Apply light retinol treatment (1-2x weekly)",
        ],
      },
      {
        phase: "weekly",
        steps: [
          "Clay or charcoal pore-cleansing mask (1-2x weekly)",
          "Gentle exfoliation with BHA (1-2x weekly)",
          "Pore-minimizing peel-off mask",
        ],
      },
    ],
    avoid: [
      "Heavy, pore-clogging moisturizers",
      "Touching or squeezing pores",
      "Hot water (use lukewarm)",
      "Oil-based products on oily areas",
      "Skipping moisturizer (dehydration enlarges pores)",
    ],
    tips: [
      "Use niacinamide regularly (highly effective for pores)",
      "Keep skin hydrated with lightweight products",
      "Use BHA (salicylic acid) weekly to exfoliate inside pores",
      "Apply moisturizer to prevent pore enlargement from dehydration",
      "Avoid touching your face",
      "Use pore strips or pore vacuum (sparingly)",
      "Consider professional facials for deep pore cleansing",
    ],
    consult: false,
  },

  blackheads: {
    disease: "Blackheads",
    severity: "medium",
    description:
      "Clogged pores filled with oxidized sebum and dead skin cells, appearing dark.",
    routines: [
      {
        phase: "morning",
        steps: [
          "Cleanse with salicylic acid (BHA) cleanser (0.5-2%)",
          "Apply BHA toner (1-2%)",
          "Use lightweight, oil-free moisturizer",
          "Apply sunscreen SPF 30+ (oil-free formula)",
          "Optional: Use blackhead strips on nose (not daily)",
        ],
      },
      {
        phase: "evening",
        steps: [
          "Double cleanse: oil cleanser first, then salicylic acid cleanser",
          "Apply BHA exfoliant (1-2%) - wait 15 minutes before next product",
          "Apply niacinamide serum or lightweight moisturizer",
          "Optional: Apply benzoyl peroxide (2.5%) on affected areas",
        ],
      },
      {
        phase: "weekly",
        steps: [
          "Use pore strips (1x weekly on nose)",
          "Clay or charcoal mask (1-2x weekly)",
          "Gentle physical exfoliation or enzyme peel (1x weekly)",
        ],
      },
    ],
    avoid: [
      "Squeezing or picking blackheads",
      "Oil-based cosmetics or moisturizers",
      "Heavy makeup on affected areas",
      "Dehydrating products",
      "Over-exfoliating",
    ],
    tips: [
      "Use BHA (salicylic acid) 3-5x weekly - most effective for blackheads",
      "Apply BHA to damp skin for better penetration",
      "Use clay masks weekly for deep cleansing",
      "Keep skin hydrated to prevent overproduction of oil",
      "Never squeeze; use tools or extraction in professional setting",
      "Use oil cleanser first in double cleanse to dissolve sebum",
      "Consider professional extractions for stubborn blackheads",
    ],
    consult: false,
  },

  darkspots: {
    disease: "Dark Spots & Hyperpigmentation",
    severity: "low",
    description:
      "Dark patches or spots on skin caused by sun exposure, aging, or post-inflammatory hyperpigmentation.",
    routines: [
      {
        phase: "morning",
        steps: [
          "Gentle cleanser",
          "Apply brightening toner with niacinamide or licorice extract",
          "Use vitamin C serum (10-20% concentration)",
          "Apply brightening moisturizer",
          "Apply sunscreen SPF 50+ (prevents further darkening)",
        ],
      },
      {
        phase: "evening",
        steps: [
          "Gentle cleanser",
          "Apply brightening toner",
          "Use hydroquinone serum (2-4%) or kojic acid for dark spots",
          "Apply niacinamide or azelaic acid serum",
          "Apply hydrating night moisturizer",
        ],
      },
      {
        phase: "weekly",
        steps: [
          "Bright/clarifying sheet mask (2-3x weekly)",
          "Gentle AHA exfoliation (1-2x weekly) for cell turnover",
          "Brightening peel-off mask",
        ],
      },
    ],
    avoid: [
      "Sun exposure without SPF 50+",
      "Picking or scratching dark spots",
      "Dehydrating products",
      "Heavy, pore-clogging makeup",
      "Irritating products (stick to gentle formula)",
    ],
    tips: [
      "SPF 50+ is essential - prevents spots from getting darker",
      "Use vitamin C serum (antioxidant and brightening)",
      "Use hydroquinone (prescription or 2-4% OTC) for stubborn spots",
      "Azelaic acid is effective for post-inflammatory hyperpigmentation",
      "Kojic acid and licorice extract are natural brightening options",
      "AHA exfoliation helps with cell turnover to fade spots",
      "Consider professional treatments: laser, microdermabrasion, chemical peels",
    ],
    consult: false,
  },
};

function normalizeConditionKey(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

export function normalizeDetectedCondition(condition: string): string {
  const normalizedKey = normalizeConditionKey(condition);
  const squashedKey = normalizedKey.replace(/_/g, "");

  return (
    CONDITION_ALIASES[normalizedKey] ||
    CONDITION_ALIASES[squashedKey] ||
    normalizedKey
  );
}

/**
 * Get routine steps for a list of detected conditions for a given phase.
 * Falls back to 'healthy' routines when no matching condition is found.
 */
export function getRoutineStepsForPhase(
  detectedConditions: string[] = [],
  phase: "morning" | "evening" | "weekly" = "morning",
): string[] {
  if (!detectedConditions || detectedConditions.length === 0) {
    const healthy = DISEASE_RECOMMENDATIONS["healthy"];
    const r = healthy.routines.find((r) => r.phase === phase);
    return r ? r.steps : [];
  }

  // Try to find the first condition that has a recommendation
  for (const cond of detectedConditions) {
    const key = normalizeDetectedCondition(cond);
    if (DISEASE_RECOMMENDATIONS[key]) {
      const rec = DISEASE_RECOMMENDATIONS[key];
      const r = rec.routines.find((r) => r.phase === phase);
      if (r) return r.steps;
    }
  }

  // fallback to healthy
  const healthy = DISEASE_RECOMMENDATIONS["healthy"];
  const r = healthy.routines.find((r) => r.phase === phase);
  return r ? r.steps : [];
}

/**
 * Get personalized skincare recommendation based on detected disease
 */
export function getRecommendation(diseaseName: string): DiseaseRecommendation {
  const key = normalizeDetectedCondition(diseaseName);

  // Try exact match first
  if (DISEASE_RECOMMENDATIONS[key]) {
    return DISEASE_RECOMMENDATIONS[key];
  }

  // Try partial match for common disease names
  for (const rec of Object.values(DISEASE_RECOMMENDATIONS)) {
    if (
      rec.disease.toLowerCase().includes(diseaseName.toLowerCase()) ||
      diseaseName.toLowerCase().includes(rec.disease.toLowerCase())
    ) {
      return rec;
    }
  }

  // Fallback to healthy skin if no match
  console.warn(
    `[DiseaseRoutine] No recommendation found for "${diseaseName}". Using healthy skin routine.`,
  );
  return DISEASE_RECOMMENDATIONS.healthy;
}

/**
 * Get all available disease types
 */
export function getAllDiseases(): DiseaseRecommendation[] {
  return Object.values(DISEASE_RECOMMENDATIONS);
}

/**
 * Get severity score (0-100) based on detected conditions
 */
export function calculateHealthScore(
  detectedDiseases: string[],
  confidences: number[],
): number {
  if (detectedDiseases.length === 0) return 100;

  let severitySum = 0;
  let weightSum = 0;

  detectedDiseases.forEach((disease, i) => {
    const rec = getRecommendation(disease);
    const severityMap = { low: 20, medium: 50, high: 80 };
    const severity = severityMap[rec.severity] || 50;
    const confidence = confidences[i] || 0.5;

    severitySum += severity * confidence;
    weightSum += confidence;
  });

  const healthScore = Math.max(0, 100 - severitySum / (weightSum || 1));
  return Math.round(healthScore);
}
