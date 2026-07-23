import he from "he";
import * as cheerio from "cheerio";


export function cleanJobDescription(
    html:string
):string {


    if(!html)
        return "";


    try {


        // Decode:
        // &lt;p&gt; => <p>
        // &amp;nbsp; => &nbsp;

        const decoded = he.decode(html);



        const $ = cheerio.load(decoded);



        // Remove useless HTML

        $("script").remove();
        $("style").remove();



        return $.text()

        .replace(/\u00a0/g," ")

        .replace(/\s+/g," ")

        .trim()

        .slice(0,8000);



    }
    catch(error){


        return html
        .replace(/<[^>]*>/g," ")
        .trim();

    }

}