import { createToastHelpers, ToastMessages } from '@nicoflow/shared/utils';

import i18n from '@/lib/i18n';

// Binds the shared toast-copy resolver to this app's i18next instance — same
// pattern as nicoflow-frontend's src/lib/utils/utils/helpers.ts, kept
// app-local because each app owns its own i18next instance.
export const { showErrorToast, showSuccessToast, showInfoToast, showWarningToast } = createToastHelpers(i18n);
export { ToastMessages };
