import React from "react"
import ReactDOM from "react-dom"

export default function Modal({ children, visible, toggle, disableClickOff }) {

    return (visible ? ReactDOM.createPortal(
        <>
            <div className="modal__box" role="dialog" aria-modal="true">
                {children}
            </div>  
            <div className="modal__overlay" onClick={() => {if (!disableClickOff) {toggle()}}}></div>    
        </>, document.body
    ) : null)
}
/* used with style classes such as 
    .modal__box {
        position: fixed;
        top: 50%;
        left: 50%;
        translate: -50% -50%;
        z-index: 1001;
        background-color: gray;
        border: 2px solid black;
    }
    .modal__overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-color: #00000098;
        z-index: 1000;
    }
*/

/////////////////////// USAGE ///////////////////////////////////////
// uses useToggle custom hook

    function App() {
    // create toggle
        const [visible, toggleVisible] = useToggle(false)

        return(
            <>
                {/* use toggle function to open/close modal */}
                <button onClick={toggle}>Show Modal</button>
                
                {/* wrap modal content in modal component and pass in the toggle values */}
                <Modal visible={visible} toggle={toggle}>
                    <h3>Hello World</h3>
                    <p>Eam.</p>
                    <button type="button" onClick={toggle}>Close</button>
                </Modal>
            </>
        )

    }