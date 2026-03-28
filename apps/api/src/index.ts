/**
 * Anplexa API - Backend Service Entry Point
 *
 * Initializes the Express server with Clean Architecture + DI
 */

import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env — check local first, then monorepo root
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
import { Pool } from 'pg';
import { configureContainer } from './container.js';
import { createApp } from './app.js';

async function main() {
  try {
    // Validate required environment variables
    const requiredEnvVars = [
      'DATABASE_URL',
      'JWT_SECRET',
    ];

    const missing = requiredEnvVars.filter(varName => !process.env[varName]);
    if (missing.length > 0) {
      console.error('❌ Missing required environment variables:', missing.join(', '));
      process.exit(1);
    }

    // Initialize DI container
    console.log('🔧 Initializing dependency injection container...');
    const container = configureContainer();

    // Log service configuration status (Fix 4: environment variable validation)
    console.log('📋 Service configuration:');
    console.log(`   Letta:     ${process.env.LETTA_API_URL ? `✅ configured (${process.env.LETTA_API_URL})` : '⚠️  not configured (LETTA_API_URL not set)'}`);
    console.log(`   Ollama:    ${process.env.OLLAMA_BASE_URL ? `✅ configured (${process.env.OLLAMA_BASE_URL})` : '⚠️  not configured (OLLAMA_BASE_URL not set, using localhost:11434)'}`);
    console.log(`   ComfyUI:   ${process.env.COMFYUI_API_URL ? `✅ configured (${process.env.COMFYUI_API_URL})` : '⚠️  not configured (COMFYUI_API_URL not set)'}`);
    console.log(`   Anthropic: ${process.env.ANTHROPIC_API_KEY ? '✅ configured' : '⚠️  not configured (ANTHROPIC_API_KEY not set)'}`);
    console.log(`   AWS S3:    ${process.env.AWS_ACCESS_KEY_ID ? '✅ configured' : '⚠️  not configured (AWS_ACCESS_KEY_ID not set)'}`);

    // Initialize MediaToolService (registers generate_image/generate_video with Letta)
    // Wrapped in try/catch so the app still starts if Letta or ComfyUI is unavailable
    if (process.env.LETTA_API_URL) {
      try {
        const { mediaToolService, lettaGateway } = container.cradle;
        console.log('🎨 Initializing Letta media tools (generate_image, generate_video)...');
        await mediaToolService.getToolConfig(lettaGateway);
        console.log('✅ Letta media tools initialized');
      } catch (mediaErr) {
        console.warn('⚠️  Media tool initialization failed (non-fatal):', mediaErr instanceof Error ? mediaErr.message : mediaErr);
        console.warn('   Image/video generation will not be available until Letta and ComfyUI are reachable.');
      }
    } else {
      console.log('⏭️  Skipping media tool initialization (LETTA_API_URL not configured)');
    }

    // Create Express app
    console.log('🚀 Creating Express application...');
    const app = createApp(container);

    // Start server
    const port = parseInt(process.env.PORT || '3000', 10);
    const server = app.listen(port, '0.0.0.0', () => {
      console.log(`✅ Anplexa API server listening on port ${port}`);
      console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`   Health check: http://localhost:${port}/health`);
    });

    // Graceful shutdown
    const shutdown = async (signal: string) => {
      console.log(`\n${signal} received, shutting down gracefully...`);
      server.close(async () => {
        console.log('✅ HTTP server closed');

        // Close database connections
        try {
          const pool = container.resolve<Pool>('pool');
          await pool.end();
          console.log('✅ Database connections closed');
        } catch (error) {
          console.error('Error closing database:', error);
        }

        process.exit(0);
      });

      // Force shutdown after 10 seconds
      setTimeout(() => {
        console.error('❌ Forced shutdown after timeout');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

  } catch (error) {
    console.error('❌ Fatal error starting server:', error);
    process.exit(1);
  }
}

main();
