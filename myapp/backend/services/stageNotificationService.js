// backend/services/stageNotificationService.js

/* ======================================================
   PREGNANCY WEEKLY MESSAGES (YOUR EXISTING DATA)
====================================================== */

const pregnancyMessages = {
  1: "Hi Mom ❤️ I’m just beginning my journey inside you.",
  2: "Hi Mom 🤰 Tiny changes are happening as I begin to grow.",
  3: "Hi Mom 💕 I’m now smaller than a poppy seed.",
  4: "Hi Mom 🌱 I’m growing quietly and safely inside you.",
  5: "Hi Mom ❤️ I’m now the size of a sesame seed!",
  6: "Hi Mom 💓 My tiny heart has started beating!",
  7: "Hi Mom 🤰 I’m now the size of a blueberry.",
  8: "Hi Mom 💕 My little arms and legs are beginning to form.",
  9: "Hi Mom 👶 I’m now the size of a grape.",
  10: "Hi Mom 🍓 I’m about the size of a strawberry today!",
  11: "Hi Mom ❤️ My tiny fingers and toes are forming.",
  12: "Hi Mom 🤰 I’m now the size of a lime.",
  13: "Hi Mom 💕 I’m growing stronger every day.",
  14: "Hi Mom 🍋 I’m about the size of a lemon.",
  15: "Hi Mom 💓 I can start moving my tiny arms.",
  16: "Hi Mom 🥑 I’m about the size of an avocado!",
  17: "Hi Mom 👶 I’m learning to stretch and move.",
  18: "Hi Mom ❤️ I may start kicking soon!",
  19: "Hi Mom 🤰 I’m getting bigger and stronger.",
  20: "Hi Mom 🎉 I can now hear your voice!",
  21: "Hi Mom 💕 I’m practicing my tiny movements.",
  22: "Hi Mom 👶 I’m about the size of a coconut.",
  23: "Hi Mom ❤️ My little ears are developing.",
  24: "Hi Mom 🤰 I’m growing rapidly this week.",
  25: "Hi Mom 💓 My tiny lungs are developing.",
  26: "Hi Mom 👶 I’m about the size of a lettuce.",
  27: "Hi Mom ❤️ I’m getting ready for the third trimester.",
  28: "Hi Mom 🤰 I can blink my tiny eyes now!",
  29: "Hi Mom 💕 My brain is growing quickly.",
  30: "Hi Mom 👶 I’m getting stronger every day.",
  31: "Hi Mom ❤️ I’m gaining healthy baby fat.",
  32: "Hi Mom 🤰 I’m about the size of a squash.",
  33: "Hi Mom 💓 I’m practicing breathing movements.",
  34: "Hi Mom 👶 I’m almost ready to meet you!",
  35: "Hi Mom ❤️ I’m getting into position for birth.",
  36: "Hi Mom 🤰 I’m getting bigger and stronger.",
  37: "Hi Mom 💕 I’m almost full term now!",
  38: "Hi Mom 👶 I can’t wait to see you soon.",
  39: "Hi Mom ❤️ I’m ready to meet you very soon!",
  40: "Hi Mom 🎉 Today might be the day we finally meet!",
};

/* ======================================================
   FETUS GROWTH DATA (FOR AI BABY VOICE)
====================================================== */

const fetusGrowth = {
  5: { size: "sesame seed", fact: "My tiny heart will start beating soon." },
  6: { size: "lentil", fact: "My tiny heart has started beating." },
  7: { size: "blueberry", fact: "My brain is developing quickly." },
  8: { size: "kidney bean", fact: "My little arms and legs are forming." },
  9: { size: "grape", fact: "My tiny fingers are starting to form." },
  10: { size: "strawberry", fact: "My arms can bend now." },
  12: { size: "lime", fact: "My reflexes are developing." },
  16: { size: "avocado", fact: "My muscles are getting stronger." },
  20: { size: "banana", fact: "I can hear your voice now." },
  24: { size: "corn", fact: "My lungs are developing." },
  28: { size: "eggplant", fact: "I can blink my eyes." },
  32: { size: "squash", fact: "I'm getting ready for birth." },
  36: { size: "papaya", fact: "I'm almost ready to meet you." },
};

/* ======================================================
   BABY MILESTONE MESSAGES (YOUR EXISTING DATA)
====================================================== */

const babyMessages = {
  1: "Hi Mom ❤️ I'm 1 month old today! I love hearing your voice.",
  2: "Hi Mom 👶 I'm starting to smile more often!",
  3: "Hi Mom 💕 I may start rolling over soon!",
  4: "Hi Mom 🍼 I'm getting stronger every day.",
  5: "Hi Mom 👶 I'm discovering my hands and feet.",
  6: "Hi Mom ❤️ I may start sitting with support!",
  7: "Hi Mom 👶 I love playing with you.",
  8: "Hi Mom 💕 I'm learning to explore the world.",
  9: "Hi Mom 👶 I may start crawling soon!",
  10: "Hi Mom ❤️ I'm growing fast every day.",
  11: "Hi Mom 👶 I'm almost 1 year old!",
  12: "Hi Mom 🎉 I'm 1 year old today! Thank you for loving me.",
};

/* ======================================================
   AI BABY VOICE GENERATOR
====================================================== */

function generateBabyVoiceMessage(week) {
  const growth = fetusGrowth[week];

  if (!growth) return null;

  return `Hi Mom ❤️
I'm about the size of a ${growth.size} today.
${growth.fact}
Thank you for taking care of me.`;
}

/* ======================================================
   MESSAGE HELPERS
====================================================== */

function getPregnancyMessage(week) {

  const baseMessage = pregnancyMessages[week];

  const aiVoice = generateBabyVoiceMessage(week);

  if (aiVoice) return aiVoice;

  if (baseMessage) return baseMessage;

  return "Hi Mom ❤️ I'm growing safely inside you.";
}

function getBabyMessage(month) {
  if (babyMessages[month]) {
    return babyMessages[month];
  }

  return "Hi Mom ❤️ I'm growing stronger every day.";
}

module.exports = {
  getPregnancyMessage,
  getBabyMessage,
};