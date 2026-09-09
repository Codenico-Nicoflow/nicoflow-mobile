// Whether an arriving push should raise an OS banner.
//
// The live WebSocket already delivers `notification.created` and updates the app
// in place, so a banner on top of that is the same news twice. Suppress only when
// BOTH are true — the app is foregrounded AND the socket is actually connected.
// If the socket is down, the banner is the only signal the user gets, so it must
// still show even in the foreground.
export interface ForegroundContext {
  isForeground: boolean;
  isWSConnected: boolean;
}

export const shouldShowAlert = ({ isForeground, isWSConnected }: ForegroundContext): boolean =>
  !(isForeground && isWSConnected);
