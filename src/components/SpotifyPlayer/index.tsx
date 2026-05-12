import { useRef, useState } from "react";
  import "./styles.scss";

  const SpotifyPlayer = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [query, setQuery] = useState("");
    const [searchedQuery, setSearchedQuery] = useState("");
    const inputRef = useRef<HTMLInputElement>(null);

    const handleOpen = () => {
      setIsOpen(true);
      setTimeout(() => inputRef.current?.focus(), 150);
    };

    const handleClose = () => setIsOpen(false);

    const handleSearch = (e: React.FormEvent) => {
      e.preventDefault();
      const q = query.trim();
      if (q) setSearchedQuery(q);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Escape") handleClose();
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
          <div className="spotify-overlay" onClick={handleClose}>
            <div className="spotify-panel" onClick={(e) => e.stopPropagation()}>
              <div className="spotify-panel__header">
                <div className="spotify-panel__brand">
                  <svg viewBox="0 0 24 24" fill="#1DB954" width="28" height="28">
                    <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
                  </svg>
                  <div>
                    <h3>Spotify Search</h3>
                    <p>Search any song and play it</p>
                  </div>
                </div>
                <button className="spotify-close" onClick={handleClose} title="Close">✕</button>
              </div>

              <form className="spotify-search-bar" onSubmit={handleSearch}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="Search songs, artists, albums..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="spotify-search-input"
                />
                {query && (
                  <button
                    type="button"
                    className="spotify-clear"
                    onClick={() => { setQuery(""); setSearchedQuery(""); inputRef.current?.focus(); }}
                  >✕</button>
                )}
                <button type="submit" className="spotify-search-btn">
                  Search
                </button>
              </form>

              <div className="spotify-embed-area">
                {searchedQuery ? (
                  <iframe
                    key={searchedQuery}
                    title={`Spotify search: ${searchedQuery}`}
                    src={`https://open.spotify.com/embed/search/${encodeURIComponent(searchedQuery)}`}
                    width="100%"
                    height="420"
                    frameBorder="0"
                    allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                    loading="lazy"
                  />
                ) : (
                  <div className="spotify-empty-state">
                    <svg viewBox="0 0 24 24" fill="#1DB954" width="48" height="48" style={{ opacity: 0.35 }}>
                      <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
                    </svg>
                    <p>Type a song, artist, or album name above and press <strong>Search</strong></p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </>
    );
  };

  export default SpotifyPlayer;
  