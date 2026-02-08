<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/15hffPWfCixBvYVrrOBn0S_eAkAIutmfE

## Fund Chart Builder

A React application for building fund charts.

## Setup & Installation

1.  **Install dependencies:**
    ```bash
    npm install
    ```

2.  **Start development server:**
    ```bash
    npm run dev
    ```

3.  **Build for production:**
    ```bash
    npm run build
    ```

## Deployment

### Automated Deployment (Recommended)
This repository is configured with GitHub Actions.
1.  Push changes to the `main` branch.
2.  The workflow will automatically build and deploy to GitHub Pages.
3.  Ensure your repository settings -> Pages -> Build and deployment -> Source is set to **GitHub Actions**.

### Manual Deployment
You can also deploy manually from your local machine:
```bash
npm run deploy
```
This will build the project and push the `dist` folder to the `gh-pages` branch.
*Note: For manual deployment to work, ensure your repository settings -> Pages -> Build and deployment -> Source is set to **Deploy from a branch** and select `gh-pages` / `/ (root)`.*

## Configuration

- **.gitignore**: Configured to ignore logs, dependencies, and build outputs.
- **Vite**: Configured with `@` alias for src.
