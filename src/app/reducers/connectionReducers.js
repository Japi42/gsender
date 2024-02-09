/*
 * Copyright (C) 2021 Sienci Labs Inc.
 *
 * This file is part of gSender.
 *
 * gSender is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, under version 3 of the License.
 *
 * gSender is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with gSender.  If not, see <https://www.gnu.org/licenses/>.
 *
 * Contact for information regarding this program and its license
 * can be sent through gSender@sienci.com or mailed to the main office
 * of Sienci Labs Inc. in Waterloo, Ontario, Canada.
 *
 */

import { createReducer } from 'redux-action';
import {
    CLOSE_CONNECTION,
    LIST_PORTS,
    OPEN_CONNECTION,
    SCAN_NETWORK,
} from 'app/actions/connectionActions';

const initialState = {
    isConnected: false,
    isScanning: false,
    port: null,
    baudrate: '',
    ports: [],
    unrecognizedPorts: [],
    networkPorts: [],
    err: '',
};

const reducer = createReducer(initialState, {
    [OPEN_CONNECTION]: (payload, reducerState) => {
        const { options } = payload;
        const { port, baudrate, inuse } = options;
        const isConnected = inuse;
        return {
            port,
            baudrate,
            isConnected,
        };
    },
    [CLOSE_CONNECTION]: (payload, reducerState) => {
        const { options } = payload;
        const { port } = options;
        return {
            port,
            isConnected: false,
        };
    },
    [LIST_PORTS]: (payload, reducerState) => {
        const { recognizedPorts, unrecognizedPorts, networkPorts } = payload;
        return {
            ports: recognizedPorts,
            unrecognizedPorts,
            networkPorts,
        };
    },
    [SCAN_NETWORK]: (payload, reducerState) => {
        const { isScanning } = payload;
        return {
            isScanning: isScanning,
        };
    },
});

export default reducer;
