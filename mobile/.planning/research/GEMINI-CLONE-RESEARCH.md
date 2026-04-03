I will now conduct comprehensive research on the best open-source React Native Expo ChatGPT clones for production use, specifically evaluating them against your required tech stack (Expo Router, Reanimated, Keyboard Controller, etc.) and identifying high-quality, extensible architectures.

I will now specifically analyze the repositories you mentioned, as well as several others, to verify their tech stacks against your requirements, focusing on performance-oriented libraries like legend-list, react-native-keyboard-controller, and Zeego.

I will now conduct a targeted search for React Native AI chat repositories that specifically use `legend-list`, `react-native-keyboard-controller`, and `Zeego`, as these are indicators of a highly sophisticated, production-grade architecture for 2025. I will also investigate the `aws-samples` reference to determine if a React Native equivalent exists.

I will now perform a more focused search for AI chat repositories that use these specific libraries independently, as well as a search for `aws-samples/swift-chat` to understand its relevance to your React Native-based request.

I will now search for the `aws-samples/swift-chat` repository and its React Native equivalents, while also conducting a broader search for 2025's best React Native AI chat starters to manually verify their dependencies for libraries like `legend-list` and `react-native-keyboard-controller`.

I will now search for `aws-samples` + `react native` + `chat` to find any relevant repositories, and also specifically examine `Galaxies-dev/chatgpt-clone-react-native` for updates related to `legend-list` or `react-native-keyboard-controller`, and finally compare the use of `FlashList` versus `legend-list` in AI chat clones.

I will now investigate the use of advanced libraries like `legend-list`, `react-native-keyboard-controller`, and `Zeego` in the top repositories, including `Galaxies-dev/chatgpt-clone-react-native`, `dabit3/react-native-ai`, and others, by searching for their `package.json` contents or mentions of these libraries.

I will now investigate the use of `legend-list` and `react-native-keyboard-controller` in AI chat clones, specifically checking the dependencies of `dabit3/react-native-ai` and `software-mansion-labs/private-mind` for high-quality, performance-oriented implementations.

I will now perform a final check on `dabit3/react-native-ai` to assess its 2025 maintenance status and whether it has integrated `legend-list` or `react-native-keyboard-controller`, while also searching for any other full-blown ChatGPT clones that might already incorporate these high-performance libraries.

The following report evaluates the current landscape of open-source React Native Expo ChatGPT clones for production use in 2025-2026, specifically tailored to your high-performance tech stack requirements.

### **Executive Summary**
For a production-grade AI chat application ("Loom") in 2025, no single repository perfectly combines all your requested "bleeding-edge" libraries (specifically **Legend List** + **Keyboard Controller**) with a full-featured "ChatGPT clone" scaffolding (Auth, IAP, Multi-provider).

The recommended strategy is a **hybrid approach**:
1.  **Baseline:** Use **`Galaxies-dev/chatgpt-clone-react-native`** for the production-ready infrastructure (Expo Router, Clerk, RevenueCat, Zeego).
2.  **Performance Layer:** Reference the **`LegendApp/legend-list`** example for the chat feed implementation to replace `FlashList` and integrate `react-native-keyboard-controller`.

---

### **Detailed Findings**

#### **1. Galaxies-dev/chatgpt-clone-react-native (Simon Grimm)**
*   **Best For:** Production Scaffolding & SaaS Features.
*   **Tech Stack:** Expo Router (v3), TypeScript, Clerk (Auth), RevenueCat (IAP), Zeego (Context Menus), FlashList, Reanimated 3, MMKV (Storage).
*   **Strengths:** Most "App Store Ready" open-source project. It mimics the ChatGPT mobile UI perfectly and includes the "boring" but necessary production features like subscription paywalls and authentication.
*   **Weaknesses:** Uses `FlashList` instead of `legend-list`. Does not use `react-native-keyboard-controller` natively (uses standard KeyboardAvoidingView).
*   **Architecture:** Highly extensible, clean folder structure following modern Expo patterns.

#### **2. LegendApp/legend-list (Example App)**
*   **Best For:** Reference for the "Infinite Scroll" & Keyboard Performance.
*   **Tech Stack:** **Legend List**, **react-native-keyboard-controller**, Expo, Reanimated.
*   **Strengths:** This is the *only* repo that demonstrates the high-performance integration of `legend-list` and `KeyboardChatScrollView`. It solves the "inversion hack" problem common in React Native chat apps, allowing for 120 FPS scrolling and keyboard interactions.
*   **Weaknesses:** It is an example app, not a feature-complete ChatGPT clone (no multi-provider support or auth).
*   **Key Innovation:** Uses `KeyboardAvoidingLegendList` which is specifically optimized for chat inputs.

#### **3. dabit3/react-native-ai (Nader Dabit)**
*   **Best For:** Multi-Provider Support & Advanced Theming.
*   **Tech Stack:** Expo, Multi-LLM (OpenAI, Claude, Gemini, Mistral), ByteScale (Images), Custom Theming Engine.
*   **Strengths:** Excellent architecture for supporting multiple AI providers out of the box. Highly modular backend-proxy setup.
*   **Weaknesses:** Still relies on `FlashList` and custom keyboard handling. Navigation is standard `react-navigation`, not `Expo Router` in all branches.

#### **4. Software Mansion / Private Mind**
*   **Best For:** On-Device AI & Reanimated Excellence.
*   **Tech Stack:** **ExecuTorch** (Local Llama), Reanimated 3, FlashList, Expo.
*   **Strengths:** Created by the maintainers of Reanimated and Gesture Handler. It represents the absolute gold standard for gesture-based interactions and local AI inference.
*   **Weaknesses:** Very specialized for local models (ExecuTorch), might be overkill if you only need API-based streaming.

---

### **Sources & Confidence Levels**

| Source | Content | Confidence |
| :--- | :--- | :--- |
| **Galaxies-dev / GitHub** | Full SaaS clone with Clerk/RevenueCat/Zeego. | **HIGH** |
| **LegendApp / GitHub** | `legend-list` + `keyboard-controller` chat implementation. | **HIGH** |
| **dabit3 / GitHub** | Multi-provider framework architecture. | **HIGH** |
| **Software Mansion / GitHub** | On-device AI and high-end animations. | **HIGH** |
| **AWS-Samples / GitHub** | `amazon-bedrock-react-native-chat-app` (Enterprise Reference). | **MEDIUM** |

---

### **Open Questions / Gaps**
*   **Zeego Context Menus:** While `Galaxies-dev` uses Zeego, it is primarily for simple actions. Implementing custom tool-call visualizations inside a Zeego menu for "Permissions Management" (as required for Loom) will require custom bridging between Reanimated and Zeego's native components.
*   **Expo Router v3 + Drawer:** Many clones use `Stack` or `Tabs`. A high-quality **Drawer** implementation (similar to the official ChatGPT app) is best found in the `Galaxies-dev` repo, but ensuring it plays nicely with `react-native-keyboard-controller` across all iOS variants requires careful testing.
*   **Multi-Provider State:** How to manage the complex state of 3+ providers (Claude Code, Codex, Gemini) while maintaining a single, performant `legend-list` that handles varying tool-call schemas in real-time.

### **Recommendation for "Loom" Baseline**
1.  **Clone** `Galaxies-dev/chatgpt-clone-react-native` to get the Expo Router, Auth, and Zeego setup.
2.  **Integrate** `react-native-keyboard-controller` immediately to replace the default keyboard handling.
3.  **Swap** `FlashList` for `legend-list` using the pattern from `LegendApp/legend-list/example`.
4.  **Extend** the message component to handle the custom "Tool Call Visualization" and "Permission Management" features unique to Loom.