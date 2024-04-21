import Highcharts, { Options } from "highcharts";

export const graphOptions = (
  name: string,
  options?: {
    data?: [number, number][];
    gains?: true;
  },
) => {
  const opt = {
    chart: {
      renderTo: "chart",
      type: "line",
      backgroundColor: "transparent",
      plotBorderColor: "transparent",
      animation: false,
    },
    title: {
      text: "",
    },
    xAxis: {
      type: "datetime",
      tickPixelInterval: 500,
      labels: {
        style: {
          color: "#858585",
        },
      },
      gridLineColor: "#858585",
      lineColor: "#858585",
      minorGridLineColor: "#858585",
      tickColor: "#858585",
      title: {
        style: {
          color: "#858585",
        },
      },
    },
    yAxis: {
      title: {
        text: "",
      },
      labels: {
        style: {
          color: "#858585",
        },
      },
      gridLineColor: "#858585",
      lineColor: "#858585",
      minorGridLineColor: "#858585",
      tickColor: "#858585",
    },
    credits: {
      enabled: true,
      text: "Statistical",
      href: "/",
    },
    tooltip: {
      shared: true,
      formatter: function () {
        // @ts-expect-error only runs on client
        const index = this.points[0].series.xData.indexOf(this.x);
        // @ts-expect-error only runs on client
        const lastY = this.points[0].series.yData[index - 1];
        // @ts-expect-error only runs on client
        const dif = this.y - lastY;
        let r =
          // @ts-expect-error only runs on client
          Highcharts.dateFormat("%A %b %e, %H:%M:%S", new Date(this.x)) +
          '<br><span style="color:black">\u25CF </span>' +
          // @ts-expect-error only runs on client
          this.points[0].series.name +
          ": <b>";
        if (options?.gains) {
          // @ts-expect-error only runs on client
          if (this.y < 0) {
            r +=
              '<span style="color:#ff0000;font-weight:bold;">' +
              // @ts-expect-error only runs on client
              Highcharts.numberFormat(this.y, 0) +
              "</span>";
          } else if (this.y === 0) {
            r += Highcharts.numberFormat(this.y, 0);
          }
          // @ts-expect-error only runs on client
          else if (this.y > 0) {
            r +=
              '<span style="color:#00bb00;font-weight:bold;">+' +
              // @ts-expect-error only runs on client
              Highcharts.numberFormat(this.y, 0) +
              "</span>";
          }
        } else {
          r +=
            // @ts-expect-error only runs on client
            Highcharts.numberFormat(this.y, 0);
          if (dif < 0) {
            r +=
              '<span style="color:#ff0000;font-weight:bold;"> (' +
              Highcharts.numberFormat(dif, 0) +
              ")</span>";
          } else if (dif > 0) {
            r +=
              '<span style="color:#00bb00;font-weight:bold;"> (+' +
              Highcharts.numberFormat(dif, 0) +
              ")</span>";
          }
        }
        return r;
      },
    },
    plotOptions: {
      series: {
        threshold: null,
      },
      area: {
        fillOpacity: 0.25,
      },
    },
    series: [
      {
        showInLegend: false,
        name,
        marker: { enabled: false },
        color: "hsl(var(--foreground))",
        lineWidth: 3,
        type: options?.data ? "area" : "line",
      },
    ],
  } satisfies Options;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (options?.data) (opt.series[0] as any).data = options.data;
  return opt;
};
