import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AgentProvisioner } from '../AgentProvisioner.js';
import type { CompanionPersonaInput } from '../CompanionBlockBuilder.js';
import {
  NatalChartData,
  type PlanetPlacement,
} from '@anplexa/core/domain/value-objects/astrology/NatalChartData';
import { ZodiacSign } from '@anplexa/core/domain/value-objects/astrology/ZodiacSign';
import { PersonalityTraits } from '@anplexa/core/domain/value-objects/companion/PersonalityTraits';

function getDegreeForSign(signName: string): number {
  const signs = [
    'aries', 'taurus', 'gemini', 'cancer', 'leo', 'virgo',
    'libra', 'scorpio', 'sagittarius', 'capricorn', 'aquarius', 'pisces',
  ];
  return signs.indexOf(signName) * 30 + 15;
}

function createPlanet(name: string, signName: string): PlanetPlacement {
  const degree = getDegreeForSign(signName);
  return {
    planetName: name,
    sign: ZodiacSign.fromDegree(degree),
    house: null,
    degree,
    speed: 1.0,
    isRetrograde: false,
  };
}

function createMockChart(): NatalChartData {
  return NatalChartData.create({
    planets: {
      sun: createPlanet('Sun', 'leo'),
      moon: createPlanet('Moon', 'pisces'),
      mercury: createPlanet('Mercury', 'virgo'),
      venus: createPlanet('Venus', 'taurus'),
      mars: createPlanet('Mars', 'aries'),
      jupiter: createPlanet('Jupiter', 'sagittarius'),
      saturn: createPlanet('Saturn', 'capricorn'),
      uranus: createPlanet('Uranus', 'aquarius'),
      neptune: createPlanet('Neptune', 'pisces'),
      pluto: createPlanet('Pluto', 'scorpio'),
      northNode: createPlanet('North Node', 'gemini'),
      southNode: createPlanet('South Node', 'sagittarius'),
    },
    houses: [],
    aspects: [],
    dominantElement: 'fire',
    dominantModality: 'cardinal',
    ascendant: null,
    midheaven: null,
  });
}

function createMockCompanion(name = 'Luna'): CompanionPersonaInput {
  return {
    name,
    personalityTraits: PersonalityTraits.create({
      traits: ['Empathetic', 'Warm', 'Intuitive'],
    }),
  };
}

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
      companion: createMockCompanion(),
      chart: createMockChart(),
      userName: 'Alex',
    });

    expect(result.lettaAgentId).toBe('letta-agent-abc123');
    // persona + current_focus + user_model + active_goals + human (from astrology chart)
    expect(result.blockIds).toHaveLength(5);

    // Should create blocks (1 call with 5 block defs)
    expect(mockGateway.createMemoryBlocks).toHaveBeenCalledTimes(1);
    const blockDefs = mockGateway.createMemoryBlocks.mock.calls[0][0];
    expect(blockDefs).toHaveLength(5);
    const blockLabels = blockDefs.map((b: any) => b.label);
    expect(blockLabels).toContain('persona');
    expect(blockLabels).toContain('current_focus');
    expect(blockLabels).toContain('user_model');
    expect(blockLabels).toContain('active_goals');
    expect(blockLabels).toContain('human');

    // Should create agent
    expect(mockGateway.createAgent).toHaveBeenCalledTimes(1);
    const agentCall = mockGateway.createAgent.mock.calls[0][0];
    expect(agentCall.blockIds).toHaveLength(5);
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
      companion: createMockCompanion(),
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
      companion: createMockCompanion('Nova'),
    });

    expect(result.lettaAgentId).toBe('letta-agent-abc123');
    expect(mockGateway.createAgent).toHaveBeenCalledTimes(1);
  });

  it('should include cognitive instructions in system prompt', async () => {
    await provisioner.provisionCompanionAgent({
      userId: 'user-1',
      companionPersonaId: 'persona-1',
      companion: createMockCompanion(),
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
      companion: createMockCompanion(),
    });

    const agentCall = mockGateway.createAgent.mock.calls[0][0];
    expect(agentCall.modelHandle).toBe('anthropic/claude-sonnet-4-5-20250929');
  });

  it('should provision without chart data', async () => {
    const result = await provisioner.provisionCompanionAgent({
      userId: 'user-1',
      companionPersonaId: 'persona-1',
      companion: createMockCompanion(),
      chart: null,
    });

    expect(result.lettaAgentId).toBe('letta-agent-abc123');
    expect(mockGateway.createMemoryBlocks).toHaveBeenCalledTimes(1);

    // Cognitive blocks should still be created (but without astrology overrides)
    const blockDefs = mockGateway.createMemoryBlocks.mock.calls[0][0];
    expect(blockDefs.length).toBeGreaterThanOrEqual(4);
  });
});
