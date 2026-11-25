import {
  app,
  BrowserWindow,
  ipcMain,
  screen,
  Tray,
  Menu
} from "electron";

import path from "node:path";
import { startMedia, stopMedia } from "./media.js";
import { startVolume, stopVolume } from "./volume.js";

let mainWindow;
let tray;
let isQuitting = false;

const WINDOW_WIDTH = 944;
const WINDOW_HEIGHT = 540;

// Se o cinza voltar a aparecer, tire as duas barras da linha seguinte:
// app.disableHardwareAcceleration();

// Impede abrir várias instâncias do aplicativo
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
} else {

  // Força o Windows a redesenhar a transparência
  function forceRepaint() {
    if (!mainWindow || mainWindow.isDestroyed()) return;

    const b = mainWindow.getBounds();
    mainWindow.setBounds({ ...b, width: b.width + 1 });
    mainWindow.setBounds(b);
    mainWindow.webContents.invalidate();
  }

  // Mostra a janela sem o flash cinza:
  // 1) abre invisível  2) redesenha  3) só então fica visível
  function showAssistant() {
    if (!mainWindow || mainWindow.isDestroyed()) return;

    mainWindow.setOpacity(0);
    mainWindow.showInactive();

    setTimeout(forceRepaint, 100);
    setTimeout(forceRepaint, 300);

    setTimeout(() => {
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.setOpacity(1);
      }
    }, 500);
  }

  app.on("second-instance", () => {
    showAssistant();
  });

  function createTray() {
    const icon = app.getFileIcon(process.execPath, {
      size: "small"
    });

    icon.then((image) => {
      tray = new Tray(image);

      tray.setToolTip("Meu Assistente");

      const contextMenu = Menu.buildFromTemplate([
        {
          label: "Abrir Meu Assistente",
          click: () => showAssistant()
        },
        {
          type: "separator"
        },
        {
          label: "Sair",
          click: () => {
            isQuitting = true;
            app.quit();
          }
        }
      ]);

      tray.setContextMenu(contextMenu);

      tray.on("click", () => {
        if (!mainWindow || mainWindow.isDestroyed()) return;

        if (mainWindow.isVisible()) {
          mainWindow.hide();
        } else {
          showAssistant();
        }
      });
    });
  }

  function createWindow() {
    const { bounds } = screen.getPrimaryDisplay();

    mainWindow = new BrowserWindow({
      width: WINDOW_WIDTH,
      height: WINDOW_HEIGHT,

      x: Math.round(
        bounds.x + (bounds.width - WINDOW_WIDTH) / 2
      ),

      y: bounds.y,

      show: false,
      frame: false,
      transparent: true,
      backgroundColor: "#00000000",
      hasShadow: false,

      alwaysOnTop: false,
      focusable: false,
      skipTaskbar: true,
      resizable: false,
      movable: false,

      autoHideMenuBar: true,

      webPreferences: {
        preload: path.join(
          app.getAppPath(),
          "electron",
          "preload.cjs"
        ),

        contextIsolation: true,
        nodeIntegration: false
      }
    });

    mainWindow.setIgnoreMouseEvents(true, {
      forward: true
    });

    if (app.isPackaged) {
      mainWindow.loadFile(
        path.join(app.getAppPath(), "dist", "index.html")
      );
    } else {
      mainWindow.loadURL("http://localhost:5173");
    }

    // Espera a página carregar por completo antes de mostrar
    mainWindow.webContents.once("did-finish-load", () => {
      setTimeout(showAssistant, 200);
    });

    // Fechar a janela apenas esconde o assistente
    mainWindow.on("close", (event) => {
      if (!isQuitting) {
        event.preventDefault();
        mainWindow.hide();
      }
    });

    mainWindow.on("closed", () => {
      mainWindow = null;
    });
  }

  ipcMain.on("assistant:ignore-mouse", (_event, ignore) => {
    if (!mainWindow || mainWindow.isDestroyed()) return;

    mainWindow.setIgnoreMouseEvents(ignore, {
      forward: true
    });
  });

  app.whenReady().then(() => {
    createTray();
    createWindow();
    startMedia(() => mainWindow);  // música: lê o Windows
    startVolume(() => mainWindow); // volume: lê e controla o Windows
  });
}

app.on("before-quit", () => {
  isQuitting = true;
  stopMedia();
  stopVolume();
});