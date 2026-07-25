// backend/cron/notificationCron.js

const cron = require("node-cron");
const UserPremium = require("../models/UserPremium");
const User = require("../models/user");
const Doctor = require("../models/Doctor");
const Notification = require("../models/Notification");
const notificationService = require("../services/notificationService");
const ScheduledNotification = require("../models/ScheduledNotification");

const {
  getPregnancyMessage,
  getBabyMessage,
} = require("../services/stageNotificationService");

function shouldSendNow(user) {
  const nowHour = new Date().getHours();

  if (!user.activityStats?.lastActiveHour) return true;

  const preferredHour = user.activityStats.lastActiveHour;

  return Math.abs(nowHour - preferredHour) <= 1;
}

/**
 * Helper: Calculate pregnancy weeks
 */
function calculatePregnancyWeeks(startDate) {
  const now = new Date();
  const diff = now - new Date(startDate);
  return Math.floor(diff / (1000 * 60 * 60 * 24 * 7));
}

/**
 * Helper: Calculate baby age in months
 */
function calculateBabyMonths(birthDate) {
  const now = new Date();
  const diff = now - new Date(birthDate);
  return Math.floor(diff / (1000 * 60 * 60 * 24 * 30));
}

/**
 * Prevent duplicate notifications per day
 */
async function notificationExists(userId, type, key) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const exists = await Notification.findOne({
    recipient: userId,
    type,
    "data.key": key,
    createdAt: { $gte: today },
  });

  return !!exists;
}

/**
 * Start Notification Cron Jobs
 */
exports.startNotificationCron = (app) => {
  cron.schedule("* * * * *", async () => {
    console.log("🔔 Running daily notification cron...");

    try {
      const today = new Date();
      const threeDaysLater = new Date();
      threeDaysLater.setDate(today.getDate() + 3);

      /* =========================================
         1️⃣ PREMIUM REMINDERS
      ========================================= */

      const expiringPremiums = await UserPremium.find({
        isActive: true,
        endDate: { $gte: today, $lte: threeDaysLater },
      });

      for (const premium of expiringPremiums) {
        const alreadySent = await notificationExists(
          premium.userId,
          "PREMIUM",
          "premium_expiry"
        );

        if (!alreadySent) {
          await notificationService.createNotification({
            recipientId: premium.userId,
            recipientModel: "User",
            senderModel: "System",
            type: "PREMIUM",
            title: "Premium Expiring Soon ⏳",
            message:
              "Your premium plan will expire in 3 days. Renew now to continue benefits.",
            data: {
              premiumId: premium._id,
              key: "premium_expiry",
            },
            req: { app },
          });
        }
      }

      /* =========================================
         2️⃣ STAGE-BASED DAILY NOTIFICATIONS
      ========================================= */

      const users = await User.find({ isActive: true });

      for (const user of users) {
        if (!user.womenCategory) continue;

        /* ===== Pregnancy ===== */

        if (user.womenCategory === "pregnant" && user.pregnancyStartDate) {
          const weeks = calculatePregnancyWeeks(user.pregnancyStartDate);

          const trimester =
            weeks < 14
              ? "1st Trimester"
              : weeks < 28
              ? "2nd Trimester"
              : "3rd Trimester";

          const key = `pregnancy_week_${weeks}`;

          const alreadySent = await notificationExists(
            user._id,
            "STAGE",
            key
          );

          if (!alreadySent) {
            const message = getPregnancyMessage
              ? getPregnancyMessage(weeks)
              : `You are in Week ${weeks} (${trimester}). Take care of your health 💛`;

            await notificationService.createNotification({
              recipientId: user._id,
              recipientModel: "User",
              senderModel: "System",
              type: "STAGE",
              title: `Week ${weeks} Pregnancy Update 🤰`,
              message,
              data: { weeks, trimester, key },
              req: { app },
            });
          }
        }

        /* ===== Baby Milestones ===== */

        if (
          user.womenCategory === "post_pregnancy" &&
          user.babyBirthDate
        ) {
          const months = calculateBabyMonths(user.babyBirthDate);

          if ([1, 3, 6, 9, 12].includes(months)) {
            const key = `baby_${months}_months`;

            const alreadySent = await notificationExists(
              user._id,
              "STAGE",
              key
            );

            if (!alreadySent) {
              const message = getBabyMessage
                ? getBabyMessage(months)
                : `Hi Mom ❤️ Your baby is ${months} months old today!`;

              await notificationService.createNotification({
                recipientId: user._id,
                recipientModel: "User",
                senderModel: "System",
                type: "STAGE",
                title: `Baby is ${months} Months Old 🎉`,
                message,
                data: { months, key },
                req: { app },
              });
            }
          }
        }

        /* ===== Teen Stage ===== */

        if (user.womenCategory === "teen") {
          const key = "teen_daily_tip";

          const alreadySent = await notificationExists(
            user._id,
            "STAGE",
            key
          );

          if (!alreadySent) {
            await notificationService.createNotification({
              recipientId: user._id,
              recipientModel: "User",
              senderModel: "System",
              type: "STAGE",
              title: "Daily Health Tip 💕",
              message:
                "Stay hydrated and track your menstrual cycle regularly.",
              data: { key },
              req: { app },
            });
          }
        }

        /* ===== Married Stage ===== */

        if (user.womenCategory === "married") {
          const key = "married_wellness";

          const alreadySent = await notificationExists(
            user._id,
            "STAGE",
            key
          );

          if (!alreadySent) {
            await notificationService.createNotification({
              recipientId: user._id,
              recipientModel: "User",
              senderModel: "System",
              type: "STAGE",
              title: "Wellness Reminder 💖",
              message:
                "Prioritize emotional and physical wellness today.",
              data: { key },
              req: { app },
            });
          }
        }

        /* ===== Nearby Doctor Notifications ===== */

        if (user.city) {
          const doctors = await Doctor.find({
            city: user.city,
            availability: "online",
            isActive: true,
          }).limit(3);

          if (doctors.length > 0) {
            const key = "doctor_available";

            const alreadySent = await notificationExists(
              user._id,
              "DOCTOR_MESSAGE",
              key
            );

            if (!alreadySent) {
              const doctorNames = doctors.map((d) => d.name).join(", ");

              await notificationService.createNotification({
                recipientId: user._id,
                recipientModel: "User",
                senderModel: "System",
                type: "DOCTOR_MESSAGE",
                title: "Doctors Available Near You 👩‍⚕️",
                message: `Doctors available in your city today: ${doctorNames}`,
                data: {
                  doctors: doctors.map((d) => d._id),
                  city: user.city,
                  key,
                },
                req: { app },
              });
            }
          }
        }
      }

      /* =========================================
         3️⃣ SCHEDULED BROADCAST NOTIFICATIONS
      ========================================= */

      const scheduled = await ScheduledNotification.find({
        sent: false,
        scheduledAt: { $lte: new Date() },
      });

      for (const item of scheduled) {
        const filter = { isActive: true };

        if (item.womenCategory) {
          filter.womenCategory = item.womenCategory;
        }

        if (item.city) {
          filter.city = item.city;
        }

        const targetUsers = await User.find(filter).select("_id");

        for (const u of targetUsers) {
          await notificationService.createNotification({
            recipientId: u._id,
            recipientModel: "User",
            senderModel: "System",
            type: "BROADCAST",
            title: item.title,
            message: item.message,
            data: { scheduled: true },
            req: { app },
          });
        }

        item.sent = true;
        await item.save();
      }

      console.log("✅ Stage notifications completed");

    } catch (err) {
      console.error("❌ Notification cron error:", err);
    }
  });
};