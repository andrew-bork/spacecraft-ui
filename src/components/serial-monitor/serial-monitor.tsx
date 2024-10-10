"use client"
import { useMemo, useState } from "react";
import { AbsoluteUIComponent } from "../absolute-ui-component/AbsoluteUIComponent";
import styles from "./serial-monitor.module.css"
import { useSerial } from "../serial-context/serial-context";


const testTerminalData = `
[]
 GET / 200 in 221ms
 ✓ Compiled /favicon.ico in 299ms (916 modules)
 GET /favicon.ico 200 in 396ms


Andrew@mathbox /cygdrive/c/Users/Andrew/Documents/VSCode/spacecraft-ui
$ npm run dev

> spacecraft-ui@0.1.0 dev
> next dev

  ▲ Next.js 14.2.15
  - Local:        http://localhost:3000

 ✓ Starting...
 ✓ Ready in 3.4s
`;

function TerminalLine({ text } : { text: string }) {
    return <>
        {text}
        <br/>
    </>
}

function leftpad(s: string, n: number, c: string) {
    while(s.length < n) {
        s = c + s;
    }
    return s;
}

function FrameLine({ frame } : { frame: Uint8Array }) {
    return <>
        {Array.from(frame).map(
            (byte, i) => 
                <span className={styles.byte} key={i}>0x{leftpad(byte.toString(16), 2, "0")}</span>
        )}
        <br/>
    </>
}

export function SerialMonitor() {
    
    
    // const [ baudrate, setBaudrate ] = useState(115600);
    const serial = useSerial();
    
    // const lines = useMemo(() => {
    //    return serial.rawSerial.split("\n"); 
    // }, [serial.rawSerial]);
    return <AbsoluteUIComponent x={0.7} y={0.6}>
        <div className={styles.main}>
            <div className={styles["control-panel"]}>
                <button
                    onClick={() => {
                        serial.clear();
                    }}
                >Clear</button>
                <input className={styles["baud-rate"]} placeholder="115600"
                    value={isNaN(serial.baudrate) ? "" : serial.baudrate}
                    onChange={(e) => {
                        
                        serial.setBaudrate(parseInt(e.target.value.substring(0, 7)));
                    }}
                />
                <button
                    onClick={() => {
                        if(serial.connected) serial.disconnect();
                        else serial.connect();
                    }}
                >{serial.connected ? `Disconnect` : `Connect`}</button>
            </div>
            <div className={styles.output}>
                {serial.rawSerial.map((frame, i) => <FrameLine key={serial.rawSerial.length - i} frame={frame}/>)}
                {/* {lines.map((line, i) => <TerminalLine text={line} key={i}/>)} */}
            </div>
            {/* $  */}
            <input className={styles["serial-input"]}/>
        </div>

    </AbsoluteUIComponent>
}