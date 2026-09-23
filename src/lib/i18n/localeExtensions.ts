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

export const calendarExtensionsEn = {
  title: 'Calendar',
  loading: 'Checking Calendar access…',
  teaserTitle: 'Plan your month with Calendar',
  teaserDescription: 'Calendar is included with Pro. This preview uses sample blocks and never loads your tasks.',
  upgradeOnWeb: 'Upgrade on the web at nicoflow.app.',
  ready: 'Your calendar is ready.',
  previousMonth: 'Previous month',
  nextMonth: 'Next month',
  loadingTasks: 'Loading calendar…',
  loadError: 'Calendar could not be loaded.',
  offlineError: 'Calendar is unavailable while you are offline. Reconnect and retry.',
  retry: 'Retry',
  saving: 'Saving calendar change…',
  dayLabel: '{{date}}, {{count}} tasks',
  more: '+{{count}} more',
  showAllTasks: 'Show all {{count}} tasks on {{date}}',
  dayTaskCount: '{{count}} tasks',
  emptyDayTitle: 'No tasks scheduled',
  emptyDayDescription: 'This day is clear.',
  openTask: 'Open task: {{title}}',
  move: 'Move',
  moveTask: 'Move {{title}} to a date',
  moveDateLabel: 'New task date',
  invalidMoveDate: 'Enter a date as YYYY-MM-DD.',
  recurringMoveLocked: 'Edit the recurring series to change this occurrence date.',
  dropOnDate: 'Move to {{date}}',
  duration: 'Duration',
  editDuration: 'Edit duration for {{title}}',
  durationSuggestion: 'Suggested: {{count}} minutes. Nothing is saved until you confirm.',
  durationPreview: 'Starts {{start}} · {{count}} minutes',
  resizeDuration: 'Drag to resize duration',
  durationMinutes: 'Duration in minutes',
  invalidDuration: 'Enter a whole number from 1 to 1440.',
};

export const calendarExtensionsHe = {
  title: 'לוח שנה',
  loading: 'בודקים גישה ללוח השנה…',
  teaserTitle: 'תכננו את החודש עם לוח השנה',
  teaserDescription: 'לוח השנה כלול ב-Pro. התצוגה המקדימה משתמשת בנתוני דוגמה ולעולם לא טוענת את המשימות שלכם.',
  upgradeOnWeb: 'שדרגו באתר nicoflow.app.',
  ready: 'לוח השנה שלכם מוכן.',
  previousMonth: 'החודש הקודם',
  nextMonth: 'החודש הבא',
  loadingTasks: 'טוענים את לוח השנה…',
  loadError: 'לא ניתן לטעון את לוח השנה.',
  offlineError: 'לוח השנה אינו זמין במצב לא מקוון. התחברו מחדש ונסו שוב.',
  retry: 'ניסיון חוזר',
  saving: 'שומרים את השינוי בלוח השנה…',
  dayLabel: '{{date}}, {{count}} משימות',
  more: '+{{count}} נוספות',
  showAllTasks: 'הצגת כל {{count}} המשימות ב-{{date}}',
  dayTaskCount: '{{count}} משימות',
  emptyDayTitle: 'אין משימות מתוזמנות',
  emptyDayDescription: 'היום הזה פנוי.',
  openTask: 'פתיחת משימה: {{title}}',
  move: 'העברה',
  moveTask: 'העברת {{title}} לתאריך',
  moveDateLabel: 'תאריך חדש למשימה',
  invalidMoveDate: 'הזינו תאריך בתבנית YYYY-MM-DD.',
  recurringMoveLocked: 'כדי לשנות את תאריך המופע, ערכו את הסדרה החוזרת.',
  dropOnDate: 'העברה אל {{date}}',
  duration: 'משך',
  editDuration: 'עריכת המשך של {{title}}',
  durationSuggestion: 'הצעה: {{count}} דקות. דבר לא נשמר עד לאישור.',
  durationPreview: 'התחלה {{start}} · {{count}} דקות',
  resizeDuration: 'גררו לשינוי משך הזמן',
  durationMinutes: 'משך בדקות',
  invalidDuration: 'הזינו מספר שלם בין 1 ל-1440.',
};

export const calendarExtensionsRu = {
  title: 'Календарь',
  loading: 'Проверяем доступ к календарю…',
  teaserTitle: 'Планируйте месяц в календаре',
  teaserDescription:
    'Календарь доступен в Pro. В примере используются только условные блоки — ваши задачи не загружаются.',
  upgradeOnWeb: 'Оформите Pro на сайте nicoflow.app.',
  ready: 'Ваш календарь готов.',
  previousMonth: 'Предыдущий месяц',
  nextMonth: 'Следующий месяц',
  loadingTasks: 'Загружаем календарь…',
  loadError: 'Не удалось загрузить календарь.',
  offlineError: 'Календарь недоступен без сети. Подключитесь и повторите попытку.',
  retry: 'Повторить',
  saving: 'Сохраняем изменение календаря…',
  dayLabel: '{{date}}, задач: {{count}}',
  more: '+{{count}} ещё',
  showAllTasks: 'Показать все задачи ({{count}}) на {{date}}',
  dayTaskCount: 'Задач: {{count}}',
  emptyDayTitle: 'Нет запланированных задач',
  emptyDayDescription: 'Этот день свободен.',
  openTask: 'Открыть задачу: {{title}}',
  move: 'Перенести',
  moveTask: 'Перенести {{title}} на дату',
  moveDateLabel: 'Новая дата задачи',
  invalidMoveDate: 'Введите дату в формате YYYY-MM-DD.',
  recurringMoveLocked: 'Измените повторяющуюся серию, чтобы поменять дату этого события.',
  dropOnDate: 'Перенести на {{date}}',
  duration: 'Длительность',
  editDuration: 'Изменить длительность: {{title}}',
  durationSuggestion: 'Предложение: {{count}} минут. До подтверждения ничего не сохраняется.',
  durationPreview: 'Начало {{start}} · {{count}} мин.',
  resizeDuration: 'Перетащите, чтобы изменить длительность',
  durationMinutes: 'Длительность в минутах',
  invalidDuration: 'Введите целое число от 1 до 1440.',
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
