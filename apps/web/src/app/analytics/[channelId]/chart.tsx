"use client";

import { graphOptions } from "./graph-options";
import * as Highcharts from "highcharts";
import HighchartsReact from "highcharts-react-official";

export function Chart({
  name,
  data,
  gains,
}: {
  name: string;
  data: [number, number][];
  gains?: true;
}) {
  return (
    <HighchartsReact
      highcharts={Highcharts}
      options={graphOptions(name, { data, gains })}
    />
  );
}
