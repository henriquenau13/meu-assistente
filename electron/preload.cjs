const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("assistantWindow", {
  // true = o mouse atravessa a janela, false = a janela recebe o mouse
  setIgnoreMouse: (ignore) => ipcRenderer.send("assistant:ignore-mouse", ignore)
});