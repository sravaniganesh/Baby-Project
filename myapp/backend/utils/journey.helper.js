/**
 * Journey Derivation Helper
 * -------------------------
 * Single source of truth for determining a woman's
 * current life stage based on profile + dates.
 *
 * IMPORTANT RULES:
 * - No DB writes
 * - No assumptions
 * - No side effects
 * - Everything is derived from User profile data
 */

function getJourneyStage(user) {
  if (!user || !user.womenCategory) {
    return {
      category: null,
      stageKey: null,
      meta: {},
    };
  }

  const today = new Date();

  /* ===============================
     TEEN / MARRIED (SIMPLE CASES)
     =============================== */
  if (user.womenCategory === "teen" || user.womenCategory === "married") {
    return {
      category: user.womenCategory,
      stageKey: user.womenCategory,
      meta: {},
    };
  }

  /* ===============================
     PREGNANCY LOGIC
     =============================== */
  if (user.womenCategory === "pregnant") {
    // If user explicitly marked delivery
    if (user.pregnancyStatus === "delivered") {
      return derivePostPregnancy(user, today);
    }

    if (!user.pregnancyStartDate) {
      // Safety fallback: category is pregnant but date missing
      return {
        category: "pregnant",
        stageKey: "pregnant_unknown",
        meta: {},
      };
    }

    const startDate = new Date(user.pregnancyStartDate);
    const diffMs = today - startDate;

    const day = Math.floor(diffMs / (1000 * 60 * 60 * 24)) + 1;
    const week = Math.floor(day / 7) + 1;

    let trimester = 1;
    if (week >= 13 && week <= 27) trimester = 2;
    if (week >= 28) trimester = 3;

    return {
      category: "pregnant",
      stageKey: `pregnant_trimester_${trimester}`,
      meta: {
        day,
        week,
        trimester,
        pregnancyStatus: "pregnant",
        expectedDeliveryDate: user.expectedDeliveryDate || null,
      },
    };
  }

  /* ===============================
     POST PREGNANCY
     =============================== */
  if (user.womenCategory === "post_pregnancy") {
    return derivePostPregnancy(user, today);
  }

  /* ===============================
     FALLBACK
     =============================== */
  return {
    category: user.womenCategory,
    stageKey: user.womenCategory,
    meta: {},
  };
}

/* ===============================
   POST PREGNANCY DERIVATION
   =============================== */
function derivePostPregnancy(user, today) {
  if (!user.babyBirthDate && !user.deliveryDate) {
    return {
      category: "post_pregnancy",
      stageKey: "post_pregnancy_unknown",
      meta: {},
    };
  }

  const birthDate = new Date(user.babyBirthDate || user.deliveryDate);
  const diffMs = today - birthDate;

  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const months = Math.floor(days / 30);

  let babyStage = "newborn";
  if (months >= 3 && months < 6) babyStage = "3_6_months";
  if (months >= 6 && months < 12) babyStage = "6_12_months";
  if (months >= 12) babyStage = "1_year_plus";

  return {
    category: "post_pregnancy",
    stageKey: `post_pregnancy_${babyStage}`,
    meta: {
      days,
      months,
      babyStage,
    },
  };
}

module.exports = {
  getJourneyStage,
};
