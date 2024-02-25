import CryptoJS from "crypto-js";
import { load } from "cheerio";
import { USER_AGENT } from "../constants";
import axios from "axios";

const serverName = "streamsb";
const sources: {
  url: string;
  quality: string;
  isM3U8: boolean;
}[] = [];
const host = "https://streamsss.net/sources50";
const host2 = "https://watchsb.com/sources50";

const PAYLOAD = (hex: string) =>
  `566d337678566f743674494a7c7c${hex}7c7c346b6767586d6934774855537c7c73747265616d7362/6565417268755339773461447c7c346133383438333436313335376136323337373433383634376337633465366534393338373136643732373736343735373237613763376334363733353737303533366236333463353333363534366137633763373337343732363536313664373336327c7c6b586c3163614468645a47617c7c73747265616d7362`;

export default async function StreamSB(videoUrl: any, isAlt = false) {
  let headers: {
    watchsb?: string;
    "User-Agent": string;
    Referer: string;
  } = {
    watchsb: "sbstream",
    "User-Agent": USER_AGENT,
    Referer: videoUrl.href,
  };
  let id = videoUrl.href.split("/e/").pop();
  if (id?.includes("html")) id = id.split(".html")[0];
  const bytes = new TextEncoder().encode(id);

  const res = await axios
    .get(
      `${isAlt ? host2 : host}/${PAYLOAD(Buffer.from(bytes).toString("hex"))}`,
      {
        headers,
      }
    )
    .catch(() => null);

  if (!res?.data.stream_data) {
    console.log("No source found. Try a different server.");
    return;
  }

  headers = {
    "User-Agent": USER_AGENT,
    Referer: videoUrl.href.split("e/")[0],
  };
  const m3u8Urls = await axios.get(res.data.stream_data.file, {
    headers,
  });

  const videoList = m3u8Urls.data.split("#EXT-X-STREAM-INF:");

  for (const video of videoList ?? []) {
    if (!video.includes("m3u8")) continue;

    const url = video.split("\n")[1];
    const quality = video.split("RESOLUTION=")[1].split(",")[0].split("x")[1];

    sources.push({
      url: url,
      quality: `${quality}p`,
      isM3U8: true,
    });
  }

  sources.push({
    quality: "auto",
    url: res.data.stream_data.file,
    isM3U8: res.data.stream_data.file.includes(".m3u8"),
  });

  return sources;
}
