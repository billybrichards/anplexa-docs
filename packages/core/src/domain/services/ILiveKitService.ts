/**
 * LiveKit Service Interface
 *
 * Defines the contract for LiveKit voice/video call integration.
 * Handles token generation, room management, and agent dispatch.
 *
 * NOTE: Webhook verification is intentionally NOT in this interface because
 * it's async and tightly coupled to the livekit-server-sdk's WebhookReceiver.
 * Use LiveKitService.receiveWebhook() directly in webhook route handlers.
 */

export interface LiveKitTokenOptions {
  identity: string;
  roomName: string;
  metadata?: Record<string, unknown>;
}

export interface ILiveKitService {
  /**
   * Generate a LiveKit access token for a participant
   */
  generateToken(identity: string, roomName: string, metadata?: Record<string, unknown>): Promise<string>;

  /**
   * Create a LiveKit room
   */
  createRoom(roomName: string, metadata?: Record<string, unknown>): Promise<void>;

  /**
   * Dispatch an agent to a LiveKit room
   */
  dispatchAgent(roomName: string, agentName: string, metadata?: Record<string, unknown>): Promise<void>;
}
