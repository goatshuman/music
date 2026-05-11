import { useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { changeDayNight } from "../../store/slice/modeSlice";
import "./styles.scss";
import DarkLightSwitch from "../../components/DarkLightSwitch";
import { CONSTANTS } from "../../constants/constants";
import { RootState } from "../../store/store";

const Header = () => {
  const [fullscreen, setFullscreen] = useState<boolean>(false);
  const daynight = useSelector((state: RootState) => state.mode);
  const dispatch = useDispatch();
  const { mode } = daynight;

  const daynightHandler = () => {
    dispatch(changeDayNight());
  };

  const fullscreenHandler = () => {
    if (!fullscreen) {
      document.documentElement.requestFullscreen().catch(() => {});
      setFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setFullscreen(false);
    }
  };

  return (
    <nav className="wrap">
      <div className="nav-menu nav-left">
        <a target="_blank" rel="noreferrer" href={CONSTANTS.AUTHOR_GITHUB_LINK}>
          <i className="fab fa-github"></i>
          <span>GitHub</span>
        </a>
        <a target="_blank" rel="noreferrer" href={CONSTANTS.AUTHOR_PORTFOLIO_LINK}>
          <i className="fas fa-globe"></i>
          <span>Portfolio</span>
        </a>
      </div>

      <div className="nav-menu nav-right">
        <div onClick={daynightHandler} className="switch-wrap">
          <DarkLightSwitch theme={mode} />
        </div>
        <button
          onClick={fullscreenHandler}
          className="fullscreen-btn"
          title={fullscreen ? "Exit fullscreen" : "Enter fullscreen"}
        >
          <i className={`fas ${fullscreen ? "fa-compress" : "fa-expand"} fa-lg`}></i>
        </button>
      </div>
    </nav>
  );
};

export default Header;
