import { app, config } from "@/index";
import viteConfig from "@/../vite.config";
import { join } from "path/posix";

const vitePort = viteConfig.server?.port ?? 5173;

let viteManifest: Record<string, string> = {};

if (app.configurations.get("app.environment") === "production") {
  try {
    viteManifest = require(join(process.cwd(), ".vite", "manifest.json"));
  } catch (error) {
    app.logger.error(
      "Vite manifest not found, please build the application first"
    );
    process.exit(1);
  }
}

export default function Vite(props: { children: string[] }) {
  // TODO: Add a check for production environment and replace with the production build
  if (config.get("app.environment") === "production") return null;

  return (
    <>
      <script
        type="module"
        src={`http://localhost:${vitePort}/@vite/client`}
      ></script>

      <script
        type="module"
        src={`http://localhost:${vitePort}/src/resources/views/_plugins/vite/polyfill.js`}
      ></script>

      {props.children.map((child) => {
        if (child.includes(".js")) {
          return (
            <script
              type="module"
              src={`http://localhost:${vitePort}/src/resources/${child}`}
            ></script>
          );
        }

        if (child.includes(".css")) {
          return (
            <link
              rel="stylesheet"
              href={`http://localhost:${vitePort}/src/resources/${child}`}
            />
          );
        }
      })}
    </>
  );
}
