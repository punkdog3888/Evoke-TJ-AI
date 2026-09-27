const OLLAMA_PORT = "11500"; // must match OLLAMA_HOST port set in main.js
const OLLAMA_URL = `http://127.0.0.1:${OLLAMA_PORT}/api/chat`;
const MODEL = "qwen2.5:0.5b"; // must match the model name baked into resources/models
const MAX_HISTORY = 10;

// TJ's personality/backstory/rules live in character.md, not here.
// Edit that file directly to change how TJ behaves — no code editing needed.
let history = []; // populated once character.md loads, see loadCharacter() below

const chatEl = document.getElementById("chat");
const inputEl = document.getElementById("input");
const sendBtn = document.getElementById("send");
const statusEl = document.getElementById("status");
const splashEl = document.getElementById("splash");
const splashSubEl = document.getElementById("splashSub");
const splashFillEl = document.getElementById("splashFill");
const splashPctEl = document.getElementById("splashPct");

const BOOT_MESSAGES = [
  "SYNAPTIC INTERFACE — INITIALIZING",
  "NEURAL PATTERN 0x7F — LOADING",
  "CIRCUIT-NODE HANDSHAKE",
  "CALIBRATING OPTICAL SENSORS",
  "SYNAPTIC INTERFACE — ONLINE"
];

// ---- TOOLS ----------------------------------------------------------
// Ollama supports tool calling for compatible models: the model can
// request a tool by name instead of answering directly, we run the
// real function, then send the result back so the model can respond
// in character with an accurate answer. Reliability of tool calling
// depends heavily on model size — small models (like qwen2.5:0.5b)
// may not call tools consistently. Test after any model change.

const TOOLS = [
  {
    type: "function",
    function: {
      name: "calculator",
      description:
        "Evaluates a mathematical expression and returns the result. Supports arithmetic, trigonometry (sin, cos, tan, in radians unless degrees are converted, e.g. '30*pi/180'), square roots, and logs. Use this for any math question rather than guessing the answer.",
      parameters: {
        type: "object",
        properties: {
          expression: {
            type: "string",
            description: "A math expression, e.g. '(12 + 8) * 3', 'sqrt(144)', or 'sin(pi/2)'"
          }
        },
        required: ["expression"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "calculus",
      description:
        "Computes an exact derivative or integral of a mathematical expression. Use this instead of guessing whenever asked to differentiate or integrate something.",
      parameters: {
        type: "object",
        properties: {
          operation: {
            type: "string",
            enum: ["derivative", "integral"],
            description: "Whether to differentiate or integrate the expression"
          },
          expression: {
            type: "string",
            description: "The expression in terms of the variable, e.g. 'x^3 + 2*x' or 'sin(x)*x'"
          },
          variable: {
            type: "string",
            description: "The variable to differentiate/integrate with respect to, e.g. 'x'"
          },
          lower_bound: {
            type: "string",
            description: "Optional. Lower bound for a definite integral. Omit for an indefinite integral or for derivatives."
          },
          upper_bound: {
            type: "string",
            description: "Optional. Upper bound for a definite integral. Omit for an indefinite integral or for derivatives."
          }
        },
        required: ["operation", "expression", "variable"]
      }
    }
  }
];

// Evaluates a math expression using nerdamer — handles plain arithmetic,
// trig functions (sin, cos, tan, etc.), sqrt, logs, constants like pi,
// and returns exact values where possible (e.g. sin(30*pi/180) -> 1/2).
// Safe by construction: nerdamer parses math syntax only, it never
// executes arbitrary JavaScript.
function safeEvalMath(expression) {
  const result = nerdamer(expression).evaluate();
  const text = result.toString();
  if (text === expression || text.includes("Symbol") || text === "") {
    throw new Error("Could not evaluate expression.");
  }
  return text;
}

function runTool(name, args) {
  if (name === "calculator") {
    try {
      return { result: safeEvalMath(args.expression) };
    } catch (err) {
      return { error: "Could not evaluate that expression." };
    }
  }

  if (name === "calculus") {
    try {
      if (args.operation === "derivative") {
        const result = nerdamer.diff(args.expression, args.variable).toString();
        return { result };
      }

      if (args.operation === "integral") {
        if (args.lower_bound !== undefined && args.upper_bound !== undefined
            && args.lower_bound !== null && args.upper_bound !== null
            && args.lower_bound !== "" && args.upper_bound !== "") {
          // definite integral — evaluate to a number
          const expr = `defint(${args.expression}, ${args.lower_bound}, ${args.upper_bound}, ${args.variable})`;
          const result = nerdamer(expr).evaluate().toString();
          return { result };
        }
        // indefinite integral — symbolic antiderivative
        const result = nerdamer.integrate(args.expression, args.variable).toString() + " + C";
        return { result };
      }

      return { error: `Unknown calculus operation: ${args.operation}` };
    } catch (err) {
      return { error: "Could not compute that — check the expression is valid." };
    }
  }

  return { error: `Unknown tool: ${name}` };
}

// Sends the current history to Ollama and returns the parsed response.
async function callModel(messages) {
  const res = await fetch(OLLAMA_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: MODEL,
      messages,
      tools: TOOLS,
      stream: false,
      options: {
        num_predict: 4096,
        num_ctx: 8192,
        temperature: 0.7,
        stop: ["Roman:", "\nRoman", "You:"]
      }
    })
  });
  return res.json();
}
// -----------------------------------------------------------------

function addBubble(role, text) {
  const wrap = document.createElement("div");
  wrap.className = `msg ${role === "user" ? "user" : "assistant"}`;
  const bubble = document.createElement("div");
  bubble.className = "bubble";
  bubble.textContent = text;
  wrap.appendChild(bubble);
  chatEl.appendChild(wrap);
  chatEl.scrollTop = chatEl.scrollHeight;
  return bubble;
}

function trimHistory() {
  if (history.length > MAX_HISTORY + 1) {
    history = [history[0], ...history.slice(-MAX_HISTORY)];
  }
}

async function loadCharacter() {
  try {
    const res = await fetch("character.md");
    const text = await res.text();
    history = [{ role: "system", content: text.trim() }];
  } catch (err) {
    console.error("Failed to load character.md", err);
    splashSubEl.textContent = "CHARACTER FILE MISSING";
    history = [{ role: "system", content: "You are TJ, a helpful robot dog companion." }]; // fallback
  }
}

async function waitForOllama() {
  const maxWait = 60;
  for (let i = 0; i < maxWait; i++) {
    try {
      const res = await fetch(`http://127.0.0.1:${OLLAMA_PORT}/api/tags`);
      if (res.ok) {
        splashFillEl.style.width = "100%";
        splashPctEl.textContent = "100%";
        splashSubEl.textContent = BOOT_MESSAGES[BOOT_MESSAGES.length - 1];
        statusEl.textContent = "online";
        sendBtn.disabled = false;
        setTimeout(() => splashEl.classList.add("hidden"), 400);
        return;
      }
    } catch (e) {
      // not up yet
    }

    const pct = Math.min(95, Math.round((i / maxWait) * 100));
    splashFillEl.style.width = pct + "%";
    splashPctEl.textContent = pct + "%";
    splashSubEl.textContent = BOOT_MESSAGES[Math.min(
      Math.floor(i / 3),
      BOOT_MESSAGES.length - 2
    )];
    statusEl.textContent = `starting… (${i + 1}s)`;
    await new Promise((r) => setTimeout(r, 1000));
  }
  splashSubEl.textContent = "FAILED TO ESTABLISH LINK";
  statusEl.textContent = "failed to start";
}

async function sendMessage() {
  const text = inputEl.value.trim();
  if (!text) return;

  inputEl.value = "";
  sendBtn.disabled = true;
  addBubble("user", text);
  history.push({ role: "user", content: text });

  const thinkingBubble = addBubble("assistant", "…");

  try {
    let data = await callModel(history);

    // If the model requested a tool, run it and let the model respond again
    // with the real result available to it.
    if (data.message.tool_calls && data.message.tool_calls.length > 0) {
      history.push(data.message);

      for (const call of data.message.tool_calls) {
        const rawArgs = call.function.arguments;
        const args = typeof rawArgs === "string" ? JSON.parse(rawArgs) : rawArgs;
        const toolResult = runTool(call.function.name, args);
        history.push({ role: "tool", content: JSON.stringify(toolResult) });
      }

      data = await callModel(history);
    }

    let reply = data.message.content.replace(/^TJ:\s*/i, "").trim();
    // Backstop in case the model still emits LaTeX delimiters despite the
    // prompt rule — strips \( \) \[ \] and $ wrappers. Doesn't convert the
    // math commands inside (e.g. \frac{}{}), just removes the bracketing.
    reply = reply
      .replace(/\\\(|\\\)|\\\[|\\\]/g, "")
      .replace(/\$\$?/g, "");

    thinkingBubble.textContent = reply;
    history.push({ role: "assistant", content: reply });
    trimHistory();
  } catch (err) {
    thinkingBubble.textContent = "[connection to TJ lost — is the app still starting up?]";
    console.error(err);
  } finally {
    sendBtn.disabled = false;
    inputEl.focus();
  }
}

sendBtn.addEventListener("click", sendMessage);
inputEl.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
});

sendBtn.disabled = true;
loadCharacter().then(waitForOllama);
