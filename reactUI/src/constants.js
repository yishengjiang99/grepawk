console.log(process.env.WS_HOST);
export const wsRoot =
  process.env.WS_HOST ||
  `${window.location.protocol == "https" ? "wss" : "ws"}://${
    window.location.host
  }`;

export const apiRoot = window.location.origin;

export const signalWs = `${wsRoot}/ice`;
