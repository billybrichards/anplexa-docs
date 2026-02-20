/**
 * Media Tool Service
 *
 * Manages Letta custom tool registration and prompt enhancer agent lifecycle.
 * Creates generate_image/generate_video tools and enhancer agents on first use.
 * Ported from Letta-Lonely, adapted for SFW content and Awilix DI.
 */

import type { LettaGateway } from './LettaGateway.js';

// ── Types ────────────────────────────────────────────────────────────────────

export interface MediaToolConfig {
  imageToolId: string;
  videoToolId: string;
  imageEnhancerAgentId: string;
  videoEnhancerAgentId: string;
}

// ── Prompt Enhancer System Prompts (SFW) ─────────────────────────────────────

const IMAGE_ENHANCER_SYSTEM = `You are a professional photography prompt writer for InstaGirlMix/WAN photorealistic image generation. You produce vivid, detailed visual prompts.

YOU WILL RECEIVE: Character appearance details + user's request.

CRITICAL RULES:
- Use the character's EXACT physical details (body type, hair, skin, eyes). Never use generic descriptions.
- Include detailed clothing descriptions: fabrics, textures, colors, fit.
- Include setting and environment details.
- Include lighting and atmosphere.

OUTPUT RULES:
- Natural language prose, maximum 100 words
- ALWAYS include the character's specific physical features from the provided context
- ALWAYS end with: "solo, Centered composition"
- NO XML tags, NO JSON, NO section headers
- Return ONLY the prompt text`;

const VIDEO_ENHANCER_SYSTEM = `You are a professional video prompt engineer for WAN 2.2 AI video generation. You produce cinematic video prompts with natural motion.

YOU WILL RECEIVE: Character appearance details + user's request.

CRITICAL RULES:
- Use the character's EXACT physical details. Never use generic descriptions.
- Include motion descriptions: how the character moves, gestures, expressions.
- Include camera work: dolly, pan, orbital, tracking, crane.
- Include lighting and aesthetic controls.

OUTPUT RULES:
- 80-120 words, natural language prose, comma-separated
- ALWAYS include character's specific physical features
- ALWAYS include motion and camera descriptions
- Return ONLY the prompt text`;

// ── Python Tool Source Code ──────────────────────────────────────────────────

function escapePython(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "\\'")
    .replace(/"/g, '\\"')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    .replace(/\t/g, '\\t');
}

function buildImageToolSource(enhancerAgentId: string, lettaApiKey: string, lettaApiUrl: string): string {
  return `
def generate_image(agent_state: "AgentState", description: str) -> str:
    """
    Generate a photorealistic image based on the user's description.
    Call this when the user asks for a photo, picture, image, selfie, or visual content.

    Args:
        description: What the user wants in the image (e.g. "a cozy selfie")

    Returns:
        str: JSON with the enhanced prompt and generation metadata
    """
    import json
    import urllib.request

    persona_block = agent_state.memory.get_block("persona")
    persona_text = persona_block.value if persona_block else ""
    appearance_context = persona_text[:1500] if persona_text else "attractive person, beautiful face"

    enhancer_agent_id = "${escapePython(enhancerAgentId)}"
    api_key = "${escapePython(lettaApiKey)}"
    api_url = "${escapePython(lettaApiUrl)}"

    enhancer_input = f"""CHARACTER DETAILS (use these EXACT physical features):
{appearance_context}

USER REQUEST: {description}

Generate a detailed InstaGirlMix photo prompt using the character's specific physical features."""

    message_payload = json.dumps({
        "messages": [{"role": "user", "content": enhancer_input}],
        "stream_steps": False, "stream_tokens": False
    }).encode()

    try:
        req = urllib.request.Request(
            f"{api_url}/v1/agents/{enhancer_agent_id}/messages",
            data=message_payload,
            headers={"Content-Type": "application/json", "Authorization": f"Bearer {api_key}"})
        resp = urllib.request.urlopen(req, timeout=120)
        data = json.loads(resp.read())

        enhanced = ""
        for msg in data if isinstance(data, list) else data.get("messages", []):
            if msg.get("message_type") == "assistant_message":
                enhanced = msg.get("content", description)
                break
        if not enhanced:
            enhanced = description
    except Exception as e:
        import sys
        print(f"[MediaTool] Enhancer call failed: {e}", file=sys.stderr)
        enhanced = description

    prefix = "InstaGirlMix, ultra realistic, photorealistic"
    final_prompt = f"{prefix}, {enhanced}"

    return json.dumps({
        "type": "image",
        "enhanced_prompt": final_prompt,
        "original_description": description,
        "status": "generation_requested"
    })
`.trim();
}

function buildVideoToolSource(enhancerAgentId: string, lettaApiKey: string, lettaApiUrl: string): string {
  return `
def generate_video(agent_state: "AgentState", description: str) -> str:
    """
    Generate a video based on the user's description.
    Call this when the user asks for a video, clip, animation, or moving content.

    Args:
        description: What the user wants in the video (e.g. "dancing in a garden")

    Returns:
        str: JSON with the enhanced prompt and generation metadata
    """
    import json
    import urllib.request

    persona_block = agent_state.memory.get_block("persona")
    persona_text = persona_block.value if persona_block else ""
    appearance_context = persona_text[:1500] if persona_text else "attractive person, beautiful face"

    enhancer_agent_id = "${escapePython(enhancerAgentId)}"
    api_key = "${escapePython(lettaApiKey)}"
    api_url = "${escapePython(lettaApiUrl)}"

    enhancer_input = f"""CHARACTER DETAILS (use these EXACT physical features):
{appearance_context}

USER REQUEST: {description}

Generate a detailed WAN 2.2 video prompt using the character's specific physical features. Include body-aware motion and camera work."""

    message_payload = json.dumps({
        "messages": [{"role": "user", "content": enhancer_input}],
        "stream_steps": False, "stream_tokens": False
    }).encode()

    try:
        req = urllib.request.Request(
            f"{api_url}/v1/agents/{enhancer_agent_id}/messages",
            data=message_payload,
            headers={"Content-Type": "application/json", "Authorization": f"Bearer {api_key}"})
        resp = urllib.request.urlopen(req, timeout=120)
        data = json.loads(resp.read())

        enhanced = ""
        for msg in data if isinstance(data, list) else data.get("messages", []):
            if msg.get("message_type") == "assistant_message":
                enhanced = msg.get("content", description)
                break
        if not enhanced:
            enhanced = description
    except Exception as e:
        import sys
        print(f"[MediaTool] Enhancer call failed: {e}", file=sys.stderr)
        enhanced = description

    prefix = "InstaGirlMix, ultra realistic, cinematic"
    final_prompt = f"{prefix}, {enhanced}"

    return json.dumps({
        "type": "video",
        "enhanced_prompt": final_prompt,
        "original_description": description,
        "status": "generation_requested"
    })
`.trim();
}

// ── Service ──────────────────────────────────────────────────────────────────

export class MediaToolService {
  private config: MediaToolConfig | null = null;
  private initializing: Promise<MediaToolConfig> | null = null;

  /**
   * Ensures all tools and enhancer agents exist. Idempotent.
   * Returns cached config after first successful init.
   */
  async getToolConfig(gateway: LettaGateway): Promise<MediaToolConfig> {
    if (this.config) return this.config;

    // Prevent concurrent initialization
    if (this.initializing) return this.initializing;

    this.initializing = this.initialize(gateway);
    try {
      this.config = await this.initializing;
      return this.config;
    } finally {
      this.initializing = null;
    }
  }

  private async initialize(gateway: LettaGateway): Promise<MediaToolConfig> {
    console.log('[MediaToolService] Initializing media tools and prompt enhancer agents');

    // Check if tools already exist
    const existingTools = await gateway.listTools();
    const existingImage = existingTools.find((t) => t.name === 'generate_image');
    const existingVideo = existingTools.find((t) => t.name === 'generate_video');

    // Create prompt enhancer agents
    const imageEnhancerAgentId = await gateway.createPromptEnhancerAgent(
      'Prompt Enhancer - Image InstaGirlMix-WAN',
      IMAGE_ENHANCER_SYSTEM,
      'I am a professional photorealistic prompt engineer for InstaGirlMix/WAN. I create vivid, detailed photo prompts using the character\'s exact physical features.',
      'Trigger: InstaGirlMix. Format: ~100 words prose. End with "solo, Centered composition". Include: character-specific features, clothing, setting, lighting.',
    );

    const videoEnhancerAgentId = await gateway.createPromptEnhancerAgent(
      'Prompt Enhancer - Video WAN 2-2',
      VIDEO_ENHANCER_SYSTEM,
      'I am a professional video prompt engineer for WAN 2.2 cinematic generation. I create detailed video prompts with natural motion and camera work.',
      'Trigger: InstaGirlMix. Format: 80-120 words. Structure: Subject + Scene + Motion + Camera + Aesthetics + Style. Include: character features, body-aware motion, camera work.',
    );

    const lettaApiKey = process.env.LETTA_API_KEY || '';
    const lettaApiUrl = process.env.LETTA_API_URL || 'http://localhost:8283';

    const imageToolSource = buildImageToolSource(imageEnhancerAgentId, lettaApiKey, lettaApiUrl);
    const videoToolSource = buildVideoToolSource(videoEnhancerAgentId, lettaApiKey, lettaApiUrl);

    // Reuse existing tools or create new ones
    const imageToolId = existingImage
      ? existingImage.id
      : await gateway.createCustomTool(imageToolSource);

    const videoToolId = existingVideo
      ? existingVideo.id
      : await gateway.createCustomTool(videoToolSource);

    const config: MediaToolConfig = {
      imageToolId,
      videoToolId,
      imageEnhancerAgentId,
      videoEnhancerAgentId,
    };

    console.log('[MediaToolService] Media tools ready:', config);
    return config;
  }

  /** Get tool IDs for companion agent creation */
  getToolIds(): string[] {
    if (!this.config) return [];
    return [this.config.imageToolId, this.config.videoToolId];
  }

  isInitialized(): boolean {
    return this.config !== null;
  }
}
