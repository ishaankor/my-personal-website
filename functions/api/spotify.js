// Cloudflare Pages Function: /api/spotify
// Serves real-time Spotify playback telemetry on Cloudflare Pages

export async function onRequest(context) {
  const { env, request } = context;

  // Handle CORS Preflight
  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    });
  }

  // Read environment variables with fallback defaults
  const clientId = env?.SPOTIFY_CLIENT_ID;
  const clientSecret = env?.SPOTIFY_CLIENT_SECRET;
  const refreshToken = env?.SPOTIFY_REFRESH_TOKEN;

  const basic = btoa(`${clientId}:${clientSecret}`);

  try {
    // 1. Refresh Access Token
    const tokenRes = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: {
        Authorization: `Basic ${basic}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: refreshToken,
      }),
    });

    if (!tokenRes.ok) {
      const err = await tokenRes.text();
      return new Response(JSON.stringify({ isPlaying: false, error: "Token refresh failed", details: err }), {
        status: 200,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      });
    }

    const tokenData = await tokenRes.json();
    const accessToken = tokenData.access_token;

    // 2. Query Currently Playing
    const playerRes = await fetch("https://api.spotify.com/v1/me/player/currently-playing", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (playerRes.status === 200) {
      const data = await playerRes.json();
      if (data && data.item) {
        return new Response(
          JSON.stringify({
            isPlaying: data.is_playing,
            title: data.item.name,
            artist: data.item.artists ? data.item.artists.map((a) => a.name).join(", ") : "Unknown Artist",
            album: data.item.album ? data.item.album.name : "",
            albumImageUrl: data.item.album?.images?.[0]?.url || null,
            songUrl: data.item.external_urls?.spotify || null,
            progressMs: data.progress_ms,
            durationMs: data.item.duration_ms,
            fetchedAt: new Date().toISOString(),
          }),
          {
            status: 200,
            headers: {
              "Content-Type": "application/json",
              "Access-Control-Allow-Origin": "*",
              "Cache-Control": "public, max-age=10, s-maxage=10",
            },
          }
        );
      }
    }

    // 3. Fallback to Recently Played (if paused or idle)
    const recentRes = await fetch("https://api.spotify.com/v1/me/player/recently-played?limit=1", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (recentRes.ok) {
      const recentData = await recentRes.json();
      const track = recentData.items?.[0]?.track;
      if (track) {
        return new Response(
          JSON.stringify({
            isPlaying: false,
            recentlyPlayed: true,
            title: track.name,
            artist: track.artists ? track.artists.map((a) => a.name).join(", ") : "Unknown Artist",
            album: track.album ? track.album.name : "",
            albumImageUrl: track.album?.images?.[0]?.url || null,
            songUrl: track.external_urls?.spotify || null,
            playedAt: recentData.items?.[0]?.played_at,
            fetchedAt: new Date().toISOString(),
          }),
          {
            status: 200,
            headers: {
              "Content-Type": "application/json",
              "Access-Control-Allow-Origin": "*",
              "Cache-Control": "public, max-age=10, s-maxage=10",
            },
          }
        );
      }
    }

    return new Response(
      JSON.stringify({ isPlaying: false, message: "No active or recently played playback found" }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      }
    );
  } catch (err) {
    return new Response(JSON.stringify({ isPlaying: false, error: err.message }), {
      status: 200,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    });
  }
}
