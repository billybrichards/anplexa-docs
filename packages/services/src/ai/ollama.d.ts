/**
 * Ollama AI Service
 * Integrates with local Ollama instances for LLM inference
 *
 * Supports multiple model architectures with optimized sampling parameters:
 * - Violet-Lotus (Mistral Nemo 12B): High EQ, emotional responses
 * - MythoMax (Llama 2 13B merge): Creative/roleplay
 * - Dolphin-Mixtral (MOE 8x7B): Extended context, longform
 * - Dark Planet (Llama 3.1 8B): General chat, fallback
 * - Dark Champion (MOE 18.4B): Creative, unrestricted
 */
/**
 * Chat message format
 */
export interface ChatMessage {
    role: 'system' | 'user' | 'assistant';
    content: string;
}
/**
 * Ollama Service Configuration
 */
export interface OllamaConfig {
    baseUrl: string;
    apiKey: string;
    generalModel: string;
    longFormModel: string;
}
/**
 * Complete Ollama sampling options
 * Based on model performance research for Class 2-4 LLM models
 */
export interface OllamaOptions {
    temperature?: number;
    top_k?: number;
    top_p?: number;
    min_p?: number;
    repeat_penalty?: number;
    repeat_last_n?: number;
    presence_penalty?: number;
    frequency_penalty?: number;
    mirostat?: 0 | 1 | 2;
    mirostat_tau?: number;
    mirostat_eta?: number;
    num_ctx?: number;
    num_predict?: number;
    tfs_z?: number;
    typical_p?: number;
    seed?: number;
    stop?: string[];
}
/**
 * Generate request options
 */
export interface GenerateOptions {
    model: string;
    messages: ChatMessage[];
    options?: Partial<OllamaOptions>;
    stream?: boolean;
    temperature?: number;
    maxTokens?: number;
}
/**
 * Model presets with optimized sampling parameters
 * Class 2: Larger models (Dolphin-Mixtral) - lighter repetition control
 * Class 3: Standard models (Violet-Lotus, Dark Planet) - balanced settings
 * Class 4: Creative models (MythoMax) - more aggressive repetition control
 */
export declare const MODEL_PRESETS: Record<string, OllamaOptions>;
/**
 * Get optimized preset for a model, with optional overrides
 */
export declare function getModelPreset(model: string, overrides?: Partial<OllamaOptions>): OllamaOptions;
/**
 * Ollama Gateway Service
 * Handles communication with Ollama API for LLM inference
 *
 * @example
 * const gateway = new OllamaGateway({
 *   baseUrl: 'http://localhost:11434',
 *   apiKey: '',
 *   generalModel: 'darkplanet',
 *   longFormModel: 'dolphin-mixtral',
 * });
 *
 * // Non-streaming generation
 * const response = await gateway.generate({
 *   model: 'darkplanet',
 *   messages: [{ role: 'user', content: 'Hello!' }],
 * });
 *
 * // Streaming generation
 * for await (const chunk of gateway.generateStream({...})) {
 *   console.log(chunk);
 * }
 */
export declare class OllamaGateway {
    private config;
    constructor(config: OllamaConfig);
    /**
     * Clean model output by removing common artifacts
     * Llama-3 models sometimes add end-of-turn or prompt artifacts
     */
    private cleanOutput;
    /**
     * Build the prompt in Llama-3 Instruct format
     */
    private buildLlama3Prompt;
    /**
     * Build Ollama options object from preset and overrides
     */
    private buildOllamaOptions;
    /**
     * Generate a non-streaming response
     * @returns The complete generated response text
     */
    generate(options: GenerateOptions): Promise<string>;
    /**
     * Generate a streaming response
     * Returns an async generator that yields text chunks
     *
     * @example
     * for await (const chunk of gateway.generateStream({...})) {
     *   process.stdout.write(chunk);
     * }
     */
    generateStream(options: GenerateOptions): AsyncGenerator<string, void, unknown>;
    /**
     * Test connection to Ollama
     * @returns Connection test result
     */
    testConnection(): Promise<{
        success: boolean;
        models?: string[];
        error?: string;
    }>;
    /**
     * Get available models from Ollama
     * @returns Array of model names
     */
    getModels(): Promise<string[]>;
    /**
     * Select the appropriate model based on response length preference
     */
    selectModel(length: 'brief' | 'moderate' | 'detailed', useLongFormForDetailed?: boolean): string;
    /**
     * Get current configuration
     */
    getConfig(): OllamaConfig;
}
/**
 * Create an Ollama Gateway instance with environment variables
 */
export declare function createOllamaGateway(): OllamaGateway;
/**
 * Get or create the singleton Ollama Gateway instance
 */
export declare function getOllamaGateway(): OllamaGateway;
//# sourceMappingURL=ollama.d.ts.map