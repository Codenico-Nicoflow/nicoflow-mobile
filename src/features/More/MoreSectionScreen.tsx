import { useTranslation } from 'react-i18next';

import { MORE_DESTINATIONS } from './data';
import { SectionPlaceholder } from './SectionPlaceholder';

interface MoreSectionScreenProps {
  /** Matches a MORE_DESTINATIONS id — keeps each route's icon and title from
   *  drifting away from the More row that navigates to it. */
  sectionId: string;
}

export function MoreSectionScreen({ sectionId }: MoreSectionScreenProps) {
  const { t } = useTranslation(['nav', 'common']);
  const section = MORE_DESTINATIONS.find(destination => destination.id === sectionId);

  if (!section) return null;

  return <SectionPlaceholder icon={section.icon} title={t(section.labelKey)} description={t('common:comingSoon')} />;
}
