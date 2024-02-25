import { baseUrl } from "@/app/constants";
import { load } from "cheerio";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const page = searchParams.get("page");

  try {
    const res = await fetch(`${baseUrl}/popular.html?page=${page}`);
    const data = await res.text();

    const $ = load(data);

    const recentMovies: {
      id: string;
      title: string;
      releaseDate: string;
      image: string | undefined;
      url: string;
    }[] = [];

    $("div.last_episodes > ul > li").each((i, el) => {
      const a = $(el).find("p.name > a");
      const pRelease = $(el).find("p.released");
      const pName = $(el).find("p.name > a");

      recentMovies.push({
        id: a.attr("href")?.replace(`/category/`, "")!,
        title: pName.attr("title")!,
        releaseDate: pRelease.text().replace("Released: ", "").trim(),
        image: $(el).find("div > a > img").attr("src"),
        url: `${baseUrl}${a.attr("href")}`,
      });
    });

    const hasNextPage = !$("div.anime_name.anime_movies > div > div > ul > li")
      .last()
      .hasClass("selected");

    return Response.json({
      currentPage: page,
      hasNextPage: hasNextPage,
      results: recentMovies,
    });
  } catch (err) {
    console.log(err);
    throw new Error("Something went wrong. Please try again later.");
  }
}
