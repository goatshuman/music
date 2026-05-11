import { useState, useEffect } from "react";
import { Modal, Button } from "react-bootstrap";

const FirstTimeModal = () => {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const visitedBefore = localStorage.getItem("visitedBefore");
    if (!visitedBefore) {
      setShow(true);
      localStorage.setItem("visitedBefore", "true");
    }
  }, []);

  return (
    <Modal show={show} onHide={() => setShow(false)} centered>
      <Modal.Body>
        <h3>Attention</h3>
        <p>
          It would be better to try this on a desktop for a better immersive
          experience.
        </p>
        <p>Please consider starring the project on GitHub!</p>
        <Button variant="primary" onClick={() => setShow(false)}>
          Proceed
        </Button>
      </Modal.Body>
    </Modal>
  );
};

export default FirstTimeModal;
