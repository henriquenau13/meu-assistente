const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("assistantWindow", {
  // true = o mouse atravessa a janela, false = a janela recebe o mouse
  setIgnoreMouse: (ignore) => ipcRenderer.send("assistant:ignore-mouse", ignore)
});

contextBridge.exposeInMainWorld("assistantMedia", {
  // estado atual (o que está tocando)
  getState: () => ipcRenderer.invoke("media:get"),

  // avisa quando algo muda; devolve uma função para parar de ouvir
  onUpdate: (callback) => {
    const handler = (_event, data) => callback(data);
    ipcRenderer.on("media:update", handler);
    return () => ipcRenderer.removeListener("media:update", handler);
  },

  // 'toggle' | 'next' | 'previous' | 'seek 84' (pular para 84 segundos)
  command: (cmd) => ipcRenderer.send("media:command", cmd),

  // abre o Spotify
  openSpotify: () => ipcRenderer.send("media:open")
});

contextBridge.exposeInMainWorld("assistantVolume", {
  // volume atual do Windows: { volume: 0-100, muted: true/false }
  getState: () => ipcRenderer.invoke("volume:get"),

  onUpdate: (callback) => {
    const handler = (_event, data) => callback(data);
    ipcRenderer.on("volume:update", handler);
    return () => ipcRenderer.removeListener("volume:update", handler);
  },

  set: (percent) =>
    ipcRenderer.send("volume:command", `set ${Math.round(percent)}`),

  mute: (muted) =>
    ipcRenderer.send("volume:command", muted ? "mute 1" : "mute 0")
});