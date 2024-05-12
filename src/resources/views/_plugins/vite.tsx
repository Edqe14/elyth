import { config } from "@/index";
import viteConfig from "@/../vite.config";

const vitePort = viteConfig.server?.port ?? 5173;

export default function Vite(props: { file: string }) {
  if (config.get("app.environment") === "production") return null;

  return (
    <>
      <script
        type="module"
        src={`http://localhost:${vitePort}/@vite/client`}
      ></script>
      <script
        type="module"
        src={`http://localhost:${vitePort}/src/resources/${props.file}`}
      ></script>
    </>
  );
}
