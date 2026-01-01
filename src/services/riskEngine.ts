import { Deal, UserProfile } from "@/types";

export function computeRiskScore(deal: Deal, profile: UserProfile) {
  const reasons: string[] = [];

  // -----------------------------
  // 1) Amount-based risk
  // -----------------------------
  let amountScore = 0;
  if (deal.amount >= profile.highValueThreshold) {
    amountScore = 1;
    const formattedAmount = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: deal.currency || "USD",
      maximumFractionDigits: 0,
    }).format(deal.amount);
    const formattedThreshold = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: deal.currency || "USD",
      maximumFractionDigits: 0,
    }).format(profile.highValueThreshold);
    reasons.push(
      `High-value deal: ${formattedAmount} exceeds your threshold of ${formattedThreshold}`
    );
  }

  // -----------------------------
  // 2) Stage-based risk
  // -----------------------------
  let stageScore = 0;
  const riskyStages = (profile.riskyStages || []).map((s) => s.toLowerCase());
  if (riskyStages.includes(deal.stage.toLowerCase())) {
    stageScore = 1;
    reasons.push(`Deal currently in a risky stage: ${deal.stage}`);
  }

  // -----------------------------
  // 3) Inactivity-based risk
  // -----------------------------
  let inactivityScore = 0;
  if (deal.daysInactive >= profile.stalledThresholdDays) {
    inactivityScore = 1;
    reasons.push(`Inactive for ${deal.daysInactive} days`);
  }

  // -----------------------------
  // 4) Notes Keyword Risk
  // -----------------------------
  let keywordScore = 0;
  const notes = deal.notes?.toLowerCase() || "";
  if (profile.riskKeywords && profile.riskKeywords.length > 0) {
    for (const kw of profile.riskKeywords) {
      if (kw.word && notes.includes(kw.word.toLowerCase())) {
        keywordScore += kw.weight;
        reasons.push(`Keyword detected: "${kw.word}"`);
      }
    }
    keywordScore = Math.min(1, keywordScore);
  }

  // -----------------------------
  // 5) Weighted final score
  // -----------------------------
  const {
    riskWeightAmount,
    riskWeightStage,
    riskWeightInactivity,
    riskWeightNotes,
  } = profile;

  const finalScore =
    amountScore * riskWeightAmount +
    stageScore * riskWeightStage +
    inactivityScore * riskWeightInactivity +
    keywordScore * riskWeightNotes;

  const score = Math.round(finalScore * 100);

  // -----------------------------
  // Risk Level
  // -----------------------------
  let level: "low" | "medium" | "high" = "low";
  if (score >= 70) level = "high";
  else if (score >= 35) level = "medium";

  return {
    score,
    riskLevel: level,
    riskFactors: reasons,
  };
}

export function computeAllDealRisks(
  deals: Deal[],
  profile: UserProfile
): Deal[] {
  return deals.map((d) => {
    const r = computeRiskScore(d, profile);
    return {
      ...d,
      riskScore: r.score,
      riskLevel: r.riskLevel,
      riskFactors: r.riskFactors,
    };
  });
}
