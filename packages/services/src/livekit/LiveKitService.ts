import {
  AccessToken,
  RoomServiceClient,
  AgentDispatchClient,
  WebhookReceiver,
} from 'livekit-server-sdk';
import type { ILiveKitService } from '@anplexa/core';

export interface LiveKitServiceConfig {
  url: string;
  apiKey: string;
  apiSecret: string;
}

/**
 * LiveKit integration service.
 *
 * Wraps livekit-server-sdk to provide token generation, room management,
 * agent dispatch, and webhook verification for voice/video calls.
 */
export class LiveKitService implements ILiveKitService {
  private readonly config: LiveKitServiceConfig;
  private readonly roomService: RoomServiceClient;
  private readonly agentDispatch: AgentDispatchClient;
  private readonly webhookReceiver: WebhookReceiver;

  constructor(config: LiveKitServiceConfig) {
    this.config = config;
    this.roomService = new RoomServiceClient(config.url, config.apiKey, config.apiSecret);
    this.agentDispatch = new AgentDispatchClient(config.url, config.apiKey, config.apiSecret);
    this.webhookReceiver = new WebhookReceiver(config.apiKey, config.apiSecret);
  }

  async generateToken(
    identity: string,
    roomName: string,
    metadata?: Record<string, unknown>,
  ): Promise<string> {
    const token = new AccessToken(this.config.apiKey, this.config.apiSecret, {
      identity,
      metadata: metadata ? JSON.stringify(metadata) : undefined,
    });

    token.addGrant({
      roomJoin: true,
      room: roomName,
      canPublish: true,
      canSubscribe: true,
      canPublishData: true,
    });

    return token.toJwt();
  }

  async createRoom(
    roomName: string,
    metadata?: Record<string, unknown>,
  ): Promise<void> {
    await this.roomService.createRoom({
      name: roomName,
      emptyTimeout: 300, // 5 min before auto-close if empty
      metadata: metadata ? JSON.stringify(metadata) : undefined,
    });
  }

  async dispatchAgent(
    roomName: string,
    agentName: string,
    metadata?: Record<string, unknown>,
  ): Promise<void> {
    await this.agentDispatch.createDispatch(roomName, agentName, {
      metadata: metadata ? JSON.stringify(metadata) : undefined,
    });
  }

  /**
   * Receive and validate a webhook event from LiveKit.
   * This is the recommended async method for webhook endpoints.
   *
   * @param body - Raw request body string
   * @param authHeader - Authorization header value
   * @returns Parsed webhook event
   * @throws If the signature is invalid
   */
  async receiveWebhook(body: string, authHeader: string) {
    return this.webhookReceiver.receive(body, authHeader);
  }

  /** Expose the WebSocket URL for frontend connection */
  get wsUrl(): string {
    return this.config.url;
  }
}
