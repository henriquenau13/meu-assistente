import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { app, ipcMain, shell } from "electron";

// Script do PowerShell: lê o controle de mídia do Windows e aceita comandos.
// (Escrito só com caracteres simples, sem acentos, de propósito.)
const SCRIPT = String.raw`
[Console]::OutputEncoding = New-Object System.Text.UTF8Encoding($false)
Add-Type -AssemblyName System.Runtime.WindowsRuntime

$asTaskGeneric = ([System.WindowsRuntimeSystemExtensions].GetMethods() | Where-Object {
  $_.Name -eq 'AsTask' -and
  $_.GetParameters().Count -eq 1 -and
  $_.GetParameters()[0].ParameterType.Name -eq ('IAsyncOperation' + [char]96 + '1')
})[0]

function Await($op, $type) {
  $task = $asTaskGeneric.MakeGenericMethod($type).Invoke($null, @($op))
  $task.Wait(-1) | Out-Null
  return $task.Result
}

function Write-Json($o) {
  [Console]::Out.WriteLine(($o | ConvertTo-Json -Compress -Depth 3))
}

try {
  $null = [Windows.Media.Control.GlobalSystemMediaTransportControlsSessionManager,Windows.Media.Control,ContentType=WindowsRuntime]
  $null = [Windows.Media.Control.GlobalSystemMediaTransportControlsSessionMediaProperties,Windows.Media.Control,ContentType=WindowsRuntime]
  $null = [Windows.Storage.Streams.IRandomAccessStreamWithContentType,Windows.Storage.Streams,ContentType=WindowsRuntime]
  $null = [Windows.Storage.Streams.IInputStream,Windows.Storage.Streams,ContentType=WindowsRuntime]
  $null = [Windows.Storage.Streams.DataReader,Windows.Storage.Streams,ContentType=WindowsRuntime]
  $mgr = Await ([Windows.Media.Control.GlobalSystemMediaTransportControlsSessionManager]::RequestAsync()) ([Windows.Media.Control.GlobalSystemMediaTransportControlsSessionManager])
} catch {
  Write-Json @{ active = $false; error = $_.Exception.Message }
  exit 1
}

# Leitor dos comandos que chegam do Electron (roda em segundo plano)
$queue = New-Object 'System.Collections.Concurrent.ConcurrentQueue[string]'
$rs = [runspacefactory]::CreateRunspace()
$rs.Open()
$rs.SessionStateProxy.SetVariable('queue', $queue)
$ps = [powershell]::Create()
$ps.Runspace = $rs
$null = $ps.AddScript('while ($true) { $l = [Console]::In.ReadLine(); if ($null -eq $l) { $queue.Enqueue(''quit''); break }; $queue.Enqueue($l) }')
$null = $ps.BeginInvoke()

# Escolhe a sessao: prefere a que esta tocando e, em empate, o Spotify
function Pick-Session {
  $best = $null
  $bestScore = -1
  foreach ($x in $mgr.GetSessions()) {
    $score = 0
    if ($x.GetPlaybackInfo().PlaybackStatus.ToString() -eq 'Playing') { $score += 2 }
    if ($x.SourceAppUserModelId -match 'Spotify') { $score += 1 }
    if ($score -gt $bestScore) { $best = $x; $bestScore = $score }
  }
  if ($null -eq $best) { $best = $mgr.GetCurrentSession() }
  return $best
}

$script:thumbError = ''

# Capa do album em base64 (tenta dois jeitos, sem confiar no tamanho informado)
function Get-Thumb($props) {
  $script:thumbError = ''
  if ($null -eq $props.Thumbnail) { $script:thumbError = 'sem capa'; return '' }

  try {
    $st = Await ($props.Thumbnail.OpenReadAsync()) ([Windows.Storage.Streams.IRandomAccessStreamWithContentType])

    $mime = $st.ContentType
    if (-not $mime) { $mime = 'image/jpeg' }

    $bytes = $null
    $errs = @()

    # jeito 1: leitor do Windows, carrega ate 4 MB
    try {
      $reader = [Windows.Storage.Streams.DataReader]::new($st)
      $n = Await ($reader.LoadAsync([uint32]4194304)) ([uint32])
      if ($n -gt 0) {
        $bytes = New-Object byte[] $n
        $reader.ReadBytes($bytes)
      }
    } catch { $errs += ('leitor: ' + $_.Exception.Message) }

    # jeito 2: fluxo do .NET
    if ($null -eq $bytes -or $bytes.Length -eq 0) {
      try {
        $net = [System.IO.WindowsRuntimeStreamExtensions]::AsStreamForRead([Windows.Storage.Streams.IInputStream]$st)
        $ms = New-Object System.IO.MemoryStream
        $net.CopyTo($ms)
        $bytes = $ms.ToArray()
      } catch { $errs += ('fluxo: ' + $_.Exception.Message) }
    }

    if ($null -eq $bytes -or $bytes.Length -eq 0) {
      $script:thumbError = 'capa vazia (tamanho ' + $st.Size + ') ' + ($errs -join ' | ')
      return ''
    }

    return 'data:' + $mime + ';base64,' + [Convert]::ToBase64String($bytes)
  } catch {
    $script:thumbError = 'capa: ' + $_.Exception.Message
    return ''
  }
}

$script:lastKey = ''
$script:thumbEmpty = $false
$script:thumbTries = 0

function Emit-State {
  $s = Pick-Session
  if ($null -eq $s) {
    $script:lastKey = ''
    Write-Json @{ active = $false }
    return
  }

  $info = $s.GetPlaybackInfo()
  $playing = ($info.PlaybackStatus.ToString() -eq 'Playing')
  $props = Await ($s.TryGetMediaPropertiesAsync()) ([Windows.Media.Control.GlobalSystemMediaTransportControlsSessionMediaProperties])
  $key = $s.SourceAppUserModelId + '|' + $props.Title + '|' + $props.Artist

  $tl = $s.GetTimelineProperties()
  $dur = ($tl.EndTime - $tl.StartTime).TotalSeconds
  if ($dur -lt 0) { $dur = 0 }
  $pos = $tl.Position.TotalSeconds
  if ($playing) { $pos += ([DateTimeOffset]::UtcNow - $tl.LastUpdatedTime).TotalSeconds }
  if ($dur -gt 0 -and $pos -gt $dur) { $pos = $dur }
  if ($pos -lt 0) { $pos = 0 }

  $o = [ordered]@{
    active   = $true
    title    = [string]$props.Title
    artist   = [string]$props.Artist
    app      = [string]$s.SourceAppUserModelId
    playing  = $playing
    position = [Math]::Round($pos, 1)
    duration = [Math]::Round($dur, 1)
    canNext  = [bool]$info.Controls.IsNextEnabled
    canPrev  = [bool]$info.Controls.IsPreviousEnabled
  }

  # A capa so e enviada quando a musica muda (ou se ainda nao carregou)
  if ($key -ne $script:lastKey) {
    $script:lastKey = $key
    $script:thumbTries = 0
    Start-Sleep -Milliseconds 400
    $props = Await ($s.TryGetMediaPropertiesAsync()) ([Windows.Media.Control.GlobalSystemMediaTransportControlsSessionMediaProperties])
    $thumb = Get-Thumb $props
    $script:thumbEmpty = ($thumb -eq '')
    $o['thumb'] = $thumb
    if ($script:thumbEmpty) { $o['thumbError'] = $script:thumbError }
  } elseif ($script:thumbEmpty -and $script:thumbTries -lt 8) {
    $script:thumbTries++
    $thumb = Get-Thumb $props
    if ($thumb -ne '') {
      $script:thumbEmpty = $false
      $o['thumb'] = $thumb
    }
  }

  Write-Json $o
}

$ticks = 0
$force = $true
while ($true) {
  $cmd = $null
  while ($queue.TryDequeue([ref]$cmd)) {
    $cmd = $cmd.Trim()
    if ($cmd -eq 'quit') { exit }
    try {
      $s = Pick-Session
      if ($null -ne $s) {
        if ($cmd -like 'seek *') {
          $sec = [double]::Parse($cmd.Substring(5), [System.Globalization.CultureInfo]::InvariantCulture)
          $null = $s.TryChangePlaybackPositionAsync([long]($sec * 10000000))
        } else {
          switch ($cmd) {
            'toggle'   { $null = $s.TryTogglePlayPauseAsync() }
            'next'     { $null = $s.TrySkipNextAsync() }
            'previous' { $null = $s.TrySkipPreviousAsync() }
          }
        }
        Start-Sleep -Milliseconds 250
        $force = $true
      }
    } catch {}
  }

  if ($force -or $ticks -ge 4) {
    try { Emit-State } catch { Write-Json @{ active = $false; error = $_.Exception.Message } }
    $ticks = 0
    $force = $false
  }

  Start-Sleep -Milliseconds 250
  $ticks++
}
`;

let proc = null;
let buffer = "";
let state = { active: false };
let getWindow = () => null;
let stopping = false;
let restarts = 0;
let lastError = "";

// ===== PLANO B DA CAPA: busca na internet (iTunes) pelo nome =====

const artCache = new Map();
let fallbackKey = "";

// "Musica (Ao Vivo) - Remastered" -> "Musica"
function cleanTitle(title) {
  return title.replace(/\(.*?\)|\[.*?\]/g, "").split(" - ")[0].trim();
}

async function fetchArtwork(title, artist) {
  const key = `${artist}|${title}`;
  if (artCache.has(key)) return artCache.get(key);

  let result = null;
  let failed = false;

  try {
    const term = encodeURIComponent(`${artist} ${cleanTitle(title)}`.trim());
    const res = await fetch(
      `https://itunes.apple.com/search?term=${term}&media=music&entity=song&limit=1&country=BR`,
      { signal: AbortSignal.timeout(6000) }
    );

    if (res.ok) {
      const data = await res.json();
      const url = data.results?.[0]?.artworkUrl100;

      if (url) {
        const img = await fetch(url.replace("100x100bb", "600x600bb"), {
          signal: AbortSignal.timeout(8000),
        });

        if (img.ok) {
          const buf = Buffer.from(await img.arrayBuffer());
          result = `data:image/jpeg;base64,${buf.toString("base64")}`;
        }
      }
    } else {
      failed = true;
      console.warn("[media] capa (internet): resposta", res.status);
    }
  } catch (e) {
    failed = true;
    console.warn("[media] capa (internet):", e.message);
  }

  // só guarda no cache se a busca funcionou (para tentar de novo se foi falha de rede)
  if (!failed) artCache.set(key, result);
  return result;
}

function sendToWindow(data) {
  const win = getWindow();
  if (win && !win.isDestroyed()) {
    win.webContents.send("media:update", data);
  }
}

// Se o Windows não entregou a capa, busca na internet
function maybeFallbackArt(msg) {
  if (!msg.active || msg.thumb !== "" || !msg.title) return;

  const key = `${msg.artist}|${msg.title}`;
  if (key === fallbackKey) return;
  fallbackKey = key;

  fetchArtwork(msg.title, msg.artist).then((thumb) => {
    if (!thumb) {
      console.warn(`[media] capa (internet): nada encontrado para "${msg.artist} - ${msg.title}"`);
      return;
    }

    console.warn(`[media] capa (internet): achou para "${msg.artist} - ${msg.title}"`);

    if (!state.active || `${state.artist}|${state.title}` !== key) return; // a música mudou
    if (state.thumb) return; // a capa real chegou primeiro

    state = { ...state, thumb };
    sendToWindow({ ...state });
  });
}

function handleLine(line) {
  let msg;
  try {
    msg = JSON.parse(line);
  } catch {
    return;
  }

  if (msg.error && msg.error !== lastError) {
    lastError = msg.error;
    console.warn("[media]", msg.error);
  }
  if (msg.thumbError) console.warn("[media] capa do Windows:", msg.thumbError);

  // guarda o estado completo (inclui a capa) para quando o widget abrir
  if (!msg.active) {
    state = { active: false };
    fallbackKey = "";
  } else {
    state = {
      ...msg,
      thumb: msg.thumb !== undefined ? msg.thumb : state.thumb ?? null,
    };
  }

  sendToWindow(msg);
  maybeFallbackArt(msg);
}

function start() {
  if (process.platform !== "win32" || stopping) return;

  const file = path.join(app.getPath("temp"), "meu-assistente-media.ps1");
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

  proc.stderr.on("data", (d) => console.warn("[media]", String(d).trim()));
  proc.on("error", (e) => console.warn("[media] erro:", e.message));

  proc.on("exit", () => {
    proc = null;
    buffer = "";
    state = { active: false };
    if (!stopping && restarts < 5) {
      restarts++;
      setTimeout(start, 3000);
    }
  });
}

export function startMedia(windowGetter) {
  getWindow = windowGetter;
  start();
}

export function stopMedia() {
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

ipcMain.handle("media:get", () => state);

ipcMain.on("media:command", (_event, cmd) => {
  if (typeof cmd !== "string") return;

  const ok =
    ["toggle", "next", "previous"].includes(cmd) ||
    /^seek \d{1,6}(\.\d+)?$/.test(cmd);

  if (ok && proc && proc.stdin.writable) proc.stdin.write(cmd + "\n");
});

ipcMain.on("media:open", () => {
  shell.openExternal("spotify:").catch(() => {});
});