import {
  Chart,
  type ChartConfiguration,
  type ChartData,
  type Plugin,
} from "chart.js";
import { enUS } from "date-fns/locale";

Chart.defaults.font.family = "InterRegular";

const backgroundColorPlugin = {
  id: "backgroundColorPlugin",
  beforeDraw: (chart) => {
    const { ctx } = chart;
    ctx.save();
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, chart.width, chart.height);
    ctx.restore();
  },
} satisfies Plugin;

export const graphConfiguration = (
  title: string,
  data: ChartData,
): ChartConfiguration => ({
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
      subtitle: {
        display: true,
        text: "Statistical",
        position: "bottom",
        align: "end",
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
          color: "#333333",
        },
      },
      y: {
        grid: {
          color: "#333333",
        },
      },
    },
  },
  plugins: [backgroundColorPlugin],
});
