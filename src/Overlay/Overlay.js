import './Overlay.css'
import { MouseScroll, KeyScroll } from '../Icons'

export const Overlay = ({ onAction = () => {} }) => {
  return (
    <div className="gallery-overlay">
      <div className="content">
        <p className="heading">How it Works</p>
        <p className="text">
          Use your mouse, touchpad or keyboard arrows to navigate the gallery.
          Find an intriguing yarn and enjoy!
        </p>
        <div className="icons">
          <div className="mouse-scroll-icon">
            <MouseScroll />
            <p>Mouse Scroll</p>
          </div>
          <p>OR</p>
          <div className="key-scroll-icon">
            <KeyScroll />
            <p>Keyboard Arrows</p>
          </div>
        </div>
        <div className="action" onClick={() => onAction()}>
          <div className="button">Let's get Started!</div>
        </div>
      </div>
    </div>
  )
}
