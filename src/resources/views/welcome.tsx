import Vite from "./_plugins/vite";

export default function Welcome(props: { name: string }) {
  return (
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Document</title>
      </head>
      <body>
        <h1>Welcome, {props.name}</h1>

        <Vite>{["js/main.js", "css/style.css"]}</Vite>
      </body>
    </html>
  );
}
