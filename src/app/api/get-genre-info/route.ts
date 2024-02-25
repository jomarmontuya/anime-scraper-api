import { baseUrl } from "@/app/constants";
import { load } from "cheerio";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const genre = searchParams.get("genre");
  const page = searchParams.get("page") || 1;

  if (!genre) {
    return Response.json({ error: "Genre is required" }, { status: 400 });
  }

  try {
    const res = await fetch(`${baseUrl}/genre/${genre}?page=${page}`);
    const data = await res.text();
    const $ = load(data);

    const genreInfo: {
      id: string | undefined;
      title: string | undefined;
      image: string | undefined;
      released: string | undefined;
      url: string | undefined;
    }[] = [];

    $("div.last_episodes > ul > li").each((i, elem) => {
      genreInfo.push({
        id: $(elem).find("p.name > a").attr("href")?.split("/")[2],
        title: $(elem).find("p.name > a").attr("title"),
        image: $(elem).find("div > a > img").attr("src"),
        released: $(elem)
          .find("p.released")
          .text()
          .replace("Released: ", "")
          .trim(),
        url: baseUrl + "/" + $(elem).find("p.name > a").attr("href"),
      });
    });

    const paginatorDom = $("div.anime_name_pagination > div > ul > li");
    const hasNextPage =
      paginatorDom.length > 0 && !paginatorDom.last().hasClass("selected");

    return Response.json({
      currentPage: page,
      hasNextPage: hasNextPage,
      results: genreInfo,
    });
  } catch (err) {
    throw new Error("Something went wrong. Please try again later.");
  }
}
