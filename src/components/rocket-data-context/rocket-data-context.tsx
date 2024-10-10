"use client"

import { createContext, Dispatch, ReactNode, SetStateAction, useContext, useState } from "react";
import { Quaternion, Vector3 } from "three";
import { velocity } from "three/webgpu";

export interface Vec3 {
    x: number, y: number, z: number
};

export interface Quart {
    w: number, x: number, y: number, z: number
}

export interface RocketData {
    position: Vec3;
    velocity: Vec3;
    acceleration: Vec3;
    orientation: Quart;

    localAngularRates: Vec3;

    verticalSpeed: number;
    // worldAngularRates: Vec3;

    utc: number;
};



const RocketDataContext = createContext({
    data: [] as RocketData[],
    setData: (() => {}) as Dispatch<SetStateAction<RocketData[]>>,
    clearData: () => {},

    current: 0,
    setCurrent: (() => {}) as Dispatch<SetStateAction<number>>
});




function parametricFunction(t:number) {
    return { 
        x: 0.1 * Math.cos(10*t), 
        y: t, 
        z: 0.1 * Math.sin(10*t) 
    };
}
function parametricFunctionV(t:number) {
    return { 
        x: -Math.sin(10*t), 
        y: 1, 
        z: Math.cos(10*t) 
    };
}

function parametricFunctionA(t:number) {
    return { 
        x: -10 * Math.cos(10*t), 
        y: 0, 
        z: -10 * Math.sin(10*t) 
    };
}

// function velocity


function generateTestData() {
    const out = [];
    const fwd = new Vector3(1, 0, 0);
    for(let i = 0; i <= 1.0; i +=0.001) {
        const orientation = new Quaternion();
        const p = parametricFunction(i);
        const a = parametricFunctionA(i);
        const v = parametricFunctionV(i);
        
        p.x *= 1000;
        p.y *= 1000;
        p.z *= 1000;

        a.x /= 1000;
        a.y /= 1000;
        a.z /= 1000;
        const b = new Vector3(-a.x, -a.y, -a.z).clone().normalize();
        orientation.setFromUnitVectors(fwd, b);
        out.push({
            position: p,
            velocity: v,
            acceleration: a,
            orientation,
            
            localAngularRates: { x: NaN, y: NaN, z: NaN },

            verticalSpeed: v.y,

            utc: i * 100
        });
    }
    return out;
}



export function useRocketData() {
    const { data } = useContext(RocketDataContext);
    return data;
}

export function useAddRocketData() {
    const { setData, current, data, setCurrent } = useContext(RocketDataContext);
    return (newData: RocketData) => {
        setData((old) => old.concat([newData]));
        if(current >= data.length-1) setCurrent((i) => i+1);
    };
}

export function useCurrentData() {
    const { data, current } = useContext(RocketDataContext);
    if(current < 0 || data.length <= current) return null;
    return data[current];
}

export function useCurrentIndex() : [ number, Dispatch<SetStateAction<number>> ]{
    const { current, setCurrent } = useContext(RocketDataContext);
    return [ current, setCurrent ];
}

export function useRocketDataClear() {
    const { clearData } = useContext(RocketDataContext);
    return clearData;
}

export function RocketDataContextProvider({ children } : { children : ReactNode }) {

    const [ data, setData ] = useState(generateTestData() as unknown as RocketData[]);
    // const [ data, setData ] = useState([] as RocketData[]);
    const [ current, setCurrent ] = useState(data.length-1);

    const clearData = () => {
        setData([]);
        setCurrent(-1);
    }

    return <RocketDataContext.Provider value={{
        data,
        setData,
        current,
        setCurrent,
        clearData,
    }}>
        {children}
    </RocketDataContext.Provider>

}