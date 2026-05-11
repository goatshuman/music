import { useEffect, useRef, useState, useCallback } from "react";
  import "./styles.scss";

  const CLIENT_ID = import.meta.env.VITE_SPOTIFY_CLIENT_ID as string;
  const REDIRECT_URI = "https://goatshuman.github.io/music/";
  const SCOPES = "user-read-private user-read-email";
  const TOKEN_KEY = "spotify_access_token";
  const EXPIRY_KEY = "spotify_token_expiry";
  const VERIFIER_KEY = "spotify_code_verifier";

  interface SpotifyTrack {
    id: string;
    name: string;
    artists: { name: string }[];
    album: { name: string; images: { url: string }[] };
    preview_url: string | null;
    duration_ms: number;
  }

  function generateVerifier(length = 64): string {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~";
    const arr = new Uint8Array(length);
    crypto.getRandomValues(arr);
    return Array.from(arr)
      .map((x) => chars[x % chars.length])
      .join("");
  }

  async function generateChallenge(verifier: string): Promise<string> {
    const data = new TextEncoder().encode(verifier);
    const digest = await crypto.subtle.digest("SHA-256", data);
    return btoa(String.fromCharCode(...new Uint8Array(digest)))
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=/g, "");
  }

  function getStoredToken(): string | null {
    const token = localStorage.getItem(TOKEN_KEY);
    const expiry = localStorage.getItem(EXPIRY_KEY);
    if (token && expiry && Date.now() < parseInt(expiry)) return token;
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(EXPIRY_KEY);
    return null;
  }

  const SpotifyPlayer = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [accessToken, setAccessToken] = useState<string | null>(null);
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<SpotifyTrack[]>([]);
    const [selectedTrack, setSelectedTrack] = useState<SpotifyTrack | null>(null);
    const [searching, setSearching] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
      const params = new URLSearchParams(window.location.search);
      const code = params.get("code");
      if (code) {
        const verifier = sessionStorage.getItem(VERIFIER_KEY);
        if (verifier) {
          exchangeCode(code, verifier);
          window.history.replaceState({}, "", window.location.pathname);
        }
      }
      const stored = getStoredToken();
      if (stored) setAccessToken(stored);
    }, []);

    const exchangeCode = async (code: string, verifier: string) => {
      try {
        const res = await fetch("https://accounts.spotify.com/api/token", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({
            grant_type: "authorization_code",
            code,
            redirect_uri: REDIRECT_URI,
            client_id: CLIENT_ID,
            code_verifier: verifier,
          }),
        });
        const data = await res.json();
        if (data.access_token) {
          localStorage.setItem(TOKEN_KEY, data.access_token);
          localStorage.setItem(EXPIRY_KEY, String(Date.now() + data.expires_in * 1000));
          sessionStorage.removeItem(VERIFIER_KEY);
          setAccessToken(data.access_token);
          setIsOpen(true);
        } else {
          setError("Authentication failed. Please try again.");
        }
      } catch {
        setError("Authentication failed. Please try again.");
      }
    };

    const login = async () => {
      if (!CLIENT_ID) {
        setError("Spotify Client ID not configured.");
        setIsOpen(true);
        return;
      }
      const verifier = generateVerifier();
      const challenge = await generateChallenge(verifier);
      sessionStorage.setItem(VERIFIER_KEY, verifier);
      const url = new URL("https://accounts.spotify.com/authorize");
      url.searchParams.set("client_id", CLIENT_ID);
      url.searchParams.set("response_type", "code");
      url.searchParams.set("redirect_uri", REDIRECT_URI);
      url.searchParams.set("scope", SCOPES);
      url.searchParams.set("code_challenge_method", "S256");
      url.searchParams.set("code_challenge", challenge);
      window.location.href = url.toString();
    };

    const logout = () => {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(EXPIRY_KEY);
      setAccessToken(null);
      setResults([]);
      setSelectedTrack(null);
      setQuery("");
    };

    const search = useCallback(
      async (q: string) => {
        if (!q.trim() || !accessToken) return;
        setSearching(true);
        setError(null);
        try {
          const res = await fetch(
            `https://api.spotify.com/v1/search?q=${encodeURIComponent(q)}&type=track&limit=20`,
            { headers: { Authorization: `Bearer ${accessToken}` } }
          );
          if (res.status === 401) {
            logout();
            setError("Session expired. Please reconnect Spotify.");
            return;
          }
          const data = await res.json();
          setResults(data.tracks?.items ?? []);
        } catch {
          setError("Search failed. Check your connection.");
        } finally {
          setSearching(false);
        }
      },
      [accessToken]
    );

    const handleQueryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const v = e.target.value;
      setQuery(v);
      if (searchTimeout.current) clearTimeout(searchTimeout.current);
      if (v.trim()) {
        searchTimeout.current = setTimeout(() => search(v), 400);
      } else {
        setResults([]);
      }
    };

    const handleOpen = () => {
      setIsOpen(true);
      setTimeout(() => inputRef.current?.focus(), 200);
    };

    const formatMs = (ms: number) => {
      const s = Math.floor(ms / 1000);
      return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
    };

    return (
      <>
        <button className="spotify-fab" onClick={handleOpen} title="Open Spotify Search">
          <svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22">
            <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
          </svg>
          <span>Spotify</span>
        </button>

        {isOpen && (
          <div className="spotify-overlay" onClick={() => setIsOpen(false)}>
            <div className="spotify-panel" onClick={(e) => e.stopPropagation()}>
              <div className="spotify-panel__header">
                <div className="spotify-panel__brand">
                  <svg viewBox="0 0 24 24" fill="#1DB954" width="28" height="28">
                    <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
                  </svg>
                  <div>
                    <h3>Spotify Search</h3>
                    <p>Play your favourite music from here</p>
                  </div>
                </div>
                <div className="spotify-panel__actions">
                  {accessToken && (
                    <button className="spotify-logout" onClick={logout} title="Disconnect Spotify">
                      Disconnect
                    </button>
                  )}
                  <button className="spotify-close" onClick={() => setIsOpen(false)}>✕</button>
                </div>
              </div>

              {!accessToken ? (
                <div className="spotify-login">
                  <svg viewBox="0 0 24 24" fill="#1DB954" width="64" height="64">
                    <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
                  </svg>
                  <p>Connect your Spotify account to search and play any song</p>
                  {error && <span className="spotify-error">{error}</span>}
                  <button className="spotify-login-btn" onClick={login}>
                    Connect with Spotify
                  </button>
                </div>
              ) : (
                <div className="spotify-body">
                  <div className="spotify-search-bar">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                      <circle cx="11" cy="11" r="8" />
                      <line x1="21" y1="21" x2="16.65" y2="16.65" />
                    </svg>
                    <input
                      ref={inputRef}
                      type="text"
                      placeholder="Search songs, artists, albums..."
                      value={query}
                      onChange={handleQueryChange}
                      className="spotify-search-input"
                    />
                    {query && (
                      <button
                        className="spotify-clear"
                        onClick={() => { setQuery(""); setResults([]); inputRef.current?.focus(); }}
                      >✕</button>
                    )}
                  </div>

                  {error && <p className="spotify-error spotify-error--center">{error}</p>}

                  <div className="spotify-results">
                    {searching && (
                      <div className="spotify-loading">
                        <span /><span /><span />
                      </div>
                    )}
                    {!searching && results.length === 0 && query && (
                      <p className="spotify-empty">No results for "{query}"</p>
                    )}
                    {!searching && results.length === 0 && !query && (
                      <p className="spotify-empty">Start typing to search any song on Spotify</p>
                    )}
                    {results.map((track) => (
                      <button
                        key={track.id}
                        className={`spotify-track ${selectedTrack?.id === track.id ? "spotify-track--active" : ""}`}
                        onClick={() => setSelectedTrack(track)}
                      >
                        <img
                          src={track.album.images[2]?.url ?? track.album.images[0]?.url}
                          alt={track.album.name}
                          className="spotify-track__art"
                          loading="lazy"
                        />
                        <div className="spotify-track__info">
                          <span className="spotify-track__name">{track.name}</span>
                          <span className="spotify-track__artist">
                            {track.artists.map((a) => a.name).join(", ")}
                          </span>
                        </div>
                        <span className="spotify-track__duration">{formatMs(track.duration_ms)}</span>
                        {selectedTrack?.id === track.id && (
                          <span className="spotify-track__playing">▶</span>
                        )}
                      </button>
                    ))}
                  </div>

                  {selectedTrack && (
                    <div className="spotify-embed">
                      <iframe
                        key={selectedTrack.id}
                        src={`https://open.spotify.com/embed/track/${selectedTrack.id}?utm_source=generator&theme=0`}
                        width="100%"
                        height="152"
                        frameBorder="0"
                        allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                        loading="lazy"
                        title={`${selectedTrack.name} - ${selectedTrack.artists[0]?.name}`}
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </>
    );
  };

  export default SpotifyPlayer;
  