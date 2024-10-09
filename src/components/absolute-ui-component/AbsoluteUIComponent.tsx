"use client"
import { ReactNode, useState } from "react";



export function AbsoluteUIComponent({ x, y, width, height, aspect, children } : { width?: number, height?:number, x?: number, y?:number, aspect?: number, children: ReactNode }) {

    const [ _x, setX ] = useState(x ?? 0);
    const [ _y, setY ] = useState(y ?? 0);
    const [ _width, setWidth ] = useState(width ?? 100);
    const [ _height, setHeight ] = useState(height ?? 100);

    let usedHeight = _height;
    if(aspect) {
        usedHeight = _width * aspect;
    }

    return <div
        style={{
            position: `absolute`,
            width: `${_width}px`,
            height: `${usedHeight}px`,
            left: `${_x*100}%`,
            top: `${_y*100}%`,
            background: `#0a0a0a33`
        }}
    >
        {children}
    </div>

}