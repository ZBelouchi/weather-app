import React from "react"
import ReactDOM from "react-dom"

export default function Modal({ children, visible, toggle, disableClickOff }) {

    return (visible &&
        ReactDOM.createPortal(
            <>
                <div className="modal__box" role="dialog" aria-modal="true">
                    {children}
                </div>  
                <div className="modal__overlay" onClick={() => {if (!disableClickOff) {toggle()}}}></div>    
            </>, 
            document.body
    ))
}