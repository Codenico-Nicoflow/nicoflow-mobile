// Mobile-only i18n keys layered over the shared locales after init.
// NIC-1988: mobile ships as a reader app — E-037's billing posture forbids an
// in-app purchase CTA, so the free-cap wall points at the web app instead of
// web's `quota.upgrade` button. Mobile-only copy, merged into the `ai` namespace
// after init alongside the other extensions.
export const aiExtensionsEn = {
  quota: {
    upgradeOnWeb: 'Upgrade on the web at nicoflow.app to get 500 AI messages every month.',
  },
};

export const aiExtensionsHe = {
  quota: {
    upgradeOnWeb: 'שדרגו באתר nicoflow.app כדי לקבל 500 הודעות AI בכל חודש.',
  },
};

export const aiExtensionsRu = {
  quota: {
    upgradeOnWeb: 'Оформите Pro на сайте nicoflow.app, чтобы получать 500 AI-сообщений каждый месяц.',
  },
};

// NIC-1990: the Settings plan card is read-only on mobile for the same
// reader-app reason. Web's `pages.settings.upgradeTitle`/`upgradeDescription`
// are a purchase pitch attached to an Upgrade button; mobile has no button, so
// it needs a neutral heading and copy that points at the web app instead.
export const settingsExtensionsEn = {
  planSection: 'Plan',
  planUpgradeHint: 'Pro unlocks unlimited areas, projects and AI. Upgrade on the web at nicoflow.app.',
};

export const settingsExtensionsHe = {
  planSection: 'תוכנית',
  planUpgradeHint: 'Pro פותח אזורים, פרויקטים ו-AI ללא הגבלה. שדרגו באתר nicoflow.app.',
};

export const settingsExtensionsRu = {
  planSection: 'Тариф',
  planUpgradeHint: 'Pro открывает неограниченные области, проекты и AI. Оформите на сайте nicoflow.app.',
};
