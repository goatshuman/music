import { useCallback, useRef, useState } from "react";
  import "./styles.scss";

  interface DeezerTrack {
    id: number;
    title: string;
    artist: { name: string };
    album: { title: string; cover_medium: string };
    preview: string;
    link: string;
    duration: number;
  }

  const SpotifyPlayer = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<DeezerTrack[]>([]);
    const [currentTrack, setCurrentTrack] = useState<DeezerTrack | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [searching, setSearching] = useState(false);
    const [progress, setProgress] = useState(0);
    const [error, setError] = useState<string | null>(null);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

    const handleOpen = () => {
      setIsOpen(true);
      setTimeout(() => inputRef.current?.focus(), 150);
    };

    const handleClose = () => {
      setIsOpen(false);
      audioRef.current?.pause();
    };

    const search = useCallback(async (q: string) => {
      if (!q.trim()) { setResults([]); return; }
      setSearching(true);
      setError(null);
      try {
        const res = await fetch(
          `https://api.deezer.com/search?q=${encodeURIComponent(q)}&limit=20&output=json`
        );
        const data = await res.json();
        if (data.error) throw new Error(data.error.message);
        setResults(data.data ?? []);
      } catch {
        setError("Search failed. Check your connection.");
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, []);

    const handleQueryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const v = e.target.value;
      setQuery(v);
      if (searchTimeout.current) clearTimeout(searchTimeout.current);
      searchTimeout.current = setTimeout(() => search(v), 400);
    };

    const playTrack = (track: DeezerTrack) => {
      if (!track.preview) return;
      if (currentTrack?.id === track.id) {
        if (isPlaying) { audioRef.current?.pause(); setIsPlaying(false); }
        else { audioRef.current?.play(); setIsPlaying(true); }
        return;
      }
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = track.preview;
        audioRef.current.play();
      }
      setCurrentTrack(track);
      setIsPlaying(true);
      setProgress(0);
    };

    const fmt = (s: number) =>
      `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

    return (
      <>
        <audio
          ref={audioRef}
          onTimeUpdate={() => {
            if (!audioRef.current) return;
            setProgress(
              (audioRef.current.currentTime / (audioRef.current.duration || 30)) * 100
            );
          }}
          onEnded={() => setIsPlaying(false)}
        />

        <button className="spotify-fab" onClick={handleOpen} title="Search Music">
          <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
            <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
          </svg>
          <span>Spotify</span>
        </button>

        {isOpen && (
          <div className="spotify-overlay" onClick={handleClose}>
            <div className="spotify-panel" onClick={e => e.stopPropagation()}>

              <div className="spotify-panel__header">
                <div className="spotify-panel__brand">
                  <svg viewBox="0 0 24 24" fill="#1DB954" width="26" height="26">
                    <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
                  </svg>
                  <div>
                    <h3>Music Search</h3>
                    <p>Search &amp; play any song instantly</p>
                  </div>
                </div>
                <button className="spotify-close" onClick={handleClose}>✕</button>
              </div>

              <div className="spotify-search-bar">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                  <circle cx="11" cy="11" r="8"/>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"/>
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

              <div className="spotify-results">
                {searching && (
                  <div className="spotify-loading"><span/><span/><span/></div>
                )}
                {error && <p className="spotify-error">{error}</p>}
                {!searching && !error && results.length === 0 && !query && (
                  <div className="spotify-empty-state">
                    <svg viewBox="0 0 24 24" fill="#1DB954" width="44" height="44" style={{opacity:0.3}}>
                      <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
                    </svg>
                    <p>Type a song or artist name to search</p>
                  </div>
                )}
                {!searching && results.length === 0 && query && !error && (
                  <p className="spotify-empty">No results for "{query}"</p>
                )}
                {results.map(track => (
                  <button
                    key={track.id}
                    className={`spotify-track ${currentTrack?.id === track.id ? "spotify-track--active" : ""}`}
                    onClick={() => playTrack(track)}
                    title={track.preview ? "Click to play 30s preview" : "No preview available"}
                  >
                    <img
                      src={track.album.cover_medium}
                      alt={track.album.title}
                      className="spotify-track__art"
                      loading="lazy"
                    />
                    <div className="spotify-track__info">
                      <span className="spotify-track__name">{track.title}</span>
                      <span className="spotify-track__artist">{track.artist.name}</span>
                    </div>
                    <div className="spotify-track__right">
                      <span className="spotify-track__duration">{fmt(track.duration)}</span>
                      {currentTrack?.id === track.id && isPlaying
                        ? <span className="spotify-track__eq">▐▐</span>
                        : <span className="spotify-track__play">{track.preview ? "▶" : "—"}</span>}
                    </div>
                  </button>
                ))}
              </div>

              {currentTrack && (
                <div className="spotify-nowplaying">
                  <img
                    src={currentTrack.album.cover_medium}
                    alt={currentTrack.album.title}
                    className="spotify-nowplaying__art"
                  />
                  <div className="spotify-nowplaying__info">
                    <span className="spotify-nowplaying__title">{currentTrack.title}</span>
                    <span className="spotify-nowplaying__artist">{currentTrack.artist.name}</span>
                    <div className="spotify-nowplaying__bar">
                      <div className="spotify-nowplaying__progress" style={{width: `${progress}%`}}/>
                    </div>
                  </div>
                  <button
                    className="spotify-nowplaying__btn"
                    onClick={() => {
                      if (isPlaying) { audioRef.current?.pause(); setIsPlaying(false); }
                      else { audioRef.current?.play(); setIsPlaying(true); }
                    }}
                  >
                    {isPlaying ? "▐▐" : "▶"}
                  </button>
                  <a
                    href={currentTrack.link}
                    target="_blank"
                    rel="noreferrer"
                    className="spotify-nowplaying__deezer"
                    title="Open on Deezer"
                  >↗</a>
                </div>
              )}

            </div>
          </div>
        )}
      </>
    );
  };

  export default SpotifyPlayer;
  