import groq from "./groq.service";

export async function enrich(prompt: string) {
    try {
        const response = await groq.chat.completions.create({
            model: "llama-3.3-70b-versatile",
            temperature: 0.1,
            messages: [
                {
                    role: "user",
                    content: prompt,
                },
            ],
        });

        console.log("RAW RESPONSE:");
        console.log(response.choices[0].message.content);

        return JSON.parse(
            response.choices[0].message.content ?? "{}"
        );
    } catch (err) {
        console.error("GROQ ERROR:");
        console.error(err);
        throw err;
    }
}