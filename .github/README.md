# GitHub Workflows

This directory contains GitHub Actions workflows for automated builds, testing, and releases.

## Workflows

### CI (`ci.yml`)

Runs on every push to `main` and on pull requests.

**Jobs:**

- **Lint** - Checks code quality
- **Typecheck** - Validates TypeScript types
- **Build** - Builds all packages to ensure no build errors

### Release Desktop (`release-desktop.yml`)

Builds and releases the macOS desktop app.

**Trigger:** Push a version tag (e.g., `v1.0.0`)

**Jobs:**

1. **Build macOS** - Builds the app for macOS and creates a ZIP file
2. **Generate Changelog** - Creates a changelog from git commits since the last release
3. **Create Release** - Creates a draft GitHub release with the build artifacts and changelog

## Setup Required Secrets

Before running the workflows, you need to add the following secret to your GitHub repository:

1. Go to your repository on GitHub
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Add:
   - **Name:** `SMITHERY_API_KEY`
   - **Value:** Your Smithery API key (currently in your `.env` file)

## How to Create a Release

1. **Update the version** in `apps/desktop/package.json`:

   ```json
   {
     "version": "1.0.0"
   }
   ```

2. **Commit the version change**:

   ```bash
   git add apps/desktop/package.json
   git commit -m "chore: bump version to 1.0.0"
   ```

3. **Create and push a tag**:

   ```bash
   git tag v1.0.0
   git push origin main
   git push origin v1.0.0
   ```

4. **Monitor the workflow**:
   - Go to the "Actions" tab in your GitHub repository
   - Watch the "Release Desktop App" workflow run
   - Once complete, go to "Releases" to see the draft release

5. **Review and publish**:
   - Review the draft release, changelog, and download the ZIP to test
   - Edit the release notes if needed
   - Click "Publish release" to make it public

## Tag Format

Tags must follow the format: `v{major}.{minor}.{patch}`

Examples:

- `v0.1.0` - First beta release
- `v1.0.0` - First stable release
- `v1.2.3` - Bug fix release

## Manual Trigger

You can also manually trigger a release from the Actions tab:

1. Go to "Actions" → "Release Desktop App"
2. Click "Run workflow"
3. Enter a version number (optional)
4. Click "Run workflow"
