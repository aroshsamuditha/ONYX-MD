const { cmd } = require("../command");
const axios = require("axios");
const cheerio = require("cheerio");

cmd(
  {
    pattern: "pin",
    alias: ["pinterest"],
    desc: "Download Pinterest video",
    category: "download",
    react: "📌",
    filename: __filename,
  },
  async (robin, mek, m, { reply, q }) => {
    if (!q) return reply("❌ Please provide a Pinterest video URL.");
    
    // Enhanced Pinterest URL validation
    const pinterestUrlPatterns = [
      /(?:https?:\/\/)?(?:www\.)?pinterest\.com\/pin\/[A-Za-z0-9_-]+/,
      /(?:https?:\/\/)?(?:www\.)?pinterest\.com\/[A-Za-z0-9_-]+\/[A-Za-z0-9_-]+/,
      /(?:https?:\/\/)?(?:www\.)?pinterest\.com\/pin\/[A-Za-z0-9_-]+\/[A-Za-z0-9_-]+/,
      /(?:https?:\/\/)?(?:www\.)?pinterest\.com\/[A-Za-z0-9_-]+\/[A-Za-z0-9_-]+\/[A-Za-z0-9_-]+/,
      /(?:https?:\/\/)?pin\.it\/[A-Za-z0-9_-]+/,
      /(?:https?:\/\/)?pinterest\.com\/pin\/[A-Za-z0-9_-]+\/[A-Za-z0-9_-]+\/[A-Za-z0-9_-]+/,
      /(?:https?:\/\/)?(?:www\.)?pinterest\.com\/[A-Za-z0-9_-]+\/[A-Za-z0-9_-]+\/[A-Za-z0-9_-]+\/[A-Za-z0-9_-]+/,
      /(?:https?:\/\/)?(?:www\.)?pinterest\.com\/tv\/[A-Za-z0-9_-]+/,
      /(?:https?:\/\/)?(?:www\.)?pinterest\.com\/pin\/[A-Za-z0-9_-]+\/[A-Za-z0-9_-]+\/[A-Za-z0-9_-]+\/[A-Za-z0-9_-]+/
    ];
    
    const isValidPinterestUrl = pinterestUrlPatterns.some(pattern => pattern.test(q));
    if (!isValidPinterestUrl) {
      return reply("❌ Invalid Pinterest URL. Please provide a valid Pinterest post, pin, or video URL.\n\nExamples:\n• https://pinterest.com/pin/123456789/\n• https://pin.it/abc123\n• https://www.pinterest.com/user/board/pin/123456789/\n• https://pinterest.com/tv/123456789/\n\nMake sure the URL contains 'pinterest.com' or 'pin.it'");
    }

    try {
      reply("*Downloading your Pinterest video...* 📌");
      
      // Clean and normalize the URL
      let cleanUrl = q.trim();
      if (!cleanUrl.startsWith('http')) {
        cleanUrl = 'https://' + cleanUrl;
      }
      
      // If it's a pin.it URL, try to resolve it first
      if (cleanUrl.includes('pin.it')) {
        try {
          console.log("Resolving pin.it URL:", cleanUrl);
          const resolveResponse = await axios.get(cleanUrl, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.2 Mobile/15E148 Safari/604.1'
            },
            timeout: 10000,
            maxRedirects: 5,
            validateStatus: function (status) {
              return status >= 200 && status < 400; // Accept redirects
            }
          });
          
          // Get the final URL after redirects
          if (resolveResponse.request && resolveResponse.request.res && resolveResponse.request.res.responseUrl) {
            cleanUrl = resolveResponse.request.res.responseUrl;
            console.log("Resolved pin.it URL to:", cleanUrl);
          }
        } catch (resolveErr) {
          console.error("Failed to resolve pin.it URL:", resolveErr.message);
          // Continue with original URL if resolution fails
        }
      }
      
      console.log("Processing Pinterest URL:", cleanUrl);
      console.log("Original URL:", q);
      console.log("URL validation passed:", isValidPinterestUrl);

      // Enhanced headers to mimic a real browser
      const headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate, br',
        'DNT': '1',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Cache-Control': 'max-age=0'
      };

      // First, try to get the page content with retry mechanism
      let response;
      let lastError;
      
      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          console.log(`Attempt ${attempt} to fetch Pinterest content...`);
          
          if (attempt === 1) {
            response = await axios.get(cleanUrl, { 
              headers,
              timeout: 15000,
              maxRedirects: 10
            });
          } else {
            // Use different headers for retry attempts
            const retryHeaders = {
              'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.2 Mobile/15E148 Safari/604.1',
              'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
              'Accept-Language': 'en-US,en;q=0.5',
              'Accept-Encoding': 'gzip, deflate, br',
              'Connection': 'keep-alive'
            };
            
            response = await axios.get(cleanUrl, {
              headers: retryHeaders,
              timeout: 20000,
              maxRedirects: 15
            });
          }
          
          console.log(`Successfully fetched content on attempt ${attempt}`);
          break; // Success, exit the retry loop
          
        } catch (attemptErr) {
          console.error(`Attempt ${attempt} failed:`, attemptErr.message);
          lastError = attemptErr;
          
          if (attempt === 3) {
            // All attempts failed
            throw lastError;
          }
          
          // Wait a bit before retrying
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }

      const $ = cheerio.load(response.data);
      
      let videoUrl = null;
      let title = "Pinterest Video";

      // Method 1: Look for video sources in the page
      $('video source').each((i, elem) => {
        const src = $(elem).attr('src');
        if (src && (src.includes('pinimg.com') || src.includes('pinterest.com'))) {
          videoUrl = src;
          return false;
        }
      });

      // Method 2: Look for video URLs in script tags with multiple patterns
      if (!videoUrl) {
        $('script').each((i, elem) => {
          const content = $(elem).html();
          if (content) {
            // Enhanced regex patterns to catch different Pinterest video URL formats
            const patterns = [
              /"video":{"url":"([^"]+)"/,
              /"videoUrl":"([^"]+)"/,
              /"contentUrl":"([^"]+)"/,
              /"url":"([^"]*pinimg\.com[^"]*)"/,
              /"src":"([^"]*pinimg\.com[^"]*)"/,
              /"video":{"url":"([^"]*pinimg\.com[^"]*)"/
            ];
            
            for (const pattern of patterns) {
              const match = content.match(pattern);
              if (match && match[1]) {
                videoUrl = match[1].replace(/\\/g, '');
                if (videoUrl.includes('pinimg.com')) {
                  console.log("Found video URL in script:", videoUrl);
                  return false;
                }
              }
            }
          }
        });
      }

      // Method 2.5: Look for video URLs in the page content with more patterns
      if (!videoUrl) {
        const pageContent = response.data;
        const videoPatterns = [
          /"video":{"url":"([^"]+)"/,
          /"videoUrl":"([^"]+)"/,
          /"contentUrl":"([^"]+)"/,
          /"url":"([^"]*pinimg\.com[^"]*)"/,
          /"src":"([^"]*pinimg\.com[^"]*)"/,
          /"video":{"url":"([^"]*pinimg\.com[^"]*)"/
        ];
        
        for (const pattern of videoPatterns) {
          const matches = pageContent.match(new RegExp(pattern.source, 'g'));
          if (matches) {
            for (const match of matches) {
              const urlMatch = match.match(pattern);
              if (urlMatch && urlMatch[1]) {
                const potentialUrl = urlMatch[1].replace(/\\/g, '');
                if (potentialUrl.includes('pinimg.com') && potentialUrl.includes('.mp4')) {
                  videoUrl = potentialUrl;
                  console.log("Found video URL in page content:", videoUrl);
                  break;
                }
              }
            }
            if (videoUrl) break;
          }
        }
      }

      // Method 3: Look for JSON-LD structured data
      if (!videoUrl) {
        $('script[type="application/ld+json"]').each((i, elem) => {
          try {
            const jsonData = JSON.parse($(elem).html());
            if (jsonData.contentUrl && jsonData.contentUrl.includes('pinimg.com')) {
              videoUrl = jsonData.contentUrl;
              return false;
            }
            // Check for video property in JSON-LD
            if (jsonData.video && jsonData.video.contentUrl) {
              videoUrl = jsonData.video.contentUrl;
              return false;
            }
          } catch (e) {
            // Ignore JSON parse errors
          }
        });
      }

      // Method 4: Look for og:video meta tags
      if (!videoUrl) {
        const ogVideo = $('meta[property="og:video"]').attr('content');
        if (ogVideo && (ogVideo.includes('pinimg.com') || ogVideo.includes('pinterest.com'))) {
          videoUrl = ogVideo;
        }
      }

      // Method 5: Look for video URLs in data attributes
      if (!videoUrl) {
        $('[data-video-url]').each((i, elem) => {
          const videoUrlAttr = $(elem).attr('data-video-url');
          if (videoUrlAttr && videoUrlAttr.includes('pinimg.com')) {
            videoUrl = videoUrlAttr;
            return false;
          }
        });
      }

      // Method 6: Try to find any URL containing pinimg.com in the page
      if (!videoUrl) {
        const pageText = $.text();
        const urlMatch = pageText.match(/(https?:\/\/[^"'\s]*pinimg\.com[^"'\s]*)/);
        if (urlMatch) {
          videoUrl = urlMatch[1];
          console.log("Found video URL in page text:", videoUrl);
        }
      }

      // Method 7: Look for video URLs in the raw HTML with more specific patterns
      if (!videoUrl) {
        const pageContent = response.data;
        const videoUrlPatterns = [
          /https:\/\/[^"'\s]*pinimg\.com[^"'\s]*\.mp4[^"'\s]*/g,
          /https:\/\/[^"'\s]*pinimg\.com[^"'\s]*\.mov[^"'\s]*/g,
          /https:\/\/[^"'\s]*pinimg\.com[^"'\s]*\.webm[^"'\s]*/g,
          /"url":"([^"]*pinimg\.com[^"]*\.mp4[^"]*)"/g,
          /"src":"([^"]*pinimg\.com[^"]*\.mp4[^"]*)"/g
        ];
        
        for (const pattern of videoUrlPatterns) {
          const matches = pageContent.match(pattern);
          if (matches && matches.length > 0) {
            for (const match of matches) {
              const cleanUrl = match.replace(/"/g, '').replace(/\\/g, '');
              if (cleanUrl.includes('pinimg.com') && (cleanUrl.includes('.mp4') || cleanUrl.includes('.mov') || cleanUrl.includes('.webm'))) {
                videoUrl = cleanUrl;
                console.log("Found video URL with file extension:", videoUrl);
                break;
              }
            }
            if (videoUrl) break;
          }
        }
      }

      // Method 8: Look for Pinterest's new video structure
      if (!videoUrl) {
        const pageContent = response.data;
        const newVideoPatterns = [
          /"video":{"url":"([^"]+)"/g,
          /"videoUrl":"([^"]+)"/g,
          /"contentUrl":"([^"]+)"/g,
          /"mediaUrl":"([^"]+)"/g,
          /"downloadUrl":"([^"]+)"/g
        ];
        
        for (const pattern of newVideoPatterns) {
          const matches = pageContent.match(pattern);
          if (matches) {
            for (const match of matches) {
              const urlMatch = match.match(/"([^"]+)":"([^"]+)"/);
              if (urlMatch && urlMatch[2]) {
                const potentialUrl = urlMatch[2].replace(/\\/g, '');
                if (potentialUrl.includes('pinimg.com') || potentialUrl.includes('pinterest.com')) {
                  videoUrl = potentialUrl;
                  console.log("Found video URL with new pattern:", videoUrl);
                  break;
                }
              }
            }
            if (videoUrl) break;
          }
        }
      }

      // Method 9: Look for Pinterest's video API data
      if (!videoUrl) {
        const pageContent = response.data;
        const apiPatterns = [
          /"videoData":\s*\{[^}]*"url":\s*"([^"]+)"/g,
          /"mediaData":\s*\{[^}]*"url":\s*"([^"]+)"/g,
          /"contentData":\s*\{[^}]*"url":\s*"([^"]+)"/g,
          /"pinData":\s*\{[^}]*"video":\s*\{[^}]*"url":\s*"([^"]+)"/g
        ];
        
        for (const pattern of apiPatterns) {
          const matches = pageContent.match(pattern);
          if (matches) {
            for (const match of matches) {
              const urlMatch = match.match(/"url":\s*"([^"]+)"/);
              if (urlMatch && urlMatch[1]) {
                const potentialUrl = urlMatch[1].replace(/\\/g, '');
                if (potentialUrl.includes('pinimg.com') || potentialUrl.includes('pinterest.com')) {
                  videoUrl = potentialUrl;
                  console.log("Found video URL in API data:", videoUrl);
                  break;
                }
              }
            }
            if (videoUrl) break;
          }
        }
      }

      // Get the title/description
      title = $('meta[property="og:title"]').attr('content') || 
              $('meta[name="description"]').attr('content') || 
              $('title').text() ||
              "Pinterest Video";

      if (!videoUrl) {
        return reply("❌ Could not extract video URL from Pinterest. The video might be:\n• Private or restricted\n• Not a video pin\n• Requiring login\n\nPlease try a different Pinterest video URL.");
      }

      // Check if the URL is actually a video (not an image)
      const isVideoUrl = videoUrl.includes('.mp4') || videoUrl.includes('.mov') || videoUrl.includes('.webm') || 
                        videoUrl.includes('video') || videoUrl.includes('media') || videoUrl.includes('content');
      
      if (!isVideoUrl) {
        console.log("Warning: Extracted URL might be an image, not a video:", videoUrl);
        // Try to find a video URL instead
        const pageContent = response.data;
        const videoPatterns = [
          /https:\/\/[^"'\s]*pinimg\.com[^"'\s]*\.mp4[^"'\s]*/g,
          /https:\/\/[^"'\s]*pinimg\.com[^"'\s]*\.mov[^"'\s]*/g,
          /https:\/\/[^"'\s]*pinimg\.com[^"'\s]*\.webm[^"'\s]*/g
        ];
        
        for (const pattern of videoPatterns) {
          const matches = pageContent.match(pattern);
          if (matches && matches.length > 0) {
            videoUrl = matches[0];
            console.log("Found actual video URL:", videoUrl);
            break;
          }
        }
      }

      console.log("Final video URL:", videoUrl);

      // Validate the video URL
      try {
        const videoResponse = await axios.head(videoUrl, { 
          headers,
          timeout: 5000 
        });
        
        if (videoResponse.status !== 200) {
          throw new Error('Video URL not accessible');
        }
        
        // Check if it's actually a video by looking at content-type
        const contentType = videoResponse.headers['content-type'];
        if (contentType && !contentType.includes('video/')) {
          console.log("Warning: URL might not be a video, content-type:", contentType);
        }
      } catch (videoErr) {
        console.error("Video URL validation failed:", videoErr.message);
        return reply("❌ The extracted video URL is not accessible. Pinterest may have changed their structure.");
      }

      // Send the video
      await robin.sendFileUrl(
        mek.key.remoteJid,
        videoUrl,
        `📌 *Pinterest Video*\n\n📄 *Title*: ${title}\n\n> *Thanks for using 🌀ONYX MD🔥*`,
        mek
      );

    } catch (err) {
      console.error("Pinterest download error:", err);
      
      // Provide more specific error messages
      if (err.code === 'ECONNREFUSED' || err.code === 'ENOTFOUND') {
        reply("❌ Network error: Unable to connect to Pinterest. Please check your internet connection.");
      } else if (err.response && err.response.status === 403) {
        reply("❌ Access denied: Pinterest is blocking the request. The video might be private or require login.");
      } else if (err.response && err.response.status === 404) {
        reply("❌ Video not found: The Pinterest URL might be invalid or the video has been removed.");
      } else if (err.code === 'ETIMEDOUT' || err.code === 'ECONNABORTED') {
        reply("❌ Timeout: Pinterest is taking too long to respond. This might be due to:\n• High server load\n• Rate limiting\n• Network issues\n\nPlease try again in a few minutes or use a different Pinterest URL.");
      } else {
        reply("❌ Failed to download video. Error: " + err.message + "\n\nPlease check the link and try again.");
      }
    }
  }
); 