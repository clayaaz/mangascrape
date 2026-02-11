import React, { useEffect, useState } from "react";
import { ScrollView } from "react-native";
import cheerio from "react-native-cheerio";
import Card from "./components/card";

async function scrape(url: string) {
  const res = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0" },
  });
  const html = await res.text();

  const $ = cheerio.load(html);

  return {
    mangas: $("#book_list .item")
      .map(function (i: number, el: any) {
        return {
          title: $(el).find(".title a").text(),
          link: $(el).find(".title a").attr("href"),
          img: $(el).find(".wrap_img img").attr("src"),
          summary: $(el).find(".summary").text(),
        };
      })
      .get(),
  };
}

export default function Loader(url) {
  const [mangas, setMangas] = useState<string[]>([]);

  useEffect(() => {
    scrape(url).then((result) => setMangas(result.mangas));
  }, []);
  return (
    <ScrollView>
      {mangas.map((manga, index) => (
        <Card key={index} manga={manga} />
      ))}
    </ScrollView>
  );
}
