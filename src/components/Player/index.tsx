import { useState, useRef, useEffect } from "react";
import "./styles.scss";
import { RootState, useAppSelector } from "../../store/store";

export interface IPlayerProps {
  currentSongIndex: number;
  setCurrentSongIndex: any;
  songs: any;
}

const Player = ({ currentSongIndex, setCurrentSongIndex, songs }: IPlayerProps) => {
  const data = useAppSelector((state: RootState) => state.volume);
  const { volumeValue } = data;

  const audioElement = useRef<HTMLAudioElement>(null!);
  const [isPlaying, setIsPlaying] = useState(false);
  const isPlayingRef = useRef(false);

  // Keep ref in sync so event listeners always have latest value
  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  // Handle play/pause user toggle
  useEffect(() => {
    if (!audioElement.current) return;
    const audio = audioElement.current;
    if (isPlaying) {
      audio.play().catch(() => {});
    } else {
      audio.pause();
    }
  }, [isPlaying]);

  // Handle song change — wait for canplay before attempting playback
  useEffect(() => {
    if (!audioElement.current) return;
    const audio = audioElement.current;

    audio.pause();
    audio.src = songs[currentSongIndex].src;
    audio.load();

    const onCanPlay = () => {
      if (isPlayingRef.current) {
        audio.play().catch(() => {});
      }
    };

    audio.addEventListener("canplay", onCanPlay, { once: true });
    return () => {
      audio.removeEventListener("canplay", onCanPlay);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentSongIndex]);

  // Handle volume change
  useEffect(() => {
    if (!audioElement.current) return;
    audioElement.current.volume = volumeValue / 100;
  }, [volumeValue]);

  const SkipSong = (forwards = true) => {
    setCurrentSongIndex((prev: number) => {
      if (forwards) {
        return prev >= songs.length - 1 ? 0 : prev + 1;
      } else {
        return prev <= 0 ? songs.length - 1 : prev - 1;
      }
    });
  };

  return (
    <div className="music-player">
      <audio loop ref={audioElement} src={songs[currentSongIndex].src}></audio>
      <div className="music-player--controls">
        <button className="skip-btn" onClick={() => SkipSong(false)}>
          <img src={`${import.meta.env.BASE_URL}assets/icons/prev.svg`} alt="prev" />
        </button>
        <button className="play-btn" onClick={() => setIsPlaying((p) => !p)}>
          {isPlaying ? (
            <img src={`${import.meta.env.BASE_URL}assets/icons/pause.svg`} alt="pause" />
          ) : (
            <img src={`${import.meta.env.BASE_URL}assets/icons/play.svg`} alt="play" />
          )}
        </button>
        <button className="skip-btn" onClick={() => SkipSong()}>
          <img src={`${import.meta.env.BASE_URL}assets/icons/next.svg`} alt="next" />
        </button>
      </div>
    </div>
  );
};

export default Player;
