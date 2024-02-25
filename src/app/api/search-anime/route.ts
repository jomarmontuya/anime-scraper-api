import { baseUrl } from "@/app/constants";
import { load } from "cheerio";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("query");

  if (!query) {
    return Response.json(
      { error: "Bad Request Please Check Query" },
      { status: 400 }
    );
  }

  const searchResult = {
    currentPage: 1,
    hasNextPage: false,
    results: [
      {
        id: "",
        title: "",
        url: "",
        image: "",
        releaseDate: "",
        subOrDub: "",
      },
    ],
  };

  try {
    const res = await fetch(
      `${baseUrl}/filter.html?keyword=${encodeURIComponent(query)}&page=1`
    );
    const data = await res.text();
    const $ = load(data);

    searchResult.hasNextPage =
      $("div.anime_name.new_series > div > div > ul > li.selected").next()
        .length > 0;

    $("div.last_episodes > ul > li").each((i, el) => {
      searchResult.results.push({
        id: $(el).find("p.name > a").attr("href")?.split("/")[2]!,
        title: $(el).find("p.name > a").attr("title")!,
        url: `${baseUrl}/${$(el).find("p.name > a").attr("href")}`,
        image: $(el).find("div > a > img").attr("src")!,
        releaseDate: $(el).find("p.released").text().trim(),
        subOrDub: $(el).find("p.name > a").text().toLowerCase().includes("dub")
          ? "Dub"
          : "Sub",
      });
    });
  } catch (err) {
    return Response.json({ error: err }, { status: 500 });
  }

  return Response.json({ searchResult });
}
