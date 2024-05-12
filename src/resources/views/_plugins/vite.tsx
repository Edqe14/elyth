import { config } from "@/index";

export default function Vite(props: { file: string }) {
  if (config.get("app.environment") === "production") return null;

  return (
    <>
      <script type="module" src="http://localhost:5173/@vite/client"></script>
      <script
        type="module"
        src={`http://localhost:5173/src/resources/${props.file}`}
      ></script>
    </>
  );
}
