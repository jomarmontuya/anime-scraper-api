import { ajaxUrl, baseUrl } from "@/app/constants";
import { load } from "cheerio";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  let id = searchParams.get("id");

  if (!id) {
    return Response.json({ error: "Id is required" }, { status: 400 });
  }

  if (!id.includes("gogoanime")) id = `${baseUrl}/category/${id}`;

  const animeInfo: any = {
    id: "",
    title: "",
    url: "",
    genres: [],
    totalEpisodes: 0,
    image: "",
    releaseDate: "",
    description: "",
    type: "",
    status: "",
    subOrDub: "",
    otherName: "",
  };
  try {
    const res = await fetch(id);
    const data = await res.text();

    const $ = load(data);

    animeInfo.id = new URL(id).pathname.split("/")[2];
    animeInfo.title = $(
      "section.content_left > div.main_body > div:nth-child(2) > div.anime_info_body_bg > h1"
    )
      .text()
      .trim();
    animeInfo.url = id;
    animeInfo.image = $("div.anime_info_body_bg > img").attr("src")!;
    animeInfo.releaseDate = $("div.anime_info_body_bg > p:nth-child(7)")
      .text()
      .trim()
      .split("Released: ")[1];
    animeInfo.description = $("div.anime_info_body_bg > p:nth-child(5)")!
      .text()
      .trim()
      .replace("Plot Summary: ", "");

    animeInfo.subOrDub = animeInfo.title.toLowerCase().includes("dub")
      ? "Dub"
      : "Sub";

    animeInfo.type = $("div.anime_info_body_bg > p:nth-child(4) > a")
      .text()
      .trim()
      .toUpperCase();

    animeInfo.status = "Unknown";

    switch ($("div.anime_info_body_bg > p:nth-child(8) > a").text().trim()) {
      case "Ongoing":
        animeInfo.status = "Ongoing";
        break;
      case "Completed":
        animeInfo.status = "Completed";
        break;
      case "Upcoming":
        animeInfo.status = "Upcoming";
        break;
      default:
        animeInfo.status = "Unknown";
        break;
    }
    animeInfo.otherName = $("div.anime_info_body_bg > p:nth-child(9)")
      .text()
      .replace("Other name: ", "")
      .replace(/;/g, ",");

    $("div.anime_info_body_bg > p:nth-child(6) > a").each((i, el) => {
      const element = $(el).attr("title")!.toString();
      animeInfo.genres?.push(element);
    });

    const ep_start = $("#episode_page > li").first().find("a").attr("ep_start");
    const ep_end = $("#episode_page > li").last().find("a").attr("ep_end");
    const movie_id = $("#movie_id").attr("value");
    const alias = $("#alias_anime").attr("value");

    const html = await fetch(
      `${ajaxUrl}/load-list-episode?ep_start=${ep_start}&ep_end=${ep_end}&id=${movie_id}&default_ep=${0}&alias=${alias}`
    );

    const htmlData = await html.text();
    const $$ = load(htmlData);

    animeInfo.episodes = [];
    $$("#episode_related > li").each((i, el) => {
      animeInfo.episodes?.push({
        id: $(el).find("a").attr("href")?.split("/")[1],
        number: parseFloat($(el).find(`div.name`).text().replace("EP ", "")),
        url: `${baseUrl}/${$(el).find(`a`).attr("href")?.trim()}`,
      });
    });
    animeInfo.episodes = animeInfo.episodes.reverse();

    animeInfo.totalEpisodes = parseInt(ep_end ?? "0");

    return Response.json(animeInfo);
  } catch (err) {
    console.log(err);
  }

  return Response.json({ test: "" });
}
