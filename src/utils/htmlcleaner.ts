import * as cheerio from "cheerio";

export function cleanHTML(html:string){

const $ = cheerio.load(html);


$("script").remove();
$("style").remove();
$("a").each((_,el)=>{
 $(el).replaceWith($(el).text());
});


const text = $("body")
.text();


return text
.replace(/\n+/g,"\n")
.replace(/[ \t]+/g," ")
.trim();

}