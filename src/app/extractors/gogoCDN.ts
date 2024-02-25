import CryptoJS from "crypto-js";
import { load } from "cheerio";

const sources: any = [];

const keys = {
  key: CryptoJS.enc.Utf8.parse("37911490979715163134003223491201"),
  secondKey: CryptoJS.enc.Utf8.parse("54674138327930866480207815084989"),
  iv: CryptoJS.enc.Utf8.parse("3134003223491201"),
};
let referer = "";

export default async function GogoCDN(videoUrl: any) {
  referer = videoUrl.href;

  const res = await fetch(videoUrl.href);
  const data = await res.text();
  const $ = load(data);

  const encyptedParams = await generateEncryptedAjaxParams(
    $,
    videoUrl.searchParams.get("id") ?? ""
  );

  const encryptedDataResp = await fetch(
    `${videoUrl.protocol}//${videoUrl.hostname}/encrypt-ajax.php?${encyptedParams}`,
    {
      headers: {
        "X-Requested-With": "XMLHttpRequest",
      },
    }
  );
  const encryptedData = await encryptedDataResp.json();

  const decryptedData = await decryptAjaxData(encryptedData.data);
  if (!decryptedData.source) {
    console.log("No source found. Try a different server.");
    return;
  }

  if (decryptedData.source[0].file.includes(".m3u8")) {
    const resResult = await fetch(decryptedData.source[0].file.toString());
    const resData = await resResult.text();
    const resolutions = resData.match(/(RESOLUTION=)(.*)(\s*?)(\s*.*)/g);

    resolutions?.forEach((res) => {
      const index = decryptedData.source[0].file.lastIndexOf("/");
      const quality = res.split("\n")[0].split("x")[1].split(",")[0];
      const url = decryptedData.source[0].file.slice(0, index);
      sources.push({
        url: url + "/" + res.split("\n")[1],
        isM3U8: (url + res.split("\n")[1]).includes(".m3u8"),
        quality: quality + "p",
      });
    });

    decryptedData.source.forEach((source: any) => {
      sources.push({
        url: source.file,
        isM3U8: source.file.includes(".m3u8"),
        quality: "default",
      });
    });
  } else
    decryptedData.source.forEach((source: any) => {
      sources.push({
        url: source.file,
        isM3U8: source.file.includes(".m3u8"),
        quality: source.label.split(" ")[0] + "p",
      });
    });

  decryptedData.source_bk.forEach((source: any) => {
    sources.push({
      url: source.file,
      isM3U8: source.file.includes(".m3u8"),
      quality: "backup",
    });
  });

  return sources;
}

const decryptAjaxData = async (encryptedData: any) => {
  const decryptedData = CryptoJS.enc.Utf8.stringify(
    CryptoJS.AES.decrypt(encryptedData, keys.secondKey, {
      iv: keys.iv,
    })
  );

  return JSON.parse(decryptedData);
};

const generateEncryptedAjaxParams = async ($: any, id: string) => {
  const encryptedKey = CryptoJS.AES.encrypt(id, keys.key, {
    iv: keys.iv,
  });

  const scriptValue = $("script[data-name='episode']").attr("data-value");

  const decryptedToken = CryptoJS.AES.decrypt(scriptValue, keys.key, {
    iv: keys.iv,
  }).toString(CryptoJS.enc.Utf8);

  return `id=${encryptedKey}&alias=${id}&${decryptedToken}`;
};
