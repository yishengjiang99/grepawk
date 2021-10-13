export const wsRoot = `${
  window.location.protocol == "https:" ? "wss" : "ws"
}://${window.location.host}`;

export const apiRoot = window.location.origin;

export const signalWs = `${wsRoot}/ice`;
