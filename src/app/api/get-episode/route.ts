import { USER_AGENT, baseUrl } from "@/app/constants";
import GogoCDN from "@/app/extractors/gogoCDN";
import StreamSB from "@/app/extractors/streamSB";
import { load } from "cheerio";

const StreamingServers = {
  AsianLoad: "asianload",
  GogoCDN: "gogocdn",
  StreamSB: "streamsb",
  MixDrop: "mixdrop",
  Mp4Upload: "mp4upload",
  UpCloud: "upcloud",
  VidCloud: "vidcloud",
  StreamTape: "streamtape",
  VizCloud: "vizcloud",
  MyCloud: "mycloud",
  Filemoon: "filemoon",
  VidStreaming: "vidstreaming",
  SmashyStream: "smashystream",
  StreamHub: "streamhub",
  StreamWish: "streamwish",
  VidMoly: "vidmoly",
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return Response.json({ error: "Id is required" }, { status: 400 });
  }

  try {
    const sources = await fetchEpisodeSources(
      id,
      StreamingServers.VidStreaming
    );
    return Response.json({ sources });
  } catch (err) {
    return Response.json({ err });
  }
}

/**
 *
 * @param episodeId episode id
 * @param server server type (default 'GogoCDN') (optional)
 */
async function fetchEpisodeSources(episodeId: string, server: string) {
  if (episodeId.startsWith("http")) {
    const serverUrl = new URL(episodeId);
    switch (server) {
      case StreamingServers.GogoCDN:
        return {
          headers: { Referer: serverUrl.href },
          sources: await GogoCDN(serverUrl),
          download: `https://gogohd.net/download${serverUrl.search}`,
        };
      case StreamingServers.StreamSB:
        return {
          headers: {
            Referer: serverUrl.href,
            watchsb: "streamsb",
            "User-Agent": USER_AGENT,
          },
          sources: await StreamSB(serverUrl),
          download: `https://gogohd.net/download${serverUrl.search}`,
        };
      default:
        return {
          headers: { Referer: serverUrl.href },
          sources: await GogoCDN(serverUrl),
          download: `https://gogohd.net/download${serverUrl.search}`,
        };
    }
  }

  try {
    const res = await fetch(`${baseUrl}/${episodeId}`);
    const data = await res.text();
    const $ = load(data);

    let serverUrl;

    switch (server) {
      case StreamingServers.GogoCDN:
        serverUrl = new URL(
          `${$("#load_anime > div > div > iframe").attr("src")}`
        );
        break;
      case StreamingServers.VidStreaming:
        serverUrl = new URL(
          `${$(
            "div.anime_video_body > div.anime_muti_link > ul > li.vidcdn > a"
          ).attr("data-video")}`
        );
        break;
      case StreamingServers.StreamSB:
        serverUrl = new URL(
          $(
            "div.anime_video_body > div.anime_muti_link > ul > li.streamsb > a"
          ).attr("data-video")!
        );
        break;
      default:
        serverUrl = new URL(
          `${$("#load_anime > div > div > iframe").attr("src")}`
        );
        break;
    }

    return await fetchEpisodeSources(serverUrl.href, server);
  } catch (err) {
    console.log(err);
    throw new Error("Episode not found.");
  }
}
