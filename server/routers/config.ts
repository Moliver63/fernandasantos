import { publicProcedure, router } from "../_core/trpc";
import { ENV } from "../_core/env";

// Configuração pública lida pelo navegador em tempo de execução — trocar
// o Pixel ou o GA4 no Render passa a valer sem precisar rebuildar o front.
export const configRouter = router({
  publico: publicProcedure.query(() => ({
    metaPixelId: ENV.metaPixelId || null,
    ga4Id: ENV.ga4Id || null,
  })),
});
