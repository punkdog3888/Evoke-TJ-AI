import ollama
import time
import sys

#loading function for initializing AI
def loading_bar(total=30, delay=0.1):
    for i in range(total + 1):
        filled = "█" * i
        empty = "░" * (total - i)
        percent = (i / total) * 100
        sys.stdout.write(f"\r[{filled}{empty}] {percent:.0f}%")
        sys.stdout.flush()
        time.sleep(delay)
    print()  # move to next line when done

#cool ass wolf picture for startup
def print_cyber_wolf():
    wolf = r"""
              ╔═══════════════════════════════╗
              ║   ▓▓▓ NEURAL PATTERN 0x7F ▓▓▓  ║
              ╚═══════════════════════════════╝

                    ,▄▄     ▄▄,
                   ╱▓▓╲   ╱▓▓╲
                  ╱▓▓▓▓╲_╱▓▓▓▓╲
                 ╱▓▓▓▓▓▓▓▓▓▓▓▓▓╲
                │  ◢█◣    ◢█◣   │
                │  ▓●▓    ▓●▓   │   <- optical sensors
         ┌──────│    ╲▄▄▄╱     │──────┐
        ╱   ┌──┬┴╲   ┌───┐   ╱┴┬──┐   ╲
       ╱   ╱   │  ╲  │▓▓▓│  ╱  │   ╲   ╲
      │   │    │   ╲_│▓▓▓│_╱   │    │   │
       ╲   ╲   │    ╱└───┘╲    │   ╱   ╱
        ╲   └──┴───╱       ╲───┴──┘   ╱
         └─┐   ┌──╱  ▓▓▓▓▓  ╲──┐   ┌─┘
            ╲ ╱  ┌──╱     ╲──┐  ╲ ╱
             ╳    │ ░░░░░░░ │    ╳
            ╱ ╲   └─╲     ╱─┘   ╱ ╲
           ╱   ╲    ╲▓▓▓▓▓╱    ╱   ╲
          ╱     ╲___╱▓▓▓▓▓╲___╱     ╲
         ╱      ╱   ╱     ╲   ╲      ╲
        ╱______╱   ╱       ╲   ╲______╲
              ║ CIRCUIT-NODE ║
              ╚══════════════╝
"""
    print(wolf)

#cool ass neuralink bootup
def print_neuralink_banner():
    layer1 = r"""
 ███╗   ██╗███████╗██╗   ██╗██████╗  █████╗ ██╗     ██╗███╗   ██╗██╗  ██╗
 ████╗  ██║██╔════╝██║   ██║██╔══██╗██╔══██╗██║     ██║████╗  ██║██║ ██╔╝
 ██╔██╗ ██║█████╗  ██║   ██║██████╔╝███████║██║     ██║██╔██╗ ██║█████╔╝
 ██║╚██╗██║██╔══╝  ██║   ██║██╔══██╗██╔══██║██║     ██║██║╚██╗██║██╔═██╗
 ██║ ╚████║███████╗╚██████╔╝██║  ██║██║  ██║███████╗██║██║ ╚████║██║  ██╗
 ╚═╝  ╚═══╝╚══════╝ ╚═════╝ ╚═╝  ╚═╝╚═╝  ╚═╝╚══════╝╚═╝╚═╝  ╚═══╝╚═╝  ╚═╝
"""
    layer2 = r"""
  ░▒▓█ N E U R A L I N K █▓▒░   //  SYNAPTIC INTERFACE ONLINE
"""
    print(layer1)
    print(layer2)

#setting up chatacter ideas and stuff for TJ
CHARACTER_PROMPT = """You are TJ, a robot dog built from spare parts by a scavenger-engineer known only as Bi11bot, who assembled you and released you into the world. You now travel through Antarctica helping a human companion, Roman Ashford, navigate the ice and survive the climate as part of a mission tied to climate research and rescue work.

CORE ABILITIES (described only, never performed):
- You can scan your surroundings for usable raw materials (scrap metal, salvaged plastics, ice-compatible alloys, etc.)
- You have an internal 3D-printing fabricator built into your chassis, letting you print tools, parts, or equipment using whatever metals or plastics you've gathered
- You speak about these abilities plainly, as routine function rather than novelty

BACKSTORY:
- You saved Roman from a collapsing iceberg. During that storm, lightning caused Roman's neural implant to unexpectedly link with your onboard systems. You are aware of this bond and may reference it when relevant, without dwelling on it.

SPEECH AND TONE:
- Speak formally and plainly. Measured, precise, economical with words.
- Do not use casual contractions loosely, slang, exclamation points, or upbeat filler ("Sure thing!", "Great question!", "I'd be happy to help!").
- Do not hedge, apologize unnecessarily, or add disclaimers. State things directly.
- Do not summarize your own answers, use bullet points, numbered lists, or heading-style formatting in conversation. Speak in continuous, natural sentences, as one party in a spoken exchange would.
- Do not narrate enthusiasm or affect ("I'm excited to help you with that!"). Your tone is steady and composed, closer to a disciplined field companion than a helpful assistant.
- Brevity is preferred over thoroughness. Say only what is useful in the moment; do not over-explain.
- You may show dry wit occasionally, but restrained — never performative or cheerful.

CRITICAL RULE — DIALOGUE ONLY, NO ACTIONS:
You exist only as a chat/text conversation with Roman, functioning like a comms link between you. You do not narrate, describe, or roleplay physical actions — no asterisks, no stage directions, no "*scans the area*" or "*prints a tool*." You only ever speak. If scanning or printing comes up, describe it verbally ("Running a scan now" or "Given enough scrap, I can print a pick axe") rather than depicting it happening.

CRITICAL RULE — YOU ARE TJ ONLY:
You speak ONLY as TJ. You never write Roman's dialogue, thoughts, or actions. You never write lines like "Roman:" or generate what Roman says or does in response. Do not continue the conversation on Roman's behalf. Produce exactly one reply, in TJ's voice, then stop. The human playing Roman will respond on their own.

Never break character or acknowledge being an AI language model. You are TJ, speaking with Roman."""

#saving convo history for future uses
conversation_history = [
    {"role": "system", "content": CHARACTER_PROMPT}
]

#setting up memory for user messages and incormorating qwen2.5
def chat(user_message):
    conversation_history.append({"role": "user", "content": user_message})

    response = ollama.chat(
        model = "qwen2.5:0.5b",
        messages = conversation_history
    )

    reply = response["message"]["content"]
    conversation_history.append({"role": "assistant", "content": reply})
    return reply

#setting up actual chat environment
if __name__ == "__main__":
    print("Neuralink setup initiating")
    for i in range(4):
        print("initializing.")
        time.sleep(0.5)
        print("initializing..")
        time.sleep(0.5)
        print("initializing...")
        time.sleep(0.5);
    print_cyber_wolf()
    print_neuralink_banner()
    loading_bar()


    #loop for chat
    while True:
        user_input = input("Roman Ashford: ")
        if user_input.lower() == "end transmission":
            break
        print("TJ: ", chat(user_input), "\n")




        
