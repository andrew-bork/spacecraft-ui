"use client"
import { ReactNode, useState } from "react";



export function AbsoluteUIComponent({ x, y, width,  aspect, children } : { width?: number,  x?: number, y?:number, aspect?: number, children: ReactNode }) {

    const [ _x, setX ] = useState(x ?? 0);
    const [ _y, setY ] = useState(y ?? 0);
    const [ _width, setWidth ] = useState(width);
    // const [ _height, setHeight ] = useState(height ?? 100);

    let usedHeight = null;
    if(aspect && _width) {
        usedHeight = _width * aspect;
    }

    return <div
        style={{
            position: `absolute`,
            width: (_width ? `${_width}px` : `max-content`),
            height: (usedHeight ? `${usedHeight}px` : `max-content`),
            left: `${_x*100}%`,
            top: `${_y*100}%`,
            background: `#0a0a0a33`
        }}
    >
        {children}
    </div>

}