import { AbsoluteUIComponent } from "../absolute-ui-component/AbsoluteUIComponent";
import { useCurrentData } from "../rocket-data-context/rocket-data-context";
import styles from "./attitude-indicator.module.css";





export function AltitudeIndicator() {
    const current = useCurrentData();
    return <AbsoluteUIComponent x={0.5} y={0} width={240} aspect={1/4}>
        <div className={styles.main}>
            <div className={styles.altitude}>
                {(1000 * (current?.position.y ?? 0)).toFixed(1)} m
            </div>
        </div>
        <div className={styles["vertical-speed"]}>
        {/* <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
            <ar
        </svg> */}
        </div>
    </AbsoluteUIComponent>

}
