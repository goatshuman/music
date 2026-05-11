import { useState } from "react";
import "./styles.scss";
import ModifierBoard from "../../components/ModifierBoard";
import RainToggleButton from "../../components/RainToggleButton";
import Footer from "../../layout/Footer";
import { useTimer } from "react-timer-hook";
import { RootState, useAppSelector } from "../../store/store";
import { VideoSource } from "../../types/interface";

const VIDEO_BASE = "https://raw.githubusercontent.com/menoc61/lofi-music-website/master/public/assets/video";

const Home = () => {
  const [timerStart, setTimerStart] = useState(false);

  const daynight = useAppSelector((state: RootState) => state.mode);
  const rain = useAppSelector((state: RootState) => state.rain);

  const { mode } = daynight;
  const { rainMode } = rain;

  const combineMode = `${mode}-${rainMode}`;

  const expiryTimestamp = new Date();
  expiryTimestamp.setSeconds(expiryTimestamp.getSeconds() + 0);

  const { seconds, minutes, hours, isRunning, pause, resume, restart } =
    useTimer({
      expiryTimestamp,
      onExpire: () => setTimerStart(false),
    });

  const setTimerHandler = (hour: number, minute: number, second: number) => {
    const time = new Date();
    const setupTimer =
      Number(hour) * 3600 + Number(second) + Number(minute) * 60;
    time.setSeconds(time.getSeconds() + setupTimer);
    restart(time);
  };

  const videoSources: VideoSource = {
    "night-clear": `${VIDEO_BASE}/Night-clear.mp4`,
    "night-rain": `${VIDEO_BASE}/Night-rainny.mp4`,
    "day-clear": `${VIDEO_BASE}/Day-sunny.mp4`,
    "day-rain": `${VIDEO_BASE}/Day-rainny.mp4`,
  };

  return (
    <>
      {Object.keys(videoSources).map((key) => (
        <video
          key={key}
          className={combineMode === key ? "videoIn" : "videoOut"}
          autoPlay
          loop
          muted
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        >
          <source src={videoSources[key]} type="video/mp4" />
        </video>
      ))}
      <RainToggleButton />
      <ModifierBoard
        seconds={seconds}
        minutes={minutes}
        hours={hours}
        isRunning={isRunning}
        pause={pause}
        resume={resume}
        restart={restart}
        setTimerHandler={setTimerHandler}
        setTimerStart={setTimerStart}
        timerStart={timerStart}
      />
      <Footer />
    </>
  );
};

export default Home;
