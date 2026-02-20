/* global fetch, TextDecoder, process */
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
 * Model presets with optimized sampling parameters
 * Class 2: Larger models (Dolphin-Mixtral) - lighter repetition control
 * Class 3: Standard models (Violet-Lotus, Dark Planet) - balanced settings
 * Class 4: Creative models (MythoMax) - more aggressive repetition control
 */
export const MODEL_PRESETS = {
    'violet-lotus:latest': {
        temperature: 0.85,
        top_k: 40,
        top_p: 0.95,
        min_p: 0.05,
        repeat_penalty: 1.08,
        repeat_last_n: 64,
        presence_penalty: 0.1,
        frequency_penalty: 0.15,
        mirostat: 2,
        mirostat_tau: 7.0,
        mirostat_eta: 0.2,
        num_ctx: 8192,
        num_predict: 512,
    },
    'mythomax:latest': {
        temperature: 0.9,
        top_k: 40,
        top_p: 0.95,
        min_p: 0.05,
        repeat_penalty: 1.12,
        repeat_last_n: 64,
        presence_penalty: 0.15,
        frequency_penalty: 0.25,
        mirostat: 2,
        mirostat_tau: 6.5,
        mirostat_eta: 0.15,
        num_ctx: 4096,
        num_predict: 400,
    },
    'dolphin-mixtral:latest': {
        temperature: 1.0,
        top_k: 40,
        top_p: 0.95,
        min_p: 0.05,
        repeat_penalty: 1.05,
        repeat_last_n: 128,
        presence_penalty: 0.1,
        frequency_penalty: 0.1,
        num_ctx: 16384,
        num_predict: 2000,
    },
    'darkplanet-general:latest': {
        temperature: 0.85,
        top_k: 40,
        top_p: 0.95,
        min_p: 0.05,
        repeat_penalty: 1.08,
        repeat_last_n: 64,
        presence_penalty: 0.1,
        frequency_penalty: 0.15,
        mirostat: 2,
        mirostat_tau: 7.0,
        mirostat_eta: 0.2,
        num_ctx: 8192,
        num_predict: 512,
    },
    'dark-champion:latest': {
        temperature: 0.9,
        top_k: 40,
        top_p: 0.95,
        min_p: 0.05,
        repeat_penalty: 1.1,
        repeat_last_n: 64,
        presence_penalty: 0.12,
        frequency_penalty: 0.2,
        mirostat: 2,
        mirostat_tau: 7.0,
        mirostat_eta: 0.2,
        num_ctx: 8192,
        num_predict: 600,
    },
};
// Default options for unknown models
const DEFAULT_OPTIONS = {
    temperature: 0.85,
    top_k: 40,
    top_p: 0.95,
    min_p: 0.05,
    repeat_penalty: 1.08,
    repeat_last_n: 64,
    presence_penalty: 0.1,
    frequency_penalty: 0.15,
    num_ctx: 8192,
    num_predict: 512,
};
/**
 * Get optimized preset for a model, with optional overrides
 */
export function getModelPreset(model, overrides) {
    const preset = MODEL_PRESETS[model] || DEFAULT_OPTIONS;
    return { ...preset, ...overrides };
}
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
export class OllamaGateway {
    config;
    constructor(config) {
        if (!config.baseUrl) {
            throw new Error('Ollama baseUrl is required');
        }
        this.config = config;
    }
    /**
     * Clean model output by removing common artifacts
     * Llama-3 models sometimes add end-of-turn or prompt artifacts
     */
    cleanOutput(text) {
        return text
            .replace(/<\|eot_id\|>/g, '') // Llama-3 end of turn
            .replace(/<\|end_of_text\|>/g, '') // Llama-3 end of text
            .replace(/<\|start_header_id\|>.*?<\|end_header_id\|>/g, '') // Header artifacts
            .replace(/\s*<\s*$/g, '') // Trailing <
            .replace(/\s*\|\s*\d+\s*\|\s*$/g, '') // Trailing | 1234 |
            .replace(/\s*\[INST\]?\s*$/g, '') // Trailing [INST]
            .replace(/\s*\[\/INST\]?\s*$/g, '') // Trailing [/INST]
            .replace(/\s*<\/s>?\s*$/g, '') // Trailing </s>
            .trim();
    }
    /**
     * Build the prompt in Llama-3 Instruct format
     */
    buildLlama3Prompt(messages) {
        let prompt = '<|begin_of_text|>';
        for (const msg of messages) {
            prompt += `<|start_header_id|>${msg.role}<|end_header_id|>\n\n${msg.content}<|eot_id|>`;
        }
        prompt += '<|start_header_id|>assistant<|end_header_id|>\n\n';
        return prompt;
    }
    /**
     * Build Ollama options object from preset and overrides
     */
    buildOllamaOptions(model, genOptions) {
        // Start with model preset
        const preset = getModelPreset(model);
        // Apply explicit options from GenerateOptions
        const opts = genOptions.options || {};
        // Legacy support: temperature and maxTokens at top level
        const temperature = genOptions.temperature ?? opts.temperature ?? preset.temperature;
        const numPredict = genOptions.maxTokens ?? opts.num_predict ?? preset.num_predict;
        return {
            temperature,
            num_predict: numPredict,
            top_k: opts.top_k ?? preset.top_k,
            top_p: opts.top_p ?? preset.top_p,
            min_p: opts.min_p ?? preset.min_p,
            repeat_penalty: opts.repeat_penalty ?? preset.repeat_penalty,
            repeat_last_n: opts.repeat_last_n ?? preset.repeat_last_n,
            presence_penalty: opts.presence_penalty ?? preset.presence_penalty,
            frequency_penalty: opts.frequency_penalty ?? preset.frequency_penalty,
            mirostat: opts.mirostat ?? preset.mirostat,
            mirostat_tau: opts.mirostat_tau ?? preset.mirostat_tau,
            mirostat_eta: opts.mirostat_eta ?? preset.mirostat_eta,
            num_ctx: opts.num_ctx ?? preset.num_ctx,
            ...(opts.tfs_z !== undefined && { tfs_z: opts.tfs_z }),
            ...(opts.typical_p !== undefined && { typical_p: opts.typical_p }),
            ...(opts.seed !== undefined && { seed: opts.seed }),
            ...(opts.stop && { stop: opts.stop }),
        };
    }
    /**
     * Generate a non-streaming response
     * @returns The complete generated response text
     */
    async generate(options) {
        const { model, messages } = options;
        const prompt = this.buildLlama3Prompt(messages);
        const ollamaOptions = this.buildOllamaOptions(model, options);
        const response = await fetch(`${this.config.baseUrl}/api/generate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(this.config.apiKey && { Authorization: `Bearer ${this.config.apiKey}` }),
            },
            body: JSON.stringify({
                model,
                prompt,
                stream: false,
                options: ollamaOptions,
            }),
        });
        if (!response.ok) {
            const error = await response.text();
            throw new Error(`Ollama API error: ${response.status} - ${error}`);
        }
        const data = (await response.json());
        return this.cleanOutput(data.response);
    }
    /**
     * Generate a streaming response
     * Returns an async generator that yields text chunks
     *
     * @example
     * for await (const chunk of gateway.generateStream({...})) {
     *   process.stdout.write(chunk);
     * }
     */
    async *generateStream(options) {
        const { model, messages } = options;
        const ollamaOptions = this.buildOllamaOptions(model, options);
        // Use the chat endpoint for better streaming support
        const response = await fetch(`${this.config.baseUrl}/api/chat`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(this.config.apiKey && { Authorization: `Bearer ${this.config.apiKey}` }),
            },
            body: JSON.stringify({
                model,
                messages: messages.map(m => ({
                    role: m.role,
                    content: m.content,
                })),
                stream: true,
                options: ollamaOptions,
            }),
        });
        if (!response.ok) {
            const error = await response.text();
            throw new Error(`Ollama API error: ${response.status} - ${error}`);
        }
        if (!response.body) {
            throw new Error('No response body from Ollama');
        }
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        // Buffer to hold pending content that might be trailing artifacts
        let pendingBuffer = '';
        try {
            while (true) {
                const { done, value } = await reader.read();
                if (done)
                    break;
                const chunk = decoder.decode(value, { stream: true });
                const lines = chunk.split('\n').filter(line => line.trim());
                for (const line of lines) {
                    try {
                        const data = JSON.parse(line);
                        if (data.message?.content) {
                            const content = data.message.content;
                            // Add to pending buffer
                            pendingBuffer += content;
                            // Only yield if we're reasonably sure it's not a trailing artifact
                            // Keep a small buffer and clean it at the end
                            if (pendingBuffer.length > 20) {
                                const toYield = pendingBuffer.slice(0, -20);
                                pendingBuffer = pendingBuffer.slice(-20);
                                yield toYield;
                            }
                        }
                        if (data.done && pendingBuffer) {
                            const cleaned = this.cleanOutput(pendingBuffer);
                            if (cleaned) {
                                yield cleaned;
                            }
                            pendingBuffer = '';
                        }
                    }
                    catch {
                        // Skip invalid JSON lines
                    }
                }
            }
            // Final cleanup of any pending buffer at stream end
            if (pendingBuffer) {
                const cleaned = this.cleanOutput(pendingBuffer);
                if (cleaned) {
                    yield cleaned;
                }
            }
        }
        finally {
            reader.releaseLock();
        }
    }
    /**
     * Test connection to Ollama
     * @returns Connection test result
     */
    async testConnection() {
        try {
            const response = await fetch(`${this.config.baseUrl}/api/tags`, {
                headers: this.config.apiKey ? { Authorization: `Bearer ${this.config.apiKey}` } : {},
            });
            if (!response.ok) {
                return { success: false, error: `HTTP ${response.status}` };
            }
            const data = (await response.json());
            const models = data.models?.map(m => m.name) || [];
            return { success: true, models };
        }
        catch (error) {
            return { success: false, error: String(error) };
        }
    }
    /**
     * Get available models from Ollama
     * @returns Array of model names
     */
    async getModels() {
        const response = await fetch(`${this.config.baseUrl}/api/tags`, {
            headers: this.config.apiKey ? { Authorization: `Bearer ${this.config.apiKey}` } : {},
        });
        if (!response.ok) {
            throw new Error(`Failed to get models: ${response.status}`);
        }
        const data = (await response.json());
        return data.models?.map(m => m.name) || [];
    }
    /**
     * Select the appropriate model based on response length preference
     */
    selectModel(length, useLongFormForDetailed = true) {
        if (length === 'detailed' && useLongFormForDetailed) {
            return this.config.longFormModel;
        }
        return this.config.generalModel;
    }
    /**
     * Get current configuration
     */
    getConfig() {
        return { ...this.config };
    }
}
/**
 * Create an Ollama Gateway instance with environment variables
 */
export function createOllamaGateway() {
    return new OllamaGateway({
        baseUrl: process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
        apiKey: process.env.OLLAMA_API_KEY || '',
        generalModel: process.env.OLLAMA_GENERAL_MODEL || 'darkplanet',
        longFormModel: process.env.OLLAMA_LONGFORM_MODEL || 'darkplanet',
    });
}
// Singleton instance (lazy-loaded)
let ollamaGatewayInstance = null;
/**
 * Get or create the singleton Ollama Gateway instance
 */
export function getOllamaGateway() {
    if (!ollamaGatewayInstance) {
        ollamaGatewayInstance = createOllamaGateway();
    }
    return ollamaGatewayInstance;
}
