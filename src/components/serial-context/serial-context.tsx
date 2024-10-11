import { createContext, Dispatch, ReactNode, SetStateAction, useContext, useEffect, useRef, useState } from "react";
import { useAddRocketData } from "../rocket-data-context/rocket-data-context";


export interface LogEntry {
    msg: string
}

export const SerialContext = createContext/* <GamepadContextData> */({

    baudrate: 115200, 
    setBaudrate: ((()=>{}) as Dispatch<SetStateAction<number>>),

    reset() {},

    connected: false,
    // connecting: false,
    connect() {},
    disconnect() {},

    clear() {},
    frames: [] as Uint8Array[],
    logs: [] as LogEntry[],
});

export function useSerial() {
    return useContext(SerialContext);
}



class FrameParser {
    START_OF_FRAME=0x01;
    END_OF_FRAME=0x04;
    ESCAPE=0x27;
    state: 0|1|2;
    buffer: number[];
    maxFrameSize: number;
    constructor() {
        this.START_OF_FRAME=0x01; // Start of header
        this.END_OF_FRAME=0x04; // End of transmission
        this.ESCAPE=0x27;
        
        this.state = 0;
        this.buffer = [];
        this.maxFrameSize = 64;
    }

    parseByte(byte:number) {
        switch(this.state) {
            case 0:
                // console.log(byte, "WAIT_START_OF_FRAME");

                if(byte == this.START_OF_FRAME) {
                    this.state = 1;
                    // i = 0;
                    this.buffer = []
                }
                return false;
            case 1:
                // console.log(byte, "PARSING_MESSAGE");
                if(byte == this.ESCAPE) {
                    this.state = 2;
                    return false;
                }else if(byte == this.END_OF_FRAME) {
                    this.state = 0;
                    return true;
                }
                if(this.buffer.length >= this.maxFrameSize) {
                    this.state = 0;
                    return false;
                }
                this.buffer.push(byte);
                return false;
            case 2:
                // console.log(byte, "AFTER_ESCAPE");
                this.state = 1;
                if(this.buffer.length >= this.maxFrameSize) {
                    this.state = 0;
                    return false;
                }
                this.buffer.push(byte);
                return false;
            };
            return false;
    }

    getFrame() {
        return new Uint8Array(this.buffer);
    }
}


export function SerialContextProvider({ children } : { children : ReactNode }) {

    // const [ data, setData ] = useState(generateTestData() as unknown as RocketData[]);
    // const [ current, setCurrent ] = useState(data.length-1);
    const [ baudrate, setBaudrate ] = useState(115200);
    const [ connected, setConnected ] = useState(false);

    const [ frames, setFrames ] = useState([] as Uint8Array[]);
    const [ logs, setLogs ] = useState([] as LogEntry[]);

    const port = useRef<any>(null!);
    const reader = useRef<any>(null!);

    const addRocketData = useAddRocketData();

    const addRocketDataRef = useRef(addRocketData);
    addRocketDataRef.current = addRocketData;

    useEffect(() => {
        if(connected) {
            let loop = true;
            // while(run) {
            //     console.log(10);
            // }

            (async () => {
                // let remain = "";
                const parser = new FrameParser();
                while (loop) {
                    const { value } = await reader.current.read();
                    // let decoded = await new TextDecoder().decode(value);
                    // console.log(value);

                    // console.log(value)
                    for(let i = 0; i < value.length; i ++) {
                        // console.log(parser)
                        if(parser.parseByte(value[i])) {
                            let frame = parser.getFrame();
                            console.log(frame);
                            setFrames((old) => old.concat([frame]).slice(Math.max(old.length - 5, 0)));
                            let view = new DataView(frame.buffer);
                            // console.log(frame);
                            const getVector = (i:number) => {
                                return {
                                    x: view.getFloat32(i, true),
                                    y: view.getFloat32(i+4, true),
                                    z: view.getFloat32(i+8, true),
                                }
                            }
                            const getQuart = (i:number) => {
                                return {
                                    x: view.getFloat32(i, true),
                                    y: view.getFloat32(i+4, true),
                                    z: view.getFloat32(i+8, true),
                                    w: view.getFloat32(i+12, true),
                                }
                            }
                            const NaNVector = {
                                x: NaN,
                                y: NaN,
                                z: NaN,
                            }
                            const identQuart = {
                                x: 0,
                                y: 0,
                                z: 0,
                                w: 1,
                            }
                            // console.log(view.getFloat32(0, true), view.getFloat32(4, true), view.getFloat32(8, true), view.getFloat32(12, true));
                            // console.log(frame);
                            addRocketDataRef.current({
                                position: identQuart,
                                velocity: NaNVector,
                                acceleration: NaNVector,
                                // utc: view.getFloat32(0, true),
                                time: 0,
                                orientation: getQuart(0),
                                localAngularRates: getVector(16),
                                verticalSpeed: NaN,
                            });
                        }
                    }
                }
            }) ();

            return () => {
                loop = false;
            }
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [connected]);

    const connect = async () => {
        try {
            console.log("Connecting to serial...");
            port.current = await (navigator as any).serial.requestPort();
            await port.current.open({ baudRate: baudrate });
            await port.current.setSignals({ dataTerminalReady: false, requestToSend: false });
            reader.current = port.current.readable.getReader();
            // writer.current = port.current.writable.getWriter();
            setConnected(true);
            console.log("Connect success");
            // return readWriteFromSerial();
        } catch (error) {
            console.error(error);
            setConnected(false);
        }
    }

    const disconnect = async () => {
        try {
            if (reader.current) {
                reader.current.cancel();
                // writer.current.abort();
                reader.current.releaseLock();
                // writer.current.releaseLock();
                port.current.close();
                port.current = undefined;
                reader.current = undefined;
                // writer.current = undefined;
                setConnected(false);
                // setIsDtrModeEnabled(false);
            }
        }
        catch (error) {
            console.error(error);
            setConnected(false);
        }
    }
    const reset = async () => {

    };

    const clear = () => {
        setFrames([]);
        setLogs([]);
    };
    
    
    return <SerialContext.Provider value={{
        baudrate, setBaudrate,
        connect, disconnect,
        connected,
        reset,
        clear,
        frames,
        logs
    }}>
        {children}
    </SerialContext.Provider>

}