import { baseUrl } from "@/app/constants";
import { load } from "cheerio";

export async function GET(request: Request) {
  const genres: { id: string; title: string }[] = [];
  let res = null;
  try {
    res = await fetch(`${baseUrl}/home.html`);

    if (res.status === 404) {
      //  move to catch block
      throw new Error("404");
    }
  } catch (err) {
    try {
      res = await fetch(`${baseUrl}/`);
    } catch (error) {
      console.log("Something went wrong. Please try again later.");
    }
  }
  try {
    const data = await res!.text();

    if (!data) {
      return Response.json(
        { error: "Something went wrong. Please try again later." },
        { status: 500 }
      );
    }

    const $ = load(data);

    $("nav.menu_series.genre.right > ul > li").each((_index, element) => {
      const genre = $(element).find("a");

      genres.push({
        id: genre.attr("href")?.replace("/genre/", "")!,
        title: genre.attr("title")!,
      });
    });

    return Response.json({ genres });
  } catch (err) {
    return Response.json({ error: err }, { status: 500 });
  }
}
