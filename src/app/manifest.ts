import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/employee",
    name: "Quiksol Área Comercial",
    short_name: "Quiksol",
    description:
      "Área comercial para empleados y vendedores de Quiksol, preparada para iPad.",
    start_url: "/es/employee",
    display: "standalone",
    background_color: "#f7f3ef",
    theme_color: "#062f33",
    orientation: "any",
    icons: [
      {
        src: "/icons/quiksol-pwa-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/quiksol-pwa-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/quiksol-pwa-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
