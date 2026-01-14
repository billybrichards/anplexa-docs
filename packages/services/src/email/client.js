"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getResendClient = getResendClient;
exports.getFromEmail = getFromEmail;
exports.clearEmailCache = clearEmailCache;
const resend_1 = require("resend");
let resendClient = null;
let cachedCredentials = null;
/**
 * Get Resend credentials from environment or Replit connectors
 */
async function getCredentials() {
    if (cachedCredentials) {
        return cachedCredentials;
    }
    // Try environment variables first
    const resendApiKey = process.env.RESEND_API_KEY;
    const resendFromEmail = process.env.RESEND_FROM_EMAIL;
    if (resendApiKey && resendFromEmail) {
        console.log('Using Resend API key from environment');
        cachedCredentials = {
            apiKey: resendApiKey,
            fromEmail: resendFromEmail,
        };
        return cachedCredentials;
    }
    // Fallback to Replit connector
    const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
    const xReplitToken = process.env.REPL_IDENTITY
        ? 'repl ' + process.env.REPL_IDENTITY
        : process.env.WEB_REPL_RENEWAL
            ? 'depl ' + process.env.WEB_REPL_RENEWAL
            : null;
    if (!xReplitToken || !hostname) {
        throw new Error('No Resend credentials available. Set RESEND_API_KEY and RESEND_FROM_EMAIL, or configure the Resend connector.');
    }
    const response = await fetch('https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=resend', {
        headers: {
            'Accept': 'application/json',
            'X_REPLIT_TOKEN': xReplitToken
        }
    });
    const data = await response.json();
    const connectionSettings = data.items?.[0];
    if (!connectionSettings || !connectionSettings.settings.api_key) {
        throw new Error('Resend connection not configured');
    }
    cachedCredentials = {
        apiKey: connectionSettings.settings.api_key,
        fromEmail: connectionSettings.settings.from_email || 'noreply@anplexa.com',
    };
    return cachedCredentials;
}
/**
 * Get Resend client instance
 */
async function getResendClient() {
    if (!resendClient) {
        const { apiKey } = await getCredentials();
        resendClient = new resend_1.Resend(apiKey);
    }
    return resendClient;
}
/**
 * Get the from email address configured for Resend
 */
async function getFromEmail() {
    const { fromEmail } = await getCredentials();
    return fromEmail;
}
/**
 * Clear cached credentials and client (useful for testing)
 */
function clearEmailCache() {
    resendClient = null;
    cachedCredentials = null;
}
