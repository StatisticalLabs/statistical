import { GlobalFonts, createCanvas, loadImage } from "@napi-rs/canvas";
import { AttachmentBuilder } from "discord.js";
import { createId } from "@paralleldrive/cuid2";

GlobalFonts.registerFromPath("./assets/fonts/Inter-Bold.ttf", "InterBold");
GlobalFonts.registerFromPath("./assets/fonts/Inter-Medium.ttf", "InterMedium");
GlobalFonts.registerFromPath(
  "./assets/fonts/Inter-Regular.ttf",
  "InterRegular",
);
GlobalFonts.registerFromPath("./assets/fonts/Roboto-Bold.ttf", "RobotoBold");

const rgbToHex = (r: any, g: any, b: any) =>
  "#" +
  [r, g, b]
    .map((x) => {
      const hex = x.toString(16);
      return hex.length === 1 ? "0" + hex : hex;
    })
    .join("");

const howLong = (interval: number) => {
  const days = Math.floor(interval / (86400 * 1000));
  const hours = Math.floor(interval / (3600 * 1000)) % 24;
  const minutes = Math.floor(interval / (60 * 1000)) % 60;
  const seconds = Math.floor(interval / 1000) % 60;
  return (
    [
      [days, "d"],
      [hours, "h"],
      [minutes, "m"],
      [seconds, "s"],
    ] as [number, string][]
  )
    .filter((a) => a[0] > 0)
    .map((a) => a.join(""))
    .join(", ");
};

const abbreviate = (number: number, digits?: number) => {
  if (Math.abs(number) < 1000) return number;
  digits = digits ?? 3;

  const sign = Math.sign(number);
  let num = Math.abs(number).toString();
  let first = num.slice(0, digits);
  let rest = num.slice(digits);
  let abb = new Array(rest.length).fill(0).join("");

  return parseFloat(first + abb) * sign;
};

const abbreviateWithUnit = (number: number, digits?: number) => {
  digits = digits ?? 2;
  let formatNumber = Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: digits,
  }).format(number);

  return formatNumber;
};

const abbreviateAllInOne = (number: number, digits?: number) => {
  digits = digits ?? 3;
  return abbreviateWithUnit(abbreviate(number, digits), digits - 1);
};

const getMilestone = (number: number) => {
  let num = number.toString();
  let first = num[0];
  let rest = num.slice(1);
  let abb = new Array(rest.length).fill(0).join("");

  return parseFloat(first + abb);
};

export async function generateUpdateImage(d: {
  youtubeChannelId: string;
  name: string;
  handle?: string;
  avatar: string;
  dailyAVG: number;
  lastCount?: number;
  subCount: number;
  updateTime: Date;
  timeTook: number;
}) {
  const {
    youtubeChannelId: channelId,
    name,
    handle,
    subCount,
    lastCount,
    updateTime: rawUpdateTime,
    timeTook,
  } = d;
  let avatar = await loadImage(d.avatar);
  const updateTime = new Date(
    rawUpdateTime.getTime() + rawUpdateTime.getTimezoneOffset() * 60000,
  );
  let avg =
    Math.abs(Math.round(d.dailyAVG)) < 10_000_000
      ? Math.round(d.dailyAVG)
      : abbreviateAllInOne(Math.round(d.dailyAVG), 5);
  let countSize = subCount >= 100_000_000 ? "320px" : "350px";

  const canvas = createCanvas(1920, 1080);
  const context = canvas.getContext("2d");

  context.drawImage(avatar, -100, -100, 280, 280);

  const { data: avatarData } = context.getImageData(-100, -100, 280, 280);
  const color = rgbToHex(avatarData[0], avatarData[1], avatarData[2]);

  const grd = context.createLinearGradient(0, 0, 0, 5000);
  grd.addColorStop(0, "#1a1a1a");
  grd.addColorStop(1, color);
  context.fillStyle = grd;
  context.fillRect(0, 0, 1920, 1080);

  const botWatermark = await loadImage("./assets/botWatermark.png");

  if (getMilestone(subCount) == subCount) {
    const milestoneBackground = await loadImage(
      "./assets/milestoneBackground.png",
    );

    context.globalAlpha = 0.3;
    context.drawImage(milestoneBackground, 0, 0, 1920, 1080);
  }
  context.globalAlpha = 1;

  context.drawImage(avatar, 25, 25, 280, 280);
  context.drawImage(botWatermark, 1440, 855, 520, 360);

  context.font = "150px InterRegular";
  context.fillStyle = "white";
  context.textAlign = "center";
  context.fillText(name, 960, 150);

  context.font = "60px InterBold";
  context.fillStyle = "gray";
  context.textAlign = "center";
  context.fillText(handle ?? channelId, 960, 230);

  context.font = countSize + " RobotoBold";
  context.fillStyle = "white";
  context.textAlign = "center";
  context.fillText(subCount.toLocaleString("en-US"), 960, 615);

  context.font = "70px InterRegular";
  context.fillStyle = "#F2F2F2";
  context.textAlign = "center";
  context.fillText("subscribers", 960, 760);

  context.font = "225px InterMedium";
  context.fillStyle = d.dailyAVG < 0 ? "red" : "lime";
  context.textAlign = "left";
  context.fillText(
    (d.dailyAVG < 0 ? "" : "+") + avg.toLocaleString("en-US"),
    10,
    985,
  );

  context.font = "40px InterRegular";
  context.fillStyle = "white";
  context.textAlign = "left";
  context.fillText("subscribers/day", 25, 1070);

  context.font = "55px InterRegular";
  context.fillStyle = "white";
  context.textAlign = "right";
  context.fillText(
    `From ${abbreviateWithUnit(lastCount ?? 0)} to ${abbreviateWithUnit(subCount)}`,
    1910,
    850,
  );

  // "Mar 07, 2024 15:23:07"

  const formattedDate = updateTime.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  context.font = "62.5px InterBold";
  context.fillStyle = "yellow";
  context.textAlign = "right";
  context.fillText(
    `${formattedDate} ${updateTime.getHours().toString().padStart(2, "0")}:${updateTime.getMinutes().toString().padStart(2, "0")}:${updateTime.getSeconds().toString().padStart(2, "0")}`,
    1910,
    930,
  );

  context.font = "45px InterBold";
  context.fillStyle = "orange";
  context.textAlign = "right";
  context.fillText(`(${howLong(timeTook)})`, 1910, 990);

  const attachment = new AttachmentBuilder(await canvas.encode("png"), {
    name: `update-${createId()}.png`,
  });

  return attachment;
}
