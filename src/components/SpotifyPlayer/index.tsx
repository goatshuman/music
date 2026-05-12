import { useCallback, useRef, useState } from "react";
  import "./styles.scss";

  interface ItunesTrack {
    trackId: number;
    trackName: string;
    artistName: string;
    collectionName: string;
    artworkUrl100: string;
    previewUrl: string | null;
    trackViewUrl: string;
    trackTimeMillis: number;
  }

  function searchItunes(query: string): Promise<ItunesTrack[]> {
    return new Promise((resolve, reject) => {
      const cbName = `_itcb_${Date.now()}_${Math.random().toString(36).slice(2)}`;
      const script = document.createElement("script");
      const cleanup = () => { delete (window as any)[cbName]; script.remove(); };
      const timer = setTimeout(() => { cleanup(); reject(new Error("timeout")); }, 12000);
      (window as any)[cbName] = (data: any) => { clearTimeout(timer); cleanup(); resolve(data.results ?? []); };
      script.onerror = () => { clearTimeout(timer); cleanup(); reject(new Error("load")); };
      script.src = `https://itunes.apple.com/search?term=${encodeURIComponent(query)}&media=music&limit=20&callback=${cbName}`;
      document.head.appendChild(script);
    });
  }

  const SpotifyPlayer = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<ItunesTrack[]>([]);
    const [currentTrack, setCurrentTrack] = useState<ItunesTrack | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [searching, setSearching] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [ytKey, setYtKey] = useState(0);
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

    const postCmd = (cmd: string) => {
      iframeRef.current?.contentWindow?.postMessage(
        JSON.stringify({ event: "command", func: cmd, args: [] }), "*"
      );
    };

    const search = useCallback(async (q: string) => {
      if (!q.trim()) { setResults([]); return; }
      setSearching(true); setError(null);
      try { setResults(await searchItunes(q)); }
      catch { setError("Search failed — try again."); setResults([]); }
      finally { setSearching(false); }
    }, []);

    const handleQueryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const v = e.target.value; setQuery(v);
      if (searchTimeout.current) clearTimeout(searchTimeout.current);
      searchTimeout.current = setTimeout(() => search(v), 450);
    };

    const selectTrack = (track: ItunesTrack) => {
      setCurrentTrack(track);
      setIsPlaying(true);
      setYtKey(k => k + 1);
      setIsOpen(false); // close panel, music plays in background
    };

    const togglePlay = () => {
      if (isPlaying) { postCmd("pauseVideo"); setIsPlaying(false); }
      else { postCmd("playVideo"); setIsPlaying(true); }
    };

    const bigArt = (url: string) => url.replace("100x100", "300x300");

    const ytSearch = currentTrack
      ? encodeURIComponent(`${currentTrack.trackName} ${currentTrack.artistName}`)
      : "";

    return (
      <>
        {/* Hidden YouTube iframe — plays full song in background */}
        {currentTrack && (
          <iframe
            key={ytKey}
            ref={iframeRef}
            src={`https://www.youtube.com/embed?listType=search&list=${ytSearch}&autoplay=1&controls=0&enablejsapi=1`}
            allow="autoplay; encrypted-media"
            style={{ position: "fixed", top: -9999, left: -9999, width: 2, height: 2, border: "none", opacity: 0, pointerEvents: "none" }}
            title="background-player"
          />
        )}

        {/* FAB button */}
        <button className="spotify-fab" onClick={() => { setIsOpen(v => !v); setTimeout(() => inputRef.current?.focus(), 150); }} title="Music">
          <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
            <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
          </svg>
          <span>{currentTrack ? "Music" : "Spotify"}</span>
        </button>

        {/* Mini player — shown when a song is playing and panel is closed */}
        {currentTrack && !isOpen && (
          <div className="spotify-miniplayer">
            <img src={bigArt(currentTrack.artworkUrl100)} alt={currentTrack.trackName} className="spotify-miniplayer__art" />
            <div className="spotify-miniplayer__info">
              <span className="spotify-miniplayer__title">{currentTrack.trackName}</span>
              <span className="spotify-miniplayer__artist">{currentTrack.artistName}</span>
            </div>
            <button className="spotify-miniplayer__btn" onClick={togglePlay} title={isPlaying ? "Pause" : "Play"}>
              {isPlaying ? "⏸" : "▶"}
            </button>
            <button className="spotify-miniplayer__change" onClick={() => setIsOpen(true)} title="Change song">
              ⊕
            </button>
          </div>
        )}

        {/* Search panel */}
        {isOpen && (
          <div className="spotify-overlay" onClick={() => setIsOpen(false)}>
            <div className="spotify-panel" onClick={e => e.stopPropagation()}>
              <div className="spotify-panel__header">
                <div className="spotify-panel__brand">
                  <svg viewBox="0 0 24 24" fill="#1DB954" width="26" height="26">
                    <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
                  </svg>
                  <div><h3>Music Search</h3><p>Search any song — plays in background</p></div>
                </div>
                <button className="spotify-close" onClick={() => setIsOpen(false)}>✕</button>
              </div>

              {currentTrack && (
                <div className="spotify-nowplaying">
                  <img src={bigArt(currentTrack.artworkUrl100)} alt="" className="spotify-nowplaying__art" />
                  <div className="spotify-nowplaying__info">
                    <span className="spotify-nowplaying__title">{currentTrack.trackName}</span>
                    <span className="spotify-nowplaying__artist">{currentTrack.artistName}</span>
                    <span style={{fontSize:11,color:"#aaa",marginTop:2}}>Playing full song via YouTube</span>
                  </div>
                  <button className="spotify-nowplaying__btn" onClick={togglePlay}>{isPlaying ? "⏸" : "▶"}</button>
                </div>
              )}

              <div className="spotify-search-bar">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                  <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                </svg>
                <input ref={inputRef} type="text" placeholder="Search songs, artists..." value={query} onChange={handleQueryChange} className="spotify-search-input" />
                {query && <button className="spotify-clear" onClick={() => { setQuery(""); setResults([]); setError(null); inputRef.current?.focus(); }}>✕</button>}
              </div>

              <div className="spotify-results">
                {searching && <div className="spotify-loading"><span/><span/><span/></div>}
                {error && <p className="spotify-error">{error}</p>}
                {!searching && !error && results.length === 0 && !query && (
                  <div className="spotify-empty-state">
                    <svg viewBox="0 0 24 24" fill="#1DB954" width="44" height="44" style={{opacity:0.3}}>
                      <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
                    </svg>
                    <p>Type a song or artist name to search</p>
                  </div>
                )}
                {!searching && !error && results.length === 0 && query && <p className="spotify-empty">No results for "{query}"</p>}
                {results.map(track => (
                  <button key={track.trackId}
                    className={`spotify-track ${currentTrack?.trackId === track.trackId ? "spotify-track--active" : ""}`}
                    onClick={() => selectTrack(track)}>
                    <img src={bigArt(track.artworkUrl100)} alt="" className="spotify-track__art" loading="lazy" />
                    <div className="spotify-track__info">
                      <span className="spotify-track__name">{track.trackName}</span>
                      <span className="spotify-track__artist">{track.artistName}</span>
                    </div>
                    <div className="spotify-track__right">
                      {currentTrack?.trackId === track.trackId && isPlaying
                        ? <span className="spotify-track__eq">▐▐</span>
                        : <span className="spotify-track__play">▶</span>}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </>
    );
  };

  export default SpotifyPlayer;
  