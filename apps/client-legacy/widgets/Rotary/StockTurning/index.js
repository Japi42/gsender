import React, { useContext, useEffect } from 'react';
import pubsub from 'pubsub-js';

import Modal from 'app/components/ToolModal/ToolModal';
import GcodeViewer from 'app/components/GcodeViewer';
import { SET_CURRENT_VISUALIZER } from 'app/actions/visualizerActions';
import { VISUALIZER_PRIMARY, VISUALIZER_SECONDARY } from 'app/constants';
import store from 'app/store';
import reduxStore from 'app/store/redux';

import { RotaryContext } from '../Context';
import { MODALS } from '../utils/constants';
import {
    CLOSE_ACTIVE_DIALOG,
    SET_STOCK_TURNING_OUTPUT,
    CONVERT_STOCK_TURNING_OPTIONS_TO_IMPERIAL,
    CONVERT_STOCK_TURNING_OPTIONS_TO_METRIC,
    SET_ACTIVE_STOCK_TURNING_TAB,
} from '../Context/actions';
import InputArea from './components/InputArea';

import styles from './index.styl';
import ActionArea from './components/ActionArea';
import TabArea from './components/TabArea';
import Visualizer from './components/Visualizer';
import { StockTurningGenerator } from './Generator';

const StockTurning = () => {
    const { state: { activeDialog, stockTurning, }, dispatch } = useContext(RotaryContext);

    useEffect(() => {
        const units = store.get('workspace.units');

        if (units === 'in') {
            dispatch({ type: CONVERT_STOCK_TURNING_OPTIONS_TO_IMPERIAL });
        }

        return () => {
            const units = store.get('workspace.units');

            if (units === 'in') {
                dispatch({ type: CONVERT_STOCK_TURNING_OPTIONS_TO_METRIC });
            }

            if (units === 'mm') {
                store.replace('widgets.rotary.stockTurning.options', stockTurning.options);
            }

            reduxStore.dispatch({ type: SET_CURRENT_VISUALIZER, payload: VISUALIZER_PRIMARY });

            dispatch({ type: SET_ACTIVE_STOCK_TURNING_TAB, payload: 0 });
        };
    }, []);

    useEffect(() => {
        // Need to re-visualize the gcode once the visualizer is re-mounted
        if (stockTurning.activeTab === 0 && canLoad) {
            runGenerate();
        }
    }, [stockTurning.activeTab]);

    const handleClose = () => {
        dispatch({ type: CLOSE_ACTIVE_DIALOG });
        dispatch({ type: SET_STOCK_TURNING_OUTPUT, payload: null });
    };

    const runGenerate = () => {
        reduxStore.dispatch({ type: SET_CURRENT_VISUALIZER, payload: VISUALIZER_SECONDARY });

        dispatch({ type: SET_ACTIVE_STOCK_TURNING_TAB, payload: 0 });

        const stockTurningGenerator = new StockTurningGenerator(stockTurning.options);

        stockTurningGenerator.generate();

        dispatch({ type: SET_STOCK_TURNING_OUTPUT, payload: stockTurningGenerator.gcode });

        const serializedFile = new File([stockTurningGenerator.gcode], 'rotary_surfacing.gcode');

        const payload = {
            content: stockTurningGenerator.gcode,
            size: serializedFile.size,
            name: serializedFile.name,
            visualizer: VISUALIZER_SECONDARY
        };

        pubsub.publish('visualizer:load', payload);
    };

    const loadGcode = () => {
        const { gcode } = stockTurning;
        const name = 'gSender_StockTurning';
        const { size } = new File([gcode], name);

        pubsub.publish('gcode:surfacing', { gcode, name, size });

        dispatch({ type: CLOSE_ACTIVE_DIALOG });
        dispatch({ type: SET_STOCK_TURNING_OUTPUT, payload: null });
    };

    const { gcode, activeTab } = stockTurning;
    const canLoad = !!gcode;

    const tabs = [
        {
            id: 0,
            label: 'Visualizer Preview',
            widgetId: 'viz-preview',
            component: <Visualizer gcode={gcode} />,
        },
        {
            id: 1,
            label: `G-code Viewer ${gcode ? `(${gcode.split('\n').length} lines)` : ''}`,
            widgetId: 'gcode-viewer',
            component: <GcodeViewer gcode={gcode} />,
            disabled: !gcode,
        },
    ];

    return (
        <Modal
            title="Rotary Surfacing Tool"
            show={activeDialog === MODALS.STOCK_TURNING}
            onClose={handleClose}
            size="lg"
        >
            <div className={styles.wrapper}>
                <InputArea />

                <div style={{ width: '55%' }}>
                    <TabArea
                        tabs={tabs}
                        currentTab={activeTab}
                        onTabChange={(index) => dispatch({ type: SET_ACTIVE_STOCK_TURNING_TAB, payload: index })}
                        mountAllTabs
                    />
                </div>
            </div>

            <ActionArea loadGcode={loadGcode} generateGcode={runGenerate} />
        </Modal>
    );
};

export default StockTurning;
