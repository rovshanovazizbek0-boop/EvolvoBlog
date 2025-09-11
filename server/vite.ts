import express, { type Express } from "express";
import path from "path";
import fs from "fs/promises";
import { existsSync } from "fs";
import { type Server } from "http";
import { fileURLToPath } from 'url';
import { nanoid } from "nanoid";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}

function serveFallbackHTML(app: Express) {
  console.log('Serving basic HTML fallback for development');
  app.use("*", async (req, res) => {
    try {
      const clientTemplate = path.resolve(
        __dirname,
        "..",
        "client",
        "index.html"
      );
      
      let template = await fs.readFile(clientTemplate, "utf-8");
      // Basic development server without Vite transformations
      template = template.replace(
        'type="module"',
        'type="module" data-dev-fallback="true"'
      );
      res.status(200).set({ "Content-Type": "text/html" }).end(template);
    } catch (error) {
      console.error('Error serving HTML:', error);
      res.status(500).send('Error loading application');
    }
  });
}

export async function setupVite(app: Express, server: Server) {
  try {
    // Use dynamic import for Vite with proper destructuring
    const viteModule = await import('vite');
    
    if (!viteModule.createServer) {
      console.log('Vite dev mode unavailable, serving static HTML fallback');
      serveFallbackHTML(app);
      return;
    }
    
    const vite = await viteModule.createServer({
      configFile: path.resolve(__dirname, '..', 'vite.config.js'),
      server: {
        middlewareMode: true,
        hmr: { server },
        watch: { usePolling: true }
      },
      appType: 'custom',
    });

    app.use(vite.middlewares);
    app.use("*", async (req, res, next) => {
      const url = req.originalUrl;

      try {
        const clientTemplate = path.resolve(
          __dirname,
          "..",
          "client",
          "index.html"
        );

        // Always reload the index.html file in case it changes
        let template = await fs.readFile(clientTemplate, "utf-8");
        template = template.replace(
          `src="/src/main.tsx"`,
          `src="/src/main.tsx?v=${nanoid()}"`
        );
        const page = await vite.transformIndexHtml(url, template);
        res.status(200).set({ "Content-Type": "text/html" }).end(page);
      } catch (e) {
        const error = e as Error;
        if ('ssrFixStacktrace' in vite) {
          (vite as any).ssrFixStacktrace(error);
        }
        next(error);
      }
    });
  } catch (error) {
    console.error('Failed to start Vite server:', error);
    console.warn('Falling back to basic HTML serving');
    serveFallbackHTML(app);
  }
}

export function serveStatic(app: Express) {
  const distPath = path.resolve(__dirname, "..", "dist", "public");

  if (!existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`,
    );
  }

  app.use(express.static(distPath));

  // Fall through to index.html if the file doesn't exist
  app.use("*", (_req, res) => {
    res.sendFile(path.join(distPath, "index.html"));
  });
}
