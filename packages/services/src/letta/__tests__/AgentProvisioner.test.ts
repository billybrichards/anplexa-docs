import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AgentProvisioner } from '../AgentProvisioner.js';

function createMockGateway() {
  return {
    createMemoryBlocks: vi.fn().mockImplementation(async (blocks: { label: string }[]) =>
      blocks.map((b, i) => ({
        id: `block_${b.label}_${i}`,
        label: b.label,
        value: '',
        limit: 2000,
      })),
    ),
    createAgent: vi.fn().mockResolvedValue({
      id: 'letta-agent-abc123',
      name: 'companion_luna_1234',
    }),
    sendMessage: vi.fn(),
    streamMessage: vi.fn(),
    deleteAgent: vi.fn(),
    getMemoryBlocks: vi.fn(),
    updateMemoryBlock: vi.fn(),
    getAgent: vi.fn(),
    createCustomTool: vi.fn(),
    getTools: vi.fn(),
  };
}

function createMockRepo() {
  return {
    create: vi.fn().mockResolvedValue({}),
    findByCompanionPersona: vi.fn().mockResolvedValue(null),
  };
}

describe('AgentProvisioner', () => {
  let provisioner: AgentProvisioner;
  let mockGateway: ReturnType<typeof createMockGateway>;
  let mockRepo: ReturnType<typeof createMockRepo>;

  beforeEach(() => {
    mockGateway = createMockGateway();
    mockRepo = createMockRepo();
    provisioner = new AgentProvisioner(mockGateway as any, mockRepo);
  });

  it('should provision a new agent with persona + cognitive blocks', async () => {
    const result = await provisioner.provisionCompanionAgent({
      userId: 'user-1',
      companionPersonaId: 'persona-1',
      companionName: 'Luna',
      gender: 'female',
      goal: 'empathetic companion',
    });

    expect(result.lettaAgentId).toBe('letta-agent-abc123');
    expect(result.blockIds).toHaveLength(4); // persona + current_focus + user_model + active_goals

    // Should create blocks (1 call with 4 block defs)
    expect(mockGateway.createMemoryBlocks).toHaveBeenCalledTimes(1);
    const blockDefs = mockGateway.createMemoryBlocks.mock.calls[0][0];
    expect(blockDefs).toHaveLength(4);
    const blockLabels = blockDefs.map((b: any) => b.label);
    expect(blockLabels).toContain('persona');
    expect(blockLabels).toContain('current_focus');
    expect(blockLabels).toContain('user_model');
    expect(blockLabels).toContain('active_goals');

    // Should create agent
    expect(mockGateway.createAgent).toHaveBeenCalledTimes(1);
    const agentCall = mockGateway.createAgent.mock.calls[0][0];
    expect(agentCall.blockIds).toHaveLength(4);
    expect(agentCall.agentType).toBe('companion');

    // Should persist to DB
    expect(mockRepo.create).toHaveBeenCalledTimes(1);
  });

  it('should return existing agent if already provisioned', async () => {
    mockRepo.findByCompanionPersona.mockResolvedValue({
      lettaAgentId: 'existing-agent-id',
    });

    const result = await provisioner.provisionCompanionAgent({
      userId: 'user-1',
      companionPersonaId: 'persona-1',
      companionName: 'Luna',
    });

    expect(result.lettaAgentId).toBe('existing-agent-id');
    expect(mockGateway.createMemoryBlocks).not.toHaveBeenCalled();
    expect(mockGateway.createAgent).not.toHaveBeenCalled();
  });

  it('should work without repository (in-memory mode)', async () => {
    const provisionerNoRepo = new AgentProvisioner(mockGateway as any);

    const result = await provisionerNoRepo.provisionCompanionAgent({
      userId: 'user-1',
      companionPersonaId: 'persona-1',
      companionName: 'Nova',
    });

    expect(result.lettaAgentId).toBe('letta-agent-abc123');
    expect(mockGateway.createAgent).toHaveBeenCalledTimes(1);
  });

  it('should include cognitive instructions in system prompt', async () => {
    await provisioner.provisionCompanionAgent({
      userId: 'user-1',
      companionPersonaId: 'persona-1',
      companionName: 'Luna',
    });

    const agentCall = mockGateway.createAgent.mock.calls[0][0];
    expect(agentCall.system).toContain('COGNITIVE MEMORY SYSTEM');
    expect(agentCall.system).toContain('core_memory_replace');
  });

  it('should use configured model handles', async () => {
    const customProvisioner = new AgentProvisioner(mockGateway as any, mockRepo, {
      chatModel: 'anthropic/claude-sonnet-4-5-20250929',
      embeddingModel: 'ollama/nomic-embed-text:latest',
    });

    await customProvisioner.provisionCompanionAgent({
      userId: 'user-1',
      companionPersonaId: 'persona-1',
      companionName: 'Test',
    });

    const agentCall = mockGateway.createAgent.mock.calls[0][0];
    expect(agentCall.modelHandle).toBe('anthropic/claude-sonnet-4-5-20250929');
    expect(agentCall.contextWindowLimit).toBeUndefined();
  });
});
