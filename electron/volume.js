import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { app, ipcMain } from "electron";

// Aplicativo cujo volume será controlado (nome do processo)
const TARGET = "spotify";

// Script do PowerShell: controla o volume de UM aplicativo (como o Mixer do Windows).
// (Escrito só com caracteres simples, sem acentos, de propósito.)
const SCRIPT = String.raw`
[Console]::OutputEncoding = New-Object System.Text.UTF8Encoding($false)

function Write-Json($o) {
  [Console]::Out.WriteLine(($o | ConvertTo-Json -Compress -Depth 3))
}

try {
Add-Type -TypeDefinition @'
using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Runtime.InteropServices;

[Guid("D666063F-1587-4E43-81F1-B948E807363F"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
interface IMMDevice {
  int Activate(ref Guid iid, int clsCtx, IntPtr activationParams, [MarshalAs(UnmanagedType.IUnknown)] out object endpoint);
}

[Guid("A95664D2-9614-4F35-A746-DE8DB63617E6"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
interface IMMDeviceEnumerator {
  int EnumAudioEndpoints(int dataFlow, int stateMask, out IntPtr devices);
  int GetDefaultAudioEndpoint(int dataFlow, int role, out IMMDevice device);
}

[ComImport, Guid("BCDE0395-E52F-467C-8E3D-C4579291692E")]
class MMDeviceEnumeratorComObject { }

[Guid("77AA99A0-1BD6-484F-8BC7-2C654C9A9B6F"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
interface IAudioSessionManager2 {
  int GetAudioSessionControl(IntPtr guid, uint flags, out IntPtr ctl);
  int GetSimpleAudioVolume(IntPtr guid, uint flags, out IntPtr vol);
  int GetSessionEnumerator(out IAudioSessionEnumerator enumerator);
}

[Guid("E2F5BB11-0570-40CA-ACDD-3AA01277DEE8"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
interface IAudioSessionEnumerator {
  int GetCount(out int count);
  int GetSession(int index, out IAudioSessionControl2 session);
}

[Guid("BFB7FF88-7239-4FC9-8FA2-07C950BE9C6D"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
interface IAudioSessionControl2 {
  int GetState(out int state);
  int GetDisplayName([MarshalAs(UnmanagedType.LPWStr)] out string name);
  int SetDisplayName([MarshalAs(UnmanagedType.LPWStr)] string name, ref Guid ctx);
  int GetIconPath([MarshalAs(UnmanagedType.LPWStr)] out string path);
  int SetIconPath([MarshalAs(UnmanagedType.LPWStr)] string path, ref Guid ctx);
  int GetGroupingParam(out Guid g);
  int SetGroupingParam(ref Guid g, ref Guid ctx);
  int RegisterAudioSessionNotification(IntPtr n);
  int UnregisterAudioSessionNotification(IntPtr n);
  int GetSessionIdentifier([MarshalAs(UnmanagedType.LPWStr)] out string id);
  int GetSessionInstanceIdentifier([MarshalAs(UnmanagedType.LPWStr)] out string id);
  int GetProcessId(out uint pid);
  int IsSystemSoundsSession();
  int SetDuckingPreference([MarshalAs(UnmanagedType.Bool)] bool optOut);
}

[Guid("87CE5498-68D6-44E5-9215-6DA47EF883D8"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
interface ISimpleAudioVolume {
  int SetMasterVolume(float level, ref Guid ctx);
  int GetMasterVolume(out float level);
  int SetMute([MarshalAs(UnmanagedType.Bool)] bool mute, ref Guid ctx);
  int GetMute([MarshalAs(UnmanagedType.Bool)] out bool mute);
}

public class AppVol {
  static List<ISimpleAudioVolume> Find(string name) {
    List<ISimpleAudioVolume> list = new List<ISimpleAudioVolume>();

    IMMDeviceEnumerator en = new MMDeviceEnumeratorComObject() as IMMDeviceEnumerator;
    IMMDevice dev;
    Marshal.ThrowExceptionForHR(en.GetDefaultAudioEndpoint(0, 1, out dev));

    object o;
    Guid iid = typeof(IAudioSessionManager2).GUID;
    Marshal.ThrowExceptionForHR(dev.Activate(ref iid, 23, IntPtr.Zero, out o));

    IAudioSessionManager2 mgr = (IAudioSessionManager2)o;
    IAudioSessionEnumerator se;
    Marshal.ThrowExceptionForHR(mgr.GetSessionEnumerator(out se));

    int count;
    se.GetCount(out count);

    for (int i = 0; i < count; i++) {
      IAudioSessionControl2 c;
      if (se.GetSession(i, out c) != 0 || c == null) continue;

      uint pid;
      if (c.GetProcessId(out pid) != 0 || pid == 0) continue;

      try {
        Process p = Process.GetProcessById((int)pid);
        if (p.ProcessName.IndexOf(name, StringComparison.OrdinalIgnoreCase) >= 0) {
          ISimpleAudioVolume v = c as ISimpleAudioVolume;
          if (v != null) list.Add(v);
        }
      } catch { }
    }

    return list;
  }

  // -1 = aplicativo nao encontrado
  public static int GetVolume(string name) {
    List<ISimpleAudioVolume> l = Find(name);
    if (l.Count == 0) return -1;
    float v;
    l[0].GetMasterVolume(out v);
    return (int)Math.Round(v * 100);
  }

  // -1 = nao encontrado, 1 = mudo, 0 = com som
  public static int GetMute(string name) {
    List<ISimpleAudioVolume> l = Find(name);
    if (l.Count == 0) return -1;
    bool m;
    l[0].GetMute(out m);
    return m ? 1 : 0;
  }

  public static int SetVolume(string name, int percent) {
    if (percent < 0) percent = 0;
    if (percent > 100) percent = 100;
    List<ISimpleAudioVolume> l = Find(name);
    Guid g = Guid.Empty;
    foreach (ISimpleAudioVolume v in l) v.SetMasterVolume(percent / 100f, ref g);
    return l.Count;
  }

  public static int SetMute(string name, bool mute) {
    List<ISimpleAudioVolume> l = Find(name);
    Guid g = Guid.Empty;
    foreach (ISimpleAudioVolume v in l) v.SetMute(mute, ref g);
    return l.Count;
  }
}
'@
} catch {
  Write-Json @{ error = $_.Exception.Message }
  exit 1
}

$target = '__TARGET__'

# Leitor dos comandos que chegam do Electron (roda em segundo plano)
$queue = New-Object 'System.Collections.Concurrent.ConcurrentQueue[string]'
$rs = [runspacefactory]::CreateRunspace()
$rs.Open()
$rs.SessionStateProxy.SetVariable('queue', $queue)
$ps = [powershell]::Create()
$ps.Runspace = $rs
$null = $ps.AddScript('while ($true) { $l = [Console]::In.ReadLine(); if ($null -eq $l) { $queue.Enqueue(''quit''); break }; $queue.Enqueue($l) }')
$null = $ps.BeginInvoke()

function Emit-Volume {
  try {
    $v = [AppVol]::GetVolume($target)
    if ($v -lt 0) {
      Write-Json @{ found = $false; volume = 0; muted = $false }
    } else {
      Write-Json @{ found = $true; volume = $v; muted = ([AppVol]::GetMute($target) -eq 1) }
    }
  } catch {
    Write-Json @{ error = $_.Exception.Message }
  }
}

$ticks = 0
$force = $true
while ($true) {
  $cmd = $null
  while ($queue.TryDequeue([ref]$cmd)) {
    $cmd = $cmd.Trim()
    if ($cmd -eq 'quit') { exit }
    try {
      if ($cmd -like 'set *') {
        $null = [AppVol]::SetVolume($target, [int]$cmd.Substring(4))
        $force = $true
      } elseif ($cmd -eq 'mute 1') {
        $null = [AppVol]::SetMute($target, $true)
        $force = $true
      } elseif ($cmd -eq 'mute 0') {
        $null = [AppVol]::SetMute($target, $false)
        $force = $true
      }
    } catch {}
  }

  if ($force -or $ticks -ge 12) {
    Emit-Volume
    $ticks = 0
    $force = $false
  }

  Start-Sleep -Milliseconds 80
  $ticks++
}
`.replace("__TARGET__", TARGET);

let proc = null;
let buffer = "";
let state = null;
let getWindow = () => null;
let stopping = false;
let restarts = 0;
let lastError = "";

function handleLine(line) {
  let msg;
  try {
    msg = JSON.parse(line);
  } catch {
    return;
  }

  if (msg.error) {
    // não repete a mesma mensagem a cada segundo
    if (msg.error !== lastError) {
      lastError = msg.error;
      console.warn("[volume]", msg.error);
    }
    return;
  }

  lastError = "";
  state = msg;

  const win = getWindow();
  if (win && !win.isDestroyed()) {
    win.webContents.send("volume:update", msg);
  }
}

function start() {
  if (process.platform !== "win32" || stopping) return;

  const file = path.join(app.getPath("temp"), "meu-assistente-volume.ps1");
  fs.writeFileSync(file, SCRIPT, "utf8");

  proc = spawn(
    "powershell.exe",
    [
      "-NoLogo",
      "-NoProfile",
      "-NonInteractive",
      "-ExecutionPolicy",
      "Bypass",
      "-File",
      file,
    ],
    { windowsHide: true }
  );

  proc.stdout.setEncoding("utf8");
  proc.stdout.on("data", (chunk) => {
    buffer += chunk;
    let i;
    while ((i = buffer.indexOf("\n")) >= 0) {
      const line = buffer.slice(0, i).trim();
      buffer = buffer.slice(i + 1);
      if (line) handleLine(line);
    }
  });

  proc.stderr.on("data", (d) => console.warn("[volume]", String(d).trim()));
  proc.on("error", (e) => console.warn("[volume] erro:", e.message));

  proc.on("exit", () => {
    proc = null;
    buffer = "";
    if (!stopping && restarts < 5) {
      restarts++;
      setTimeout(start, 3000);
    }
  });
}

export function startVolume(windowGetter) {
  getWindow = windowGetter;
  start();
}

export function stopVolume() {
  stopping = true;
  if (proc) {
    try {
      proc.stdin.write("quit\n");
    } catch {}
    proc.kill();
    proc = null;
  }
}

// ----- ponte com a interface -----

ipcMain.handle("volume:get", () => state);

ipcMain.on("volume:command", (_event, cmd) => {
  if (typeof cmd !== "string") return;

  const ok = /^set \d{1,3}$/.test(cmd) || cmd === "mute 1" || cmd === "mute 0";

  if (ok && proc && proc.stdin.writable) proc.stdin.write(cmd + "\n");
});