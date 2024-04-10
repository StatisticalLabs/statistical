import { Chart, type ChartConfiguration, type ChartData } from "chart.js";
import { enUS } from "date-fns/locale";

Chart.defaults.font.family = "InterRegular";

export function graphConfiguration(
  title: string,
  data: ChartData,
): ChartConfiguration {
  return {
    type: "line",
    data,
    options: {
      plugins: {
        title: {
          display: true,
          text: title,
          font: { size: 24 },
          color: "white",
        },
        legend: {
          display: false,
        },
      },
      scales: {
        x: {
          type: "time",
          time: {
            unit: "day",
            displayFormats: {
              day: "yyyy-MM-dd HH:mm",
            },
          },
          adapters: {
            date: {
              locale: enUS,
            },
          },
          grid: {
            color: "transparent",
          },
        },
        y: {
          grid: {
            color: "transparent",
          },
        },
      },
    },
  };
}
