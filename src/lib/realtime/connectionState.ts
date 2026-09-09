// Live-socket state, kept outside React so the push notification handler can
// read it. That handler is registered with expo-notifications at module scope —
// it is not a component and has no access to hooks or the store.
//
// This is the "is the in-app channel already delivering?" signal that decides
// whether an OS banner would be a duplicate (NIC-1992).

let connected = false;

export const setWSConnected = (value: boolean): void => {
  connected = value;
};

export const isWSConnected = (): boolean => connected;
