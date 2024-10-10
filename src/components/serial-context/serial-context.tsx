import { createContext, Dispatch, ReactNode, SetStateAction, useContext, useEffect, useRef, useState } from "react";
import { useAddRocketData } from "../rocket-data-context/rocket-data-context";


export const SerialContext = createContext/* <GamepadContextData> */({

    baudrate: 38400, 
    setBaudrate: ((()=>{}) as Dispatch<SetStateAction<number>>),

    reset() {},

    connected: false,
    // connecting: false,
    connect() {},
    disconnect() {},

    clear() {},
    rawSerial: [] as Uint8Array[],
});

export function useSerial() {
    return useContext(SerialContext);
}



class FrameParser {
    START_OF_FRAME=0x01;
    END_OF_FRAME=0x04;
    ESCAPE=0x27;
    state: "WAIT_START_OF_FRAME"|"PARSING_MESSAGE"|"AFTER_ESCAPE";
    buffer: number[];
    maxFrameSize: number;
    constructor() {
        this.START_OF_FRAME=0x01; // Start of header
        this.END_OF_FRAME=0x04; // End of transmission
        this.ESCAPE=0x27;
        
        this.state = "WAIT_START_OF_FRAME";
        this.buffer = [];
        this.maxFrameSize = 32;
    }

    parseByte(byte:number) {
        switch(this.state) {
            case "WAIT_START_OF_FRAME":
                if(byte == this.START_OF_FRAME) {
                    this.state = "PARSING_MESSAGE";
                    // i = 0;
                    this.buffer = []
                }
                return false;
            case "PARSING_MESSAGE":
                if(byte == this.ESCAPE) {
                    this.state = "AFTER_ESCAPE";
                    return false;
                }else if(byte == this.END_OF_FRAME) {
                    this.state = "WAIT_START_OF_FRAME";
                    return true;
                }
                if(this.buffer.length == this.maxFrameSize) {
                    this.state = "WAIT_START_OF_FRAME";
                    return false;
                }
                this.buffer.push(byte);
                return false;
            case "AFTER_ESCAPE":
                this.state = "PARSING_MESSAGE";
                if(this.buffer.length == this.maxFrameSize) {
                    this.state = "WAIT_START_OF_FRAME";
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
    const [ baudrate, setBaudrate ] = useState(115600);
    const [ connected, setConnected ] = useState(false);

    const [ rawSerial, setRawSerial ] = useState([] as Uint8Array[]);

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

                    for(let i = 0; i < value.length; i ++) {
                        if(parser.parseByte(value[i])) {
                            let frame = parser.getFrame();
                            setRawSerial((old) => old.concat([frame]).slice(Math.max(old.length - 5, 0)));
                            let view = new DataView(frame.buffer);
                            const getVector = (i:number) => {
                                return {
                                    x: view.getFloat32(i, true),
                                    y: view.getFloat32(i+4, true),
                                    z: view.getFloat32(i+8, true),
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
                                position: getVector(4),
                                velocity: NaNVector,
                                acceleration: NaNVector,
                                utc: view.getFloat32(0, true),
                                orientation: identQuart,
                                localAngularRates: NaNVector,
                                verticalSpeed: NaN,
                            })
                        }
                    }

                    // decoded = await decoded;
                    // remain += decoded;
                    // let commands = remain.split("\n");

                    // if(commands.length >= 2) {
                    //     try{
                    //         const command = JSON.parse(commands[commands.length - 2]);
                            
                    //         const [ rotunda, shoulder, elbow, wristPitch, wristRoll, effectorPosition ] = command.angles;
                    //         if(currentInputSourceRef.current === "mimic" && currentInputSystemRef.current === "directAngles") {
                    //             setAngles({
                    //                 rotunda: rotunda * DEG_TO_RAD,
                    //                 shoulder: shoulder * DEG_TO_RAD,
                    //                 elbow: elbow * DEG_TO_RAD,
                    //                 wristPitch: wristPitch * DEG_TO_RAD,
                    //                 wristRoll: wristRoll * DEG_TO_RAD,
                    //                 effectorPosition: effectorPosition * DEG_TO_RAD,
                    //             });
                    //         }
                    //         setMimicAngles({
                    //             rotunda: rotunda,
                    //             shoulder: shoulder,
                    //             elbow: elbow,
                    //             wristPitch: wristPitch,
                    //             wristRoll: wristRoll,
                    //             effectorPosition: effectorPosition,
                    //         });
                    //     }catch(e) {
                    //         console.log("Recieved Malformed command", commands[commands.length - 2]);
                    //     }

                    //     remain = commands[commands.length - 1];

                    // }

                    


                    // setRawSerial((rawSerial) => rawSerial + decoded);

                    // setRawSerial((rawSerial) => {
                    //     let newRawSerial = rawSerial + decoded;
                    //     if(newRawSerial.length > 1000) {
                    //         newRawSerial = newRawSerial.substring(newRawSerial.length - 1000);    
                    //     }
                    //     return newRawSerial;
                    // });
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
        setRawSerial([]);
    };
    
    
    return <SerialContext.Provider value={{
        baudrate, setBaudrate,
        connect, disconnect,
        connected,
        reset,
        clear,
        rawSerial
    }}>
        {children}
    </SerialContext.Provider>

}