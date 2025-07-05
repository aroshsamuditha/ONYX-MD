const { cmd } = require("../command");
const { instagramGetUrl } = require("instagram-url-direct");
const axios = require("axios");

cmd(
  {
    pattern: "insta",
    alias: ["instagram", "igreel"],
    react: "📸",
    desc: "Download Instagram Video or Reel",
    category: "download",
    filename: __filename,
  },
  async (
    robin,
    mek,
    m,
    {
      from,
      quoted,
      body,
      isCmd,
      command,
      args,
      q,
      reply,
    }
  ) => {
    try {
      if (!q) return reply("*Please provide a valid Instagram video or reel URL!* 📸");

      // Enhanced Instagram URL validation
      const instaRegex = /(?:https?:\/\/)?(?:www\.)?instagram\.com\/(?:reel|p|tv)\/[A-Za-z0-9_-]+/;
      if (!instaRegex.test(q)) {
        return reply("*Invalid Instagram URL! Please provide a valid Instagram post, reel, or video URL.* 📸");
      }

      reply("*Downloading your Instagram video...* 📸");

      let videoUrl = null;
      let errorMessage = "";

      // Method 1: Try instagram-url-direct
      try {
        const result = await instagramGetUrl(q);
        if (result && result.url_list && result.url_list.length > 0) {
          videoUrl = result.url_list[0];
        }
      } catch (err) {
        console.error("instagram-url-direct failed:", err.message);
        errorMessage = err.message;
      }

      // Method 2: Fallback to direct API approach if first method fails
      if (!videoUrl) {
        try {
          // Try to extract video URL using a different approach
          const response = await axios.get(q, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
              'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
              'Accept-Language': 'en-US,en;q=0.5',
              'Accept-Encoding': 'gzip, deflate, br',
              'DNT': '1',
              'Connection': 'keep-alive',
              'Upgrade-Insecure-Requests': '1',
              'Sec-Fetch-Dest': 'document',
              'Sec-Fetch-Mode': 'navigate',
              'Sec-Fetch-Site': 'none'
            },
            timeout: 15000,
            maxRedirects: 5
          });

          // Look for video URL in the page content with multiple patterns
          const pageContent = response.data;
          const patterns = [
            /"video_url":"([^"]+)"/,
            /"video":{"url":"([^"]+)"/,
            /"contentUrl":"([^"]*instagram[^"]*)"/,
            /"src":"([^"]*instagram[^"]*)"/,
            /"url":"([^"]*instagram[^"]*)"/
          ];
          
          for (const pattern of patterns) {
            const match = pageContent.match(pattern);
            if (match && match[1]) {
              videoUrl = match[1].replace(/\\/g, '');
              if (videoUrl.includes('instagram.com') || videoUrl.includes('cdninstagram.com')) {
                break;
              }
            }
          }
        } catch (fallbackErr) {
          console.error("Fallback method failed:", fallbackErr.message);
        }
      }

      // Method 3: Try using a different approach with shorter timeout
      if (!videoUrl) {
        try {
          const response = await axios.get(q, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.2 Mobile/15E148 Safari/604.1'
            },
            timeout: 8000
          });

          const pageContent = response.data;
          // Look for any Instagram video URL
          const videoMatch = pageContent.match(/(https?:\/\/[^"'\s]*cdninstagram\.com[^"'\s]*)/);
          if (videoMatch) {
            videoUrl = videoMatch[1];
          }
        } catch (mobileErr) {
          console.error("Mobile fallback method failed:", mobileErr.message);
        }
      }

      if (!videoUrl) {
        const errorDetails = errorMessage ? `\n\nError details: ${errorMessage}` : "";
        return reply(`*Failed to download Instagram video.* 📸\n\nPossible reasons:\n• Private or restricted content\n• Invalid or expired link\n• Instagram blocking requests\n• Network issues${errorDetails}\n\nPlease try again with a different link.`);
      }

      // Validate the video URL
      try {
        const videoResponse = await axios.head(videoUrl, { 
          timeout: 5000,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
          }
        });
        
        if (videoResponse.status !== 200) {
          throw new Error('Video URL not accessible');
        }
      } catch (videoErr) {
        console.error("Video URL validation failed:", videoErr.message);
        return reply("*The extracted video URL is not accessible. Instagram may have changed their structure.* 📸");
      }

      // Send the video
      await robin.sendMessage(
        from,
        { 
          video: { url: videoUrl }, 
          caption: "*📸 Instagram Video Downloaded Successfully!*\n\n> *Thanks for using 🌀ONYX MD🔥 Instagram Downloader!*" 
        },
        { quoted: mek }
      );

    } catch (e) {
      console.error("Instagram download error:", e);
      
      // Provide specific error messages
      if (e.code === 'ECONNREFUSED' || e.code === 'ENOTFOUND') {
        reply("*❌ Network error: Unable to connect to Instagram. Please check your internet connection.* 📸");
      } else if (e.response && e.response.status === 403) {
        reply("*❌ Access denied: Instagram is blocking the request. The content might be private.* 📸");
      } else if (e.response && e.response.status === 404) {
        reply("*❌ Content not found: The Instagram URL might be invalid or the content has been removed.* 📸");
      } else if (e.code === 'ETIMEDOUT') {
        reply("*❌ Timeout: The request took too long. Please try again.* 📸");
      } else {
        reply(`*❌ Error: ${e.message || e}*\n\nPlease try again with a different Instagram URL.`);
      }
    }
  }
); 