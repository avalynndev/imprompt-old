import { useEffect } from "react";
import { streamText } from "ai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";

const isChatGPT = window.location.hostname.includes("chat.openai.com");
const isGemini = window.location.hostname.includes("gemini.google.com");

const geminiKey = "AIzaSyCm2JNj8fupxcTclv_s5mDGvV0Jy96f2RI";

const google = createGoogleGenerativeAI({
  apiKey: geminiKey,
});

function Main() {
  useEffect(() => {
    if (!isChatGPT && !isGemini) return;

    // Function to find and observe text areas and send buttons
    const setupObserver = () => {
      // Find all input area containers (Gemini/ChatGPT)
      const inputAreaContainers = document.querySelectorAll(
        ".input-area-container, .chat-input, .composer, .PromptTextarea__Positioner"
      );

      inputAreaContainers.forEach((container) => {
        // Check if enhance button already exists in this container
        if (container.querySelector(".imprompt-button")) return;

        // Find the send button inside this container
        const sendButton = container.querySelector(
          ".send-button-container button.send-button, [data-testid='send-button'], .send-button"
        );
        if (!sendButton) return;

        // Find the textarea/input for this container
        const textarea = container.querySelector(
          "textarea, [contenteditable='true'], [data-testid='chat-input'], .ql-editor"
        );
        if (!textarea) return;

        // Create enhance button with pure CSS
        const enhanceButton = document.createElement("button");
        enhanceButton.innerHTML = "✨";
        enhanceButton.className = "imprompt-button";
        enhanceButton.setAttribute("aria-label", "Imprompt");
        enhanceButton.setAttribute("title", "Imprompt");

        // Add CSS styles directly
        enhanceButton.style.cssText = `
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 36px;
          height: 36px;
          border-radius: 6px;
          font-size: 14px;
          font-weight: 500;
          border: 2px solid #27272a;
          cursor: pointer;
          background-color: #27272a;
          color: #ffffff;
          transition: all 0.2s ease;
          margin-right: 8px;
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
        `;

        // Add click handler
        enhanceButton.addEventListener("click", async () => {
          const currentText = textarea
            ? (textarea instanceof HTMLTextAreaElement
                ? textarea.value
                : textarea.textContent) || ""
            : "";

          if (!currentText.trim()) {
            alert("Please type something first!");
            return;
          }

          enhanceButton.disabled = true;
          enhanceButton.innerHTML = "🔄";
          enhanceButton.style.opacity = "0.7";
          enhanceButton.style.cursor = "not-allowed";

          try {
            let streamedText = "";
            const prompt = `You are an expert prompt engineer. Your task is to rewrite the following user prompt to make it more detailed, specific, and effective for an AI assistant, while strictly maintaining the original intent and context. \n- If the original prompt is vague or unclear, do NOT invent context; instead, briefly analyze what is missing, then provide your best attempt at a more effective version, making reasonable assumptions but keeping the rewrite concise and actionable.\n- Do NOT include explanations or meta-commentary in your output—just the improved prompt.\n- If the original is already clear and specific, simply polish it for clarity and completeness.\n\nOriginal prompt:\n"""\n${currentText}\n"""\n\nImproved prompt:`;

            const { textStream } = await streamText({
              model: google("gemini-2.5-pro"),
              prompt,
            });

            for await (const textPart of textStream) {
              streamedText += textPart;
              if (textarea instanceof HTMLTextAreaElement) {
                textarea.value = streamedText;
              } else if (textarea) {
                textarea.textContent = streamedText;
              }
              if (textarea) {
                textarea.dispatchEvent(new Event("input", { bubbles: true }));
                textarea.dispatchEvent(new Event("change", { bubbles: true }));
              }
            }

            enhanceButton.innerHTML = "✅";
            setTimeout(() => {
              enhanceButton.innerHTML = "✨";
            }, 2000);
          } catch (error) {
            console.error("Error enhancing prompt:", error);
            alert("Error enhancing prompt. Please check your API key.");
            enhanceButton.innerHTML = "❌";
            setTimeout(() => {
              enhanceButton.innerHTML = "✨";
            }, 2000);
          } finally {
            enhanceButton.disabled = false;
            enhanceButton.style.opacity = "1";
            enhanceButton.style.cursor = "pointer";
          }
        });

        // Insert the enhance button before the send button container (outside of it)
        if (
          sendButton.parentElement &&
          sendButton.parentElement.parentElement
        ) {
          const sendButtonContainer = sendButton.parentElement;
          const parentOfSendButtonContainer = sendButtonContainer.parentElement;
          parentOfSendButtonContainer.insertBefore(
            enhanceButton,
            sendButtonContainer
          );
        }
      });
    };

    // Run initially
    setupObserver();

    // Set up mutation observer to handle dynamic content
    const observer = new MutationObserver(() => {
      setupObserver();
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    return () => {
      observer.disconnect();
    };
  }, []);

  if (!isChatGPT && !isGemini) {
    return null;
  }

  return null; // The button is injected directly into the DOM
}

export default Main;
