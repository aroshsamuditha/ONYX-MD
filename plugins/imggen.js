const { cmd } = require("../command");
const axios = require("axios");
const config = require("../config");

cmd(
  {
    pattern: "imggen",
    alias: ["aiimg", "generate"],
    react: "🖼️",
    desc: "Generate an AI image using Flux AI",
    category: "utility",
    filename: __filename,
  },
  async (
    robin,
    mek,
    m,
    {
      from,
      body,
      args,
      q,
      reply,
    }
  ) => {
    try {
      const prompt = q || args.join(" ") || body.split(" ").slice(1).join(" ");
      if (!prompt) {
        return reply("Please provide a prompt. Example: .imggen a cat astronaut on mars");
      }

      // Try Flux AI API
      try {
        if (!config.FLUX_API_KEY || config.FLUX_API_KEY.trim() === "") {
          throw new Error("Flux AI API key not set. Please add FLUX_API_KEY to your config.");
        }

        const fluxUrl = "https://api-flux.aiturboapi.com/text-to-prompt";
        const response = await axios.post(
          fluxUrl,
          {
            prompt: prompt,
            width: 1024,
            height: 1024,
            num_images: 1,
            num_inference_steps: 40,
            guidance_scale: 3.5,
            enable_safety_checker: true
          },
          {
            headers: {
              "Content-Type": "application/json",
              "X-API-KEY": config.FLUX_API_KEY
            },
            timeout: 60000
          }
        );

        if (response.data && response.data.images && response.data.images.length > 0) {
          const imgUrl = response.data.images[0].url;
          await robin.sendMessage(
            from,
            {
              image: { url: imgUrl },
              caption: `*Flux AI Image Generator*\nPrompt: ${prompt}\n\nGenerated with Flux AI`,
            },
            { quoted: mek }
          );
          return;
        } else {
          throw new Error("No image returned from Flux AI.");
        }
      } catch (fluxError) {
        console.log("Flux AI API failed:", fluxError.message);
        console.log("Trying fallback...");
      }

      // Fallback to Unsplash API
      try {
        let unsplashUrl;
        if (config.UNSPLASH_API_KEY && config.UNSPLASH_API_KEY.trim() !== "") {
          unsplashUrl = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(prompt)}&per_page=1&client_id=${config.UNSPLASH_API_KEY}`;
          const unsplashRes = await axios.get(unsplashUrl, { timeout: 10000 });
          if (unsplashRes.data && unsplashRes.data.results && unsplashRes.data.results.length > 0) {
            const imgUrl = unsplashRes.data.results[0].urls.regular;
            await robin.sendMessage(
              from,
              {
                image: { url: imgUrl },
                caption: `*🌀ONYX MD🔥AI IMAGE GENERATOR🌀BETA*`,
              },
              { quoted: mek }
            );
            return;
          }
        } else {
          const fallbackUrl = `https://source.unsplash.com/featured/?${encodeURIComponent(prompt)}`;
          await robin.sendMessage(
            from,
            {
              image: { url: fallbackUrl },
              caption: `*Image Search (Public Service)*\nPrompt: ${prompt}\n\nNote: Using public service. For AI generation, add FLUX_API_KEY to your config.`,
            },
            { quoted: mek }
          );
          return;
        }
      } catch (fallbackError) {
        console.error("All services failed:", fallbackError);
        reply("Sorry, image generation services are currently unavailable. Please try again later.");
      }
    } catch (e) {
      console.error(e);
      reply(`Error: ${e.message || e}`);
    }
  }
);
