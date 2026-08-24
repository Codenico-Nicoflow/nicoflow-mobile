import { View } from 'react-native';

import { useTranslation } from 'react-i18next';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

interface ConflictNoticeProps {
  onReload: () => void;
}

// Mirrors web's ConflictNotice.tsx exactly: ONE action ("Reload the latest
// version"), no merge, no save-anyway. There is no undo on the server side,
// so the only safe recovery is discarding the local edit and re-fetching.
export function ConflictNotice({ onReload }: ConflictNoticeProps) {
  const { t } = useTranslation('notes');

  return (
    <Alert variant="destructive">
      <View className="gap-2">
        <AlertTitle variant="destructive">{t('save.conflictTitle')}</AlertTitle>
        <AlertDescription variant="destructive">{t('save.conflictBody')}</AlertDescription>
        <Button label={t('save.reload')} variant="outline" onPress={onReload} />
      </View>
    </Alert>
  );
}
