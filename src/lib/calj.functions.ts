import { createServerFn } from "@tanstack/react-start";

export type CaljPayload = {
  times: Record<string, string>;
  seasonalHours: { graMin: number; maMin: number } | null;
  shabbat: { date: string | null; candles: string | null; havdalah: string | null };
};

/** Horaires officiels du Calendrier Juif (calj.net) pour Neuilly-sur-Seine */
export const getCaljTimes = createServerFn({ method: "GET" })
  .inputValidator((data: { date: string }) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(data?.date ?? "")) throw new Error("date invalide");
    return { date: data.date };
  })
  .handler(async ({ data }): Promise<CaljPayload | null> => {
    try {
      const { fetchCalj } = await import("./calj.server");
      const res = await fetchCalj(data.date);
      return {
        times: res.zmanim.times,
        seasonalHours: res.zmanim.seasonalHours,
        shabbat: res.shabbat,
      };
    } catch {
      return null;
    }
  });
