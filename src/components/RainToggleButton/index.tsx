import { useState } from "react";
import { changeRainStatus } from "../../store/slice/rainSlice";
import ReactAudioPlayer from "react-audio-player";
import "./styles.scss";
import { RootState, useAppDispatch, useAppSelector } from "../../store/store";

const MUSIC_BASE = "https://raw.githubusercontent.com/menoc61/lofi-music-website/master/public/assets/musics";

const RainToggleButton = () => {
  const dispatch = useAppDispatch();
  const rain = useAppSelector((state: RootState) => state.rain);
  const { rainMode, rainValue } = rain;
  const [buttonClick, setButtonClick] = useState(false);

  const rainButtonHandler = () => {
    if (rainValue === 0)
      dispatch(changeRainStatus({ currentStatus: rainMode, value: 30 }));
    else dispatch(changeRainStatus({ currentStatus: rainMode, value: 0 }));
    setButtonClick(!buttonClick);
  };

  const isActive = rainValue > 0;

  return (
    <div className="wrapper">
      {buttonClick && isActive && (
        <ReactAudioPlayer
          preload="auto"
          autoPlay
          src={`${MUSIC_BASE}/rain_city.mp3`}
          loop
          volume={rainValue / 100}
        />
      )}
      <span className="rain-label">Rain</span>
      <div className={`button ${isActive ? "active" : ""}`} onClick={rainButtonHandler}>
        <div className="icon">
          <i className="fas fa-cloud-rain"></i>
          <span className="icon-label">{isActive ? "ON" : "OFF"}</span>
        </div>
      </div>
    </div>
  );
};

export default RainToggleButton;
