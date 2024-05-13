import viteConfig from "@/../vite.config";
import { join } from "path/posix";
import type { Manifest } from "vite";
import providers from "@providers/index";

const { config } = providers;
const vitePort = viteConfig.server?.port ?? 5173;
let viteManifest: Manifest = {};

if (providers.config.get("app.environment") === "production") {
  try {
    viteManifest = require(join(process.cwd(), ".vite", "manifest.json"));
  } catch (error) {
    providers.logger.error(
      "Vite manifest not found, please build the application first"
    );
    process.exit(1);
  }
}

export default function Vite(props: { children: string[] }) {
  if (config.get("app.environment") === "production") {
    const usedAssets = Object.entries(viteManifest).filter(([key]) =>
      props.children.includes(key)
    );

    return (
      <>
        {usedAssets.map(([, value]) => {
          if (value.file.includes(".js")) {
            return (
              <>
                <script
                  type="module"
                  src={`/public/build/${value.file}`}
                ></script>

                {value.css?.map((css) => (
                  <link rel="stylesheet" href={`/public/build/${css}`} />
                ))}
              </>
            );
          }

          if (value.file.includes(".css")) {
            return (
              <link rel="stylesheet" href={`/public/build/${value.file}`} />
            );
          }
        })}
      </>
    );
  }

  return (
    <>
      <script>console.warn('[MVC] DEVELOPMENT MODE')</script>
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
              src={`http://localhost:${vitePort}/${child}`}
            ></script>
          );
        }

        if (child.includes(".css")) {
          return (
            <link
              rel="stylesheet"
              href={`http://localhost:${vitePort}/${child}`}
            />
          );
        }
      })}
    </>
  );
}
