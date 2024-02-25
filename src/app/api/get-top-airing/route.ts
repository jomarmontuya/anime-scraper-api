import { ajaxUrl, baseUrl } from "@/app/constants";
import { load } from "cheerio";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const page = searchParams.get("page");

  if (!page) {
    return Response.json(
      { error: "Bad Request Please Check Query" },
      { status: 400 }
    );
  }

  try {
    const res = await fetch(
      `${ajaxUrl}/page-recent-release-ongoing.html?page=${page}`
    );
    const data = await res.text();

    const $ = load(data);

    const topAiring: {
      id: string;
      title: string;
      image: string | undefined;
      url: string;
      genres: string[];
    }[] = [];

    $("div.added_series_body.popular > ul > li").each((i, el) => {
      topAiring.push({
        id: $(el).find("a:nth-child(1)").attr("href")?.split("/")[2]!,
        title: $(el).find("a:nth-child(1)").attr("title")!,
        image: $(el)
          .find("a:nth-child(1) > div")
          .attr("style")
          ?.match("(https?://.*.(?:png|jpg))")![0],
        url: `${baseUrl}${$(el).find("a:nth-child(1)").attr("href")}`,
        genres: $(el)
          .find("p.genres > a")
          .map((i, el) => $(el).attr("title"))
          .get(),
      });
    });

    const hasNextPage = !$("div.anime_name.comedy > div > div > ul > li")
      .last()
      .hasClass("selected");

    return Response.json({
      currentPage: page,
      hasNextPage: hasNextPage,
      results: topAiring,
    });
  } catch (err) {
    return Response.json({ error: err }, { status: 500 });
  }
}
