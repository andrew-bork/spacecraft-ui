import { AbsoluteUIComponent } from "../absolute-ui-component/AbsoluteUIComponent";
import { useCurrentIndex } from "../rocket-data-context/rocket-data-context";


export function TimelineSelector() {

    const [ current, setCurrent ] = useCurrentIndex();

    return <AbsoluteUIComponent x={0.01} y={0.01}>
        <input type="range" value={current} onChange={(e) => {
            setCurrent(Math.min(Math.max(Math.floor(parseInt(e.target.value)), 0), 99));
        }}/>        
    </AbsoluteUIComponent>
}