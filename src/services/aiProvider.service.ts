import groq from "./groq.service";

export async function enrich(prompt: string) {
    try {
        const response = await groq.chat.completions.create({
            model: "llama-3.3-70b-versatile",
            temperature: 0,
            messages: [
                {
                    role: "user",
                    content: prompt,
                },
            ],
        });

        const text = response.choices[0].message.content ?? "";

        console.log("RAW RESPONSE:");
        console.log(text);

        return text;
    } catch (err) {
        console.error("GROQ ERROR:");
        console.error(err);
        throw err;
    }
}