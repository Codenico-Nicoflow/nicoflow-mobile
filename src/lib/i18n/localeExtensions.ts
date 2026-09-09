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

// NIC-1995: the upload source sheet is mobile-only — web has a drag-and-drop
// zone, so it has no camera/library/file wording and no permission-denial copy.
export const taskAttachmentExtensionsEn = {
  sourceCamera: 'Take a photo',
  sourceLibrary: 'Choose from library',
  sourceFile: 'Choose a file',
  permissionDenied: "Permission denied. You can allow access in your device's settings.",
  // NIC-1996: STORAGE_LIMIT_EXCEEDED has no web copy — web's storage bar warns
  // before the cap, so it never had to name the refusal.
  storageFull: 'Your storage is full. Remove some files, or upgrade on the web at nicoflow.app.',
  // Web's `proHint` reads "Upgrade to Pro to add files" — an instruction with no
  // in-app way to act on it. Mobile points at the web app instead (E-037).
  proHintReader: 'Attachments are a Pro feature. Upgrade on the web at nicoflow.app to add files.',
};

export const taskAttachmentExtensionsHe = {
  sourceCamera: 'צילום תמונה',
  sourceLibrary: 'בחירה מהגלריה',
  sourceFile: 'בחירת קובץ',
  permissionDenied: 'ההרשאה נדחתה. אפשר לאשר גישה בהגדרות המכשיר.',
  storageFull: 'שטח האחסון מלא. מחקו קבצים או שדרגו באתר nicoflow.app.',
  proHintReader: 'קבצים מצורפים הם תכונת Pro. שדרגו באתר nicoflow.app כדי להוסיף קבצים.',
};

export const taskAttachmentExtensionsRu = {
  sourceCamera: 'Сделать фото',
  sourceLibrary: 'Выбрать из галереи',
  sourceFile: 'Выбрать файл',
  permissionDenied: 'Доступ запрещён. Его можно разрешить в настройках устройства.',
  storageFull: 'Хранилище заполнено. Удалите файлы или оформите Pro на сайте nicoflow.app.',
  proHintReader: 'Вложения — функция Pro. Оформите Pro на сайте nicoflow.app, чтобы добавлять файлы.',
};
