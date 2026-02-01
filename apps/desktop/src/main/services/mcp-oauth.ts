import * as fs from "node:fs";
import * as path from "node:path";
import { app, shell } from "electron";

/**
 * ElectronOAuthProvider - Implements OAuth provider interface for @ai-sdk/mcp
 *
 * This class provides OAuth authentication for MCP servers by:
 * 1. Storing tokens in JSON files in the app's userData directory
 * 2. Opening OAuth URLs in the system browser
 * 3. Delegating OAuth flow handling to the AI SDK's transport layer
 */
export class ElectronOAuthProvider {
  private _tokens?: any;
  private _clientInfo?: any;
  private _codeVerifier?: string;
  private tokenPath: string;
  private _authInProgress = false; // Guard against multiple simultaneous OAuth flows

  constructor(private mcpName: string) {
    const userDataPath = app.getPath("userData");
    const tokensDir = path.join(userDataPath, "mcp-tokens");

    // Ensure tokens directory exists
    if (!fs.existsSync(tokensDir)) {
      fs.mkdirSync(tokensDir, { recursive: true });
    }

    this.tokenPath = path.join(tokensDir, `${mcpName.toLowerCase().replace(/[^a-z0-9-]/g, "-")}.json`);
    this.loadTokens();
  }

  /**
   * Load saved tokens from file system
   */
  private loadTokens() {
    try {
      if (fs.existsSync(this.tokenPath)) {
        const data = fs.readFileSync(this.tokenPath, "utf8");
        const saved = JSON.parse(data);
        this._tokens = saved.tokens;
        this._clientInfo = saved.clientInfo;
        console.log(`📁 Loaded saved tokens for ${this.mcpName}`);
      }
    } catch (error) {
      console.log(`No saved tokens for ${this.mcpName}`, error);
    }
  }

  /**
   * Save tokens to file system
   */
  private saveTokensToFile() {
    try {
      const data = {
        tokens: this._tokens,
        clientInfo: this._clientInfo,
        updatedAt: new Date().toISOString(),
      };
      fs.writeFileSync(this.tokenPath, JSON.stringify(data, null, 2));
      console.log(`💾 Saved tokens for ${this.mcpName}`);
    } catch (error) {
      console.error(`Failed to save tokens for ${this.mcpName}:`, error);
    }
  }

  /**
   * Get the OAuth redirect URL
   */
  get redirectUrl() {
    return "integral.computer://oauth/callback";
  }

  /**
   * Get OAuth client metadata
   */
  get clientMetadata() {
    return {
      client_name: "Integral Desktop",
      redirect_uris: [this.redirectUrl],
      grant_types: ["authorization_code", "refresh_token"],
      response_types: ["code"],
      token_endpoint_auth_method: "none", // Public client (no client secret)
      scope: "mcp:tools",
    };
  }

  /**
   * Get saved client information
   */
  clientInformation() {
    return this._clientInfo;
  }

  /**
   * Get client info (async version for AI SDK compatibility)
   */
  async getClientInfo() {
    return this._clientInfo;
  }

  /**
   * Save client information from OAuth server
   */
  async saveClientInformation(info: any) {
    console.log(`📝 Saved client info for ${this.mcpName}`);
    this._clientInfo = info;
    this.saveTokensToFile();
  }

  /**
   * Get saved OAuth tokens
   */
  tokens() {
    return this._tokens;
  }

  /**
   * Save OAuth tokens (called by AI SDK after token exchange)
   */
  async saveTokens(tokens: any) {
    this._tokens = tokens;
    this._authInProgress = false; // Reset auth flag when tokens are saved
    this.saveTokensToFile();
    console.log(`✅ Tokens saved for ${this.mcpName}`);
  }

  /**
   * Open OAuth authorization URL in system browser
   * Prevents multiple simultaneous OAuth flows by only opening the first URL
   */
  async redirectToAuthorization(url: URL) {
    // If OAuth is already in progress, don't open another URL
    if (this._authInProgress) {
      console.log(`⏭️ Skipping duplicate OAuth URL for ${this.mcpName} (auth already in progress)`);
      return;
    }

    console.log(`🔐 Opening OAuth URL for ${this.mcpName}:`, url.toString());
    this._authInProgress = true;
    await shell.openExternal(url.toString());
  }

  /**
   * Save PKCE code verifier for OAuth flow
   * Prevents overwriting the verifier if auth is already in progress
   */
  async saveCodeVerifier(verifier: string) {
    // Don't overwrite the verifier if OAuth is already in progress
    // This prevents creating multiple PKCE challenges during a single flow
    if (this._authInProgress && this._codeVerifier) {
      console.log(`⏭️ Skipping code verifier update for ${this.mcpName} (auth in progress, keeping original verifier)`);
      return;
    }
    this._codeVerifier = verifier;
  }

  /**
   * Get saved PKCE code verifier
   */
  async codeVerifier() {
    if (!this._codeVerifier) {
      throw new Error("No code verifier saved");
    }
    return this._codeVerifier;
  }

  /**
   * Delete saved tokens and client info
   * Note: Preserves code verifier for completing OAuth flow
   */
  clearTokens() {
    try {
      if (fs.existsSync(this.tokenPath)) {
        fs.unlinkSync(this.tokenPath);
        console.log(`🗑️ Deleted tokens for ${this.mcpName}`);
      }
      this._tokens = undefined;
      this._clientInfo = undefined;
      // Don't clear code verifier - it's needed for completing the OAuth PKCE flow
      // this._codeVerifier = undefined;
    } catch (error) {
      console.error(`Failed to delete tokens for ${this.mcpName}:`, error);
    }
  }

  /**
   * Fully reset provider (including code verifier)
   */
  fullReset() {
    this.clearTokens();
    this._codeVerifier = undefined;
    this._authInProgress = false; // Reset auth flag on full reset
  }
}
