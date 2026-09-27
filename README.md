# TJ — desktop app

A Claude-style chat UI wrapped around a locally-run model via Ollama,
packaged as a single Windows installer. Once installed, students need
zero setup — no Python, no pip, no manual Ollama install, no internet
after install.

## How it works

- **Electron** provides the window + UI (`index.html` / `style.css` / `renderer.js`)
- **main.js** silently launches a *bundled copy* of the Ollama binary as a
  background process when the app starts, pointed at a *bundled copy* of
  the model files — so the student's machine never needs Ollama installed
  separately, and no model download happens on their end.
- **renderer.js** talks to that local Ollama process over plain HTTP
  (`http://127.0.0.1:11434`), exactly like the Python version did, just
  in JavaScript instead of Python.

## One-time setup (on YOUR machine, before building)

### 1. Install Node.js
Download from [nodejs.org](https://nodejs.org) if you don't have it.

### 2. Install dependencies
```
cd tj-app
npm install
```

### 3. Bundle the Ollama binary
Download the actual Ollama executable (NOT the installer — the raw binary)
and place it here:
```
resources/ollama/ollama.exe      (Windows)
```
You can extract this from a normal Ollama install (`C:\Users\<you>\AppData\Local\Programs\Ollama\ollama.exe`
after installing Ollama normally once) or check Ollama's GitHub releases
for a portable build.

### 4. Bundle the model files
After pulling your model normally on your own machine:
```
ollama pull qwen2.5:0.5b
```
Ollama stores the raw model files under:
```
Windows: C:\Users\<you>\.ollama\models
```
Copy that **entire folder's contents** into:
```
resources/models/
```
This is what lets the packaged app run the model with zero download on
the student's end — the multi-hundred-MB model file ships inside your
installer instead.

### 5. Test it locally before packaging
```
npm start
```
The app window should open, show "starting…" briefly while Ollama boots
in the background, then switch to "online" once ready.

### 6. Build the installer
```
npm run dist
```
This produces a `.exe` installer under `dist/` that you can hand to
students directly — they double-click it, it installs like any normal
Windows program, and TJ appears as a desktop app with no terminal
involved at any point.

## Important sizing note

Bundling both Ollama and a model file means your installer will likely
be several hundred MB to a couple GB, depending on the model you choose.
`qwen2.5:0.5b` or `tinyllama` keep this closer to the smaller end and
also run faster on modest school laptops — worth prioritizing speed and
install size over raw model quality for this deployment.

## Changing the model
If you swap models, update `MODEL` in `renderer.js` to match the model's
exact name/tag, and make sure the matching files are the ones copied
into `resources/models/`.
