import { useCallback, useEffect, useRef, useState } from "react";
  import "./styles.scss";

  interface ItunesTrack {
    trackId: number;
    trackName: string;
    artistName: string;
    collectionName: string;
    artworkUrl100: string;
    previewUrl: string | null;
  }

  function searchItunes(query: string): Promise<ItunesTrack[]> {
    return new Promise((resolve, reject) => {
      const cb = `_itcb_${Date.now()}`;
      const script = document.createElement("script");
      const timer = setTimeout(() => { cleanup(); reject(new Error("timeout")); }, 12000);
      const cleanup = () => { clearTimeout(timer); delete (window as any)[cb]; script.remove(); };
      (window as any)[cb] = (d: any) => { cleanup(); resolve(d.results ?? []); };
      script.onerror = () => { cleanup(); reject(new Error("load error")); };
      script.src = `https://itunes.apple.com/search?term=${encodeURIComponent(query)}&media=music&limit=20&callback=${cb}`;
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

    const audioRef = useRef<HTMLAudioElement | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Create audio element once
    useEffect(() => {
      const audio = new Audio();
      audio.preload = "none";
      audio.onplay = () => setIsPlaying(true);
      audio.onpause = () => setIsPlaying(false);
      audio.onended = () => setIsPlaying(false);
      audio.onerror = () => {
        setIsPlaying(false);
        setError("Preview not available for this track — try another one.");
      };
      audioRef.current = audio;
      return () => {
        audio.pause();
        audio.src = "";
      };
    }, []);

    const search = useCallback(async (q: string) => {
      if (!q.trim()) { setResults([]); return; }
      setSearching(true); setError(null);
      try {
        const tracks = await searchItunes(q);
        setResults(tracks);
      } catch {
        setError("Search failed — please try again.");
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, []);

    const onQueryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const v = e.target.value; setQuery(v);
      if (searchTimer.current) clearTimeout(searchTimer.current);
      searchTimer.current = setTimeout(() => search(v), 450);
    };

    // SYNCHRONOUS on click — sets audio.src and calls play() immediately
    // inside the user-gesture callback so browsers never block autoplay.
    const selectTrack = (track: ItunesTrack) => {
      if (!track.previewUrl) {
        setError("No preview available for this track — try another one.");
        return;
      }
      setError(null);
      setCurrentTrack(track);
      setIsOpen(false);
      const audio = audioRef.current!;
      audio.pause();
      audio.src = track.previewUrl;
      audio.load();
      audio.play().catch(() => {
        setError("Playback blocked — tap play to start.");
      });
    };

    const togglePlay = () => {
      const audio = audioRef.current;
      if (!audio) return;
      if (isPlaying) {
        audio.pause();
      } else {
        audio.play().catch(() => {});
      }
    };

    const bigArt = (url: string) =>
      url.replace("100x100bb", "300x300bb").replace("100x100", "300x300");

    const openPanel = () => {
      setIsOpen(true);
      setTimeout(() => inputRef.current?.focus(), 150);
    };

    return (
      <>
        <button className="spotify-fab" onClick={openPanel} title="Search music">
          <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
            <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
          </svg>
          <span>{currentTrack ? "Now Playing" : "Search Music"}</span>
        </button>

        {currentTrack && !isOpen && (
          <div className="spotify-miniplayer">
            <img src={bigArt(currentTrack.artworkUrl100)} alt="" className="spotify-miniplayer__art" />
            <div className="spotify-miniplayer__info">
              <span className="spotify-miniplayer__title">{currentTrack.trackName}</span>
              <span className="spotify-miniplayer__artist">{currentTrack.artistName}</span>
            </div>
            <button className="spotify-miniplayer__btn" onClick={togglePlay}>
              {isPlaying ? "⏸" : "▶"}
            </button>
            <button className="spotify-miniplayer__change" onClick={openPanel}>⊕</button>
          </div>
        )}

        <div className="spotify-overlay" style={{ display: isOpen ? "flex" : "none" }} onClick={() => setIsOpen(false)}>
          <div className="spotify-panel" onClick={e => e.stopPropagation()}>
            <div className="spotify-panel__header">
              <div className="spotify-panel__brand">
                <svg viewBox="0 0 24 24" fill="#1DB954" width="24" height="24">
                  <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
                </svg>
                <div><h3>Music Search</h3><p>30-second previews via iTunes</p></div>
              </div>
              <button className="spotify-close" onClick={() => setIsOpen(false)}>✕</button>
            </div>

            {currentTrack && (
              <div className="spotify-nowplaying">
                <img src={bigArt(currentTrack.artworkUrl100)} alt="" className="spotify-nowplaying__art" />
                <div className="spotify-nowplaying__info">
                  <span className="spotify-nowplaying__label">{isPlaying ? "▶ Playing" : "⏸ Paused"}</span>
                  <span className="spotify-nowplaying__title">{currentTrack.trackName}</span>
                  <span className="spotify-nowplaying__artist">{currentTrack.artistName}</span>
                </div>
                <button className="spotify-nowplaying__btn" onClick={togglePlay}>
                  {isPlaying ? "⏸" : "▶"}
                </button>
              </div>
            )}

            {error && <p className="spotify-error" style={{ margin: "8px 16px" }}>{error}</p>}

            <div className="spotify-search-bar">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="15" height="15">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <input
                ref={inputRef}
                type="text"
                className="spotify-search-input"
                placeholder="Search any song or artist…"
                value={query}
                onChange={onQueryChange}
              />
              {query && (
                <button className="spotify-clear" onClick={() => { setQuery(""); setResults([]); setError(null); inputRef.current?.focus(); }}>✕</button>
              )}
            </div>

            <div className="spotify-results">
              {searching && <div className="spotify-loading"><span/><span/><span/></div>}
              {!searching && !error && !query && (
                <div className="spotify-empty-state">
                  <svg viewBox="0 0 24 24" fill="#1DB954" width="44" height="44" style={{ opacity: 0.22 }}>
                    <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
                  </svg>
                  <p>Type a song name or artist to search</p>
                </div>
              )}
              {!searching && query && results.length === 0 && (
                <p className="spotify-empty">No results for "{query}"</p>
              )}
              {results.map(track => (
                <button
                  key={track.trackId}
                  className={`spotify-track ${currentTrack?.trackId === track.trackId ? "spotify-track--active" : ""} ${!track.previewUrl ? "spotify-track--no-preview" : ""}`}
                  onClick={() => selectTrack(track)}
                  title={!track.previewUrl ? "No preview available" : undefined}
                >
                  <img src={bigArt(track.artworkUrl100)} alt="" className="spotify-track__art" loading="lazy" />
                  <div className="spotify-track__info">
                    <span className="spotify-track__name">{track.trackName}</span>
                    <span className="spotify-track__artist">{track.artistName}</span>
                  </div>
                  <div className="spotify-track__right">
                    {!track.previewUrl
                      ? <span className="spotify-track__no-preview" title="No preview">—</span>
                      : currentTrack?.trackId === track.trackId && isPlaying
                        ? <span className="spotify-track__eq">▐▐</span>
                        : <span className="spotify-track__play">▶</span>}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </>
    );
  };

  export default SpotifyPlayer;
  