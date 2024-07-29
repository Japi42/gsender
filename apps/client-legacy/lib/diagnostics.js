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

import React from 'react';
import isEmpty from 'lodash/isEmpty';
import get from 'lodash/get';
import partition from 'lodash/partition';
import uniqueId from 'lodash/uniqueId';
import { pdf, Page, View, Text, Document, StyleSheet } from '@react-pdf/renderer';
import { saveAs } from 'file-saver';
import store from 'app/store';
import reduxStore from 'app/store/redux';
import ToolModalButton from 'app/components/ToolModalButton/ToolModalButton';
import pkg from '../../package.json';
import { GRBLHAL, LASER_MODE, METRIC_UNITS, WORKSPACE_MODE } from '../constants';
import api from 'app/api';
import { homingString } from './eeprom';

const styles = StyleSheet.create({
    body: {
        paddingTop: 35,
        paddingBottom: 65,
        paddingHorizontal: 35,
    },
    title: {
        fontSize: 24,
        textAlign: 'center',
        fontFamily: 'Helvetica-Bold'
    },
    author: {
        fontSize: 12,
        textAlign: 'center',
        marginBottom: 40,
        fontFamily: 'Helvetica'
    },
    container: {
        margin: 18,
        marginTop: 0,
        fontSize: 12,
    },
    subtitle: {
        fontSize: 18,
        margin: 12,
        textDecoration: 'underline',
        fontFamily: 'Helvetica-Bold'
    },
    lineWrapper: {
        marginTop: 6,
        marginBottom: 6
    },
    textBold: {
        fontSize: 12,
        textAlign: 'justify',
        fontFamily: 'Helvetica-Bold',
    },
    text: {
        fontSize: 12,
        textAlign: 'justify',
        fontFamily: 'Helvetica'
    },
    textItalic: {
        fontSize: 12,
        textAlign: 'justify',
        fontFamily: 'Helvetica-Oblique'
    },
    image: {
        marginVertical: 15,
        marginHorizontal: 100,
    },
    header: {
        fontSize: 12,
        marginBottom: 20,
        textAlign: 'center',
        color: 'grey',
    },
    pageNumber: {
        position: 'absolute',
        fontSize: 12,
        bottom: 30,
        left: 0,
        right: 0,
        textAlign: 'center',
        color: 'grey',
    },

    // table styles from https://github.com/diegomura/react-pdf/issues/487#issuecomment-465513123
    table: {
        display: 'table',
        width: '280px',
        margin: 12,
        marginTop: 6,
        borderStyle: 'solid',
        borderLeftWidth: 1,
        borderTopWidth: 1,
    },
    tableRow: {
        // margin: 'auto',
        flexDirection: 'row'
    },
    tableCol: {
        width: '50%',
        borderStyle: 'solid',
        borderWidth: 1,
        borderLeftWidth: 0,
        borderTopWidth: 0
    },
    tableCell: {
        margin: 'auto',
        marginTop: 5,
        fontSize: 10
    },

    clearTable: {
        display: 'table',
        width: '100%',
        margin: 12,
    },
    clearTableRow: {
        marginBottom: 12,
        flexDirection: 'row'
    },
    clearTableCol: {
        width: '50%',
    },
    clearTableCell: {
        marginRight: 'auto',
        marginTop: 12,
        fontSize: 10
    }
});

const getEEPROMValues = () => {
    const eeprom = get(reduxStore.getState(), 'controller.settings.settings', {});
    return eeprom;
};

const getMachineProfile = () => {
    const machineProfile = store.get('workspace.machineProfile');
    return machineProfile;
};

const getGSenderVersion = () => {
    const version = `${pkg.version}`;
    return version;
};

const getGRBLInformation = () => {
    const grblInfo = get(reduxStore.getState(), 'controller', {});
    return grblInfo;
};

const getOS = () => {
    // let os = "unknown";
    const navApp = navigator.userAgent;
    const os = navApp.substring(navApp.indexOf('(') + 1, navApp.indexOf(')'));

    return os;
};

const getGCodeFile = () => {
    const gcode = get(reduxStore.getState(), 'file.content', '');
    return gcode;
};

const getMode = () => {
    const mode = store.get('widgets.spindle.mode');
    return mode === LASER_MODE;
};

const getConnection = () => {
    const connection = get(reduxStore.getState(), 'connection', '');
    return connection;
};

const getFileInfo = () => {
    const fileInfo = get(reduxStore.getState(), 'file', '');
    return fileInfo;
};

const getJogPresets = () => {
    const jogPresets = store.get('widgets.axes.jog', {});
    return jogPresets;
};

const getWorkspaceUnits = () => {
    const workspaceUnits = store.get('workspace.units', METRIC_UNITS);
    return workspaceUnits;
};

const getRotaryMode = () => {
    const { DEFAULT, ROTARY } = WORKSPACE_MODE;
    const isRotaryMode = store.get('workspace.mode', DEFAULT) === ROTARY;
    return isRotaryMode;
};

const unwrapObject = (obj, iteration) => {
    let tabs = '';
    for (let i = 0; i < iteration; i++) {
        tabs += '    '; // non break spaces to indent
    }
    if (isEmpty(obj)) {
        return tabs + 'NULL\n';
    }
    // .join('') is used to solve an issue where unwanted commas appeared: https://stackoverflow.com/a/45812277
    return (
        Object.keys(obj).map((key, i) => (
            typeof obj[key] === 'object'
                ? tabs + key + ': \n' + unwrapObject(obj[key], iteration + 1)
                : tabs + key + ': ' + obj[key] + '\n'
        )).join('')
    );
};

const createTableRows = (array) => {
    return (
        Object.keys(array).map((key, i) => (
            // from https://github.com/diegomura/react-pdf/issues/487#issuecomment-465513123
            <View style={styles.tableRow} key={uniqueId()}>
                <View style={styles.tableCol}>
                    <Text style={styles.tableCell}>
                        {key}
                    </Text>
                </View>
                <View style={styles.tableCol}>
                    <Text style={styles.tableCell}>
                        {array[key]}
                    </Text>
                </View>
            </View>
        ))
    );
};

function generateSupportFile() {
    const eeprom = getEEPROMValues();
    const machineProfile = getMachineProfile();
    const version = getGSenderVersion();
    const grblInfo = getGRBLInformation();
    const os = getOS();
    const history = grblInfo.terminalHistory;
    const gcode = getGCodeFile();
    const mode = getMode();
    const connection = getConnection();
    const fileInfo = getFileInfo();
    const jogPresets = getJogPresets();
    const workspaceUnits = getWorkspaceUnits();
    const isRotaryMode = getRotaryMode();
    let alarms, errors = [];

    api.alarmList.fetch().then(data => {
        const grblAlarmsAndErrors = get(data, 'body.list', []);
        [alarms, errors] = partition(grblAlarmsAndErrors, ['type', 'ALARM']);
    });

    let eepromData = [];
    Object.entries(eeprom).forEach(entry => {
        const [key, value] = entry;
        eepromData.push({ key: key, value: value });
    });

    const SupportFile = () => (
        <Document>
            <Page style={styles.body}>
                <Text style={styles.title}>Diagnostics</Text>
                <Text style={styles.author}>gSender {version}</Text>
                <View style={styles.clearTable}>
                    <View style={styles.clearTableRow}>
                        <View style={styles.clearTableCol}>
                            <Text style={styles.clearTableCell}>
                                <Text style={styles.subtitle}>
                                    {'Environment\n'}
                                </Text>
                                <Text style={styles.textBold}>
                                    {'OS: '}
                                    <Text style={styles.text}>
                                        {os + '\n'}
                                    </Text>
                                    {'Homing: '}
                                    <Text style={styles.text}>
                                        {/* When homing is enabled, the value of $22 will be odd. */}
                                        {(Number(eeprom.$22) % 2 === 1 ? 'Enabled' : 'Disabled') + '\n'}
                                    </Text>
                                    {'Soft Limits: '}
                                    <Text style={styles.text}>
                                        {(eeprom.$20 === '1' ? 'Enabled' : 'Disabled') + '\n'}
                                    </Text>
                                    {'Home Location: '}
                                    <Text style={styles.text}>
                                        {homingString(eeprom.$23) + '\n'}
                                    </Text>
                                    {'Report Inches: '}
                                    <Text style={styles.text}>
                                        {(eeprom.$13 === '1' ? 'Enabled' : 'Disabled') + '\n'}
                                    </Text>
                                    {'Stepper Motors: '}
                                    <Text style={styles.text}>
                                        {(eeprom.$1 === '255' ? 'Locked' : 'Unlocked') + '\n'}
                                    </Text>
                                </Text>
                            </Text>
                        </View>
                        <View style={styles.clearTableCol}>
                            <Text style={styles.clearTableCell}>
                                <Text style={styles.subtitle}>
                                    {'Machine Profile\n'}
                                </Text>
                                {
                                    machineProfile ? (
                                        <>
                                            <Text style={styles.textBold}>
                                                {'ID: '}
                                                <Text style={styles.text}>
                                                    {machineProfile.id + '\n'}
                                                </Text>
                                                {'Company: '}
                                                <Text style={styles.text}>
                                                    {machineProfile.company + '\n'}
                                                </Text>
                                                {'Name: '}
                                                <Text style={styles.text}>
                                                    {machineProfile.name + '\n'}
                                                </Text>
                                                {'Type: '}
                                                <Text style={styles.text}>
                                                    {machineProfile.type + '\n'}
                                                </Text>
                                                {'Version: '}
                                                <Text style={styles.text}>
                                                    {machineProfile.version + '\n'}
                                                </Text>
                                                {'Limits:\n'}
                                                <Text style={styles.text}>
                                                    {'    X Max: ' + get(machineProfile, 'limits.xmax', '0') + '\n'}
                                                    {'    Y Max: ' + get(machineProfile, 'limits.ymax', '0') + '\n'}
                                                    {'    Z Max: ' + get(machineProfile, 'limits.zmax', '0') + '\n'}
                                                </Text>
                                                {'Spindle/Laser: '}
                                                <Text style={styles.text}>
                                                    {machineProfile.spindle + '\n'}
                                                </Text>
                                                {'Laser Mode Enabled: '}
                                                <Text style={styles.text}>
                                                    {mode + '\n'}
                                                </Text>
                                            </Text>
                                        </>
                                    ) : (
                                        <Text style={styles.text}>
                                            {'NULL\n'}
                                        </Text>
                                    )
                                }
                            </Text>
                        </View>
                    </View>
                    <View style={styles.clearTableRow}>
                        <View style={styles.clearTableCol}>
                            <Text style={styles.clearTableCell}>
                                <Text style={styles.subtitle}>
                                    {'Connection\n'}
                                </Text>
                                {
                                    connection ? (
                                        <>
                                            <Text style={styles.textBold}>
                                                {'Available Ports:\n'}
                                                <Text style={styles.text}>
                                                    {
                                                        unwrapObject(connection.ports, 1)
                                                    }
                                                </Text>
                                                {'Connected Port: '}
                                                <Text style={styles.text}>
                                                    {connection.port + '\n'}
                                                </Text>
                                                {'Baudrate: '}
                                                <Text style={styles.text}>
                                                    {connection.baudrate ? connection.baudrate + '\n' : 'null\n'}
                                                </Text>
                                                {'Unrecognized Ports:\n'}
                                                <Text style={styles.text}>
                                                    {
                                                        unwrapObject(connection.unrecognizedPorts, 1)
                                                    }
                                                </Text>
                                            </Text>
                                        </>
                                    ) : (
                                        <Text style={styles.text}>
                                            {'NULL\n'}
                                        </Text>
                                    )
                                }
                            </Text>
                        </View>
                        <View style={styles.clearTableCol}>
                            <Text style={styles.clearTableCell}>
                                <Text style={styles.subtitle}>
                                    {'GRBL Information\n'}
                                </Text>
                                <Text style={styles.textBold}>
                                    {'Type: '}
                                    <Text style={styles.text}>
                                        { grblInfo.type ? grblInfo.type + '\n' : 'NULL\n' }
                                    </Text>
                                    {'Firmware Version: '}
                                    <Text style={styles.text}>
                                        { grblInfo.settings.info?.BOARD ? grblInfo.settings.info.BOARD + '\n' : 'N/A\n' }
                                    </Text>
                                </Text>
                                {
                                    !isEmpty(grblInfo.mpos) ? (
                                        <Text style={styles.textBold}>
                                            {'MPos: \n'}
                                            <Text style={styles.text}>
                                                {'    a: ' + grblInfo.mpos.a + '\n'}
                                                {'    b: ' + grblInfo.mpos.b + '\n'}
                                                {'    c: ' + grblInfo.mpos.c + '\n'}
                                                {'    x: ' + grblInfo.mpos.x + '\n'}
                                                {'    y: ' + grblInfo.mpos.y + '\n'}
                                                {'    z: ' + grblInfo.mpos.z + '\n'}
                                            </Text>
                                        </Text>
                                    ) : (
                                        <Text style={styles.textBold}>
                                            {'MPos: '}
                                            <Text style={styles.text}>
                                                {'NULL\n'}
                                            </Text>
                                        </Text>
                                    )
                                }
                                {
                                    !isEmpty(grblInfo.wpos) ? (
                                        <Text style={styles.textBold}>
                                            {'WPos: \n'}
                                            <Text style={styles.text}>
                                                {'    a: ' + grblInfo.wpos.a + '\n'}
                                                {'    b: ' + grblInfo.wpos.b + '\n'}
                                                {'    c: ' + grblInfo.wpos.c + '\n'}
                                                {'    x: ' + grblInfo.wpos.x + '\n'}
                                                {'    y: ' + grblInfo.wpos.y + '\n'}
                                                {'    z: ' + grblInfo.wpos.z + '\n'}
                                            </Text>
                                        </Text>
                                    ) : (
                                        <Text style={styles.textBold}>
                                            {'WPos: '}
                                            <Text style={styles.text}>
                                                {'NULL\n'}
                                            </Text>
                                        </Text>
                                    )
                                }
                                {
                                    grblInfo.sender.status ? (
                                        <Text style={styles.textBold}>
                                            {'Sender Status: \n'}
                                            <Text style={styles.text}>
                                                {'    Modal: \n'}
                                                {
                                                    grblInfo.sender.status.context ?
                                                        unwrapObject(grblInfo.sender.status.context.modal, 2) : 'NULL\n'
                                                }
                                                {'    Tool: '}
                                                {
                                                    grblInfo.sender.status.context?.tool ?
                                                        '        ' + grblInfo.sender.status.context.tool.toString() + '\n' : 'NULL\n'
                                                }
                                            </Text>
                                        </Text>
                                    ) : (
                                        <Text style={styles.textBold}>
                                            {'Sender Status: '}
                                            <Text style={styles.text}>
                                                {'NULL\n'}
                                            </Text>
                                        </Text>
                                    )
                                }
                                <Text style={styles.textBold}>
                                    {'Workflow State: '}
                                    <Text style={styles.text}>
                                        {grblInfo.workflow.state + '\n'}
                                    </Text>
                                    {'Homing Flag: '}
                                    <Text style={styles.text}>
                                        {grblInfo.homingFlag + '\n'}
                                    </Text>
                                </Text>
                            </Text>
                        </View>
                    </View>
                </View>

                <View style={styles.clearTable} break>
                    <View style={styles.clearTableRow}>
                        <View style={styles.clearTableCol}>
                            <Text style={styles.clearTableCell}>
                                <Text style={styles.subtitle}>
                                    {'Preferences\n'}
                                </Text>
                                <Text style={styles.textBold}>
                                    {'Jog Presets: \n'}
                                    <Text style={styles.text}>
                                        {
                                            '    Rapid: \n' +
                                            unwrapObject(jogPresets.rapid, 2) +
                                            '    Normal: \n' +
                                            unwrapObject(jogPresets.normal, 2) +
                                            '    Precise: \n' +
                                            unwrapObject(jogPresets.precise, 2)
                                        }
                                    </Text>
                                    {'Workspace Units: '}
                                    <Text style={styles.text}>
                                        {workspaceUnits + '\n'}
                                    </Text>
                                    {'Laser: '}
                                    <Text style={styles.text}>
                                        {mode ? 'Enabled\n' : 'Disabled\n'}
                                    </Text>
                                    {'Rotary: '}
                                    <Text style={styles.text}>
                                        {isRotaryMode ? 'Enabled\n' : 'Disabled\n'}
                                        {
                                            isRotaryMode &&
                                            <Text style={styles.text}>
                                                {'    Travel Resolution:\n'}
                                                {'        Y: ' + eeprom.$101 + '\n'}
                                                {
                                                    grblInfo.type === GRBLHAL && '        A: ' + eeprom.$103 + '\n'
                                                }
                                                {'    Maximum Rate:\n'}
                                                {'        Y: ' + eeprom.$111 + '\n'}
                                                {
                                                    grblInfo.type === GRBLHAL && '        A: ' + eeprom.$113 + '\n'
                                                }
                                                {
                                                    grblInfo.type === GRBLHAL &&
                                                        '    Acceleration:\n' +
                                                        '        Y: ' + eeprom.$121 + '\n' +
                                                        '        A: ' + eeprom.$123 + '\n' +
                                                        '    Travel Amount:\n' +
                                                        '        Y: ' + eeprom.$131 + '\n' +
                                                        '        A: ' + eeprom.$133 + '\n'
                                                }
                                            </Text>
                                        }
                                    </Text>
                                </Text>
                            </Text>
                        </View>
                    </View>
                </View>

                <Text style={styles.subtitle} break>
                    EEPROM Values
                </Text>
                {/* table from https://github.com/diegomura/react-pdf/issues/487#issuecomment-465513123 */}
                <View style={styles.table}>
                    {/* TableHeader */}
                    <View style={styles.tableRow}>
                        <View style={styles.tableCol}>
                            <Text style={[styles.tableCell, { fontFamily: 'Helvetica-Bold' }]}>
                                Setting
                            </Text>
                        </View>
                        <View style={styles.tableCol}>
                            <Text style={[styles.tableCell, { fontFamily: 'Helvetica-Bold' }]}>
                                Value
                            </Text>
                        </View>
                    </View>
                    {/* TableContent */}
                    { createTableRows(eeprom) }
                </View>
                <Text style={styles.subtitle} break>
                    Recent Alarms
                </Text>
                <View style={styles.container}>
                    {
                        alarms.length > 0 ? (
                            alarms.map((log, i) => {
                                return (
                                    <View style={styles.lineWrapper} key={uniqueId()}>
                                        <Text style={styles.text}>
                                            {new Date(log.time).toLocaleString() + '\n'}
                                            <Text style={[styles.error, { color: 'red' }]}>
                                                {'    ' + log.MESSAGE + '\n'}
                                            </Text>
                                            <Text>{'    Input: ' + log.line}</Text>
                                            <Text>{'    Controller: ' + log.controller}</Text>
                                        </Text>
                                    </View>
                                );
                            })
                        ) : (
                            <Text style={styles.text}>
                                None
                            </Text>
                        )
                    }
                </View>
                <Text style={styles.subtitle}>
                    Recent Errors
                </Text>
                <View style={styles.container}>
                    {
                        errors.length > 0 ? (
                            errors.map((log, i) => {
                                return (
                                    <View style={styles.lineWrapper} key={uniqueId()}>
                                        <Text style={styles.text}>
                                            {new Date(log.time).toLocaleString() + '\n'}
                                            <Text style={[styles.error, { color: 'red' }]}>
                                                {'    ' + log.MESSAGE + '\n'}
                                            </Text>
                                            <Text>{'    Input: ' + log.line}</Text>
                                            <Text>{'    Controller: ' + log.controller}</Text>
                                        </Text>
                                    </View>
                                );
                            })
                        ) : (
                            <Text style={styles.text}>
                                None
                            </Text>
                        )
                    }
                </View>
                <Text style={styles.subtitle}>
                    Terminal History
                </Text>
                <View style={styles.container}>
                    <Text style={styles.text}>
                        {
                            history.length > 0 ? (
                                history.map((value, i) => {
                                    return value + '\n';
                                })
                            ) : (
                                'None'
                            )
                        }
                    </Text>
                </View>
                <Text style={styles.subtitle}>
                    G-Code File
                </Text>
                {
                    fileInfo.fileLoaded && grblInfo.sender.status ? (
                        <View style={styles.table}>
                            {/* TableHeader */}
                            <View style={styles.tableRow}>
                                <View style={styles.tableCol}>
                                    <Text style={[styles.tableCell, { fontFamily: 'Helvetica-Bold' }]}>
                                        Status
                                    </Text>
                                </View>
                                <View style={styles.tableCol}>
                                    <Text style={[styles.tableCell, { fontFamily: 'Helvetica-Bold' }]}>
                                        Value
                                    </Text>
                                </View>
                            </View>
                            {/* TableContent */}
                            <View style={styles.tableRow}>
                                <View style={styles.tableCol}>
                                    <Text style={styles.tableCell}>
                                        Name
                                    </Text>
                                </View>
                                <View style={styles.tableCol}>
                                    <Text style={styles.tableCell}>
                                        {grblInfo.sender.status.name}
                                    </Text>
                                </View>
                            </View>
                            <View style={styles.tableRow}>
                                <View style={styles.tableCol}>
                                    <Text style={styles.tableCell}>
                                        Sent
                                    </Text>
                                </View>
                                <View style={styles.tableCol}>
                                    <Text style={styles.tableCell}>
                                        {grblInfo.sender.status.sent}
                                    </Text>
                                </View>
                            </View>
                            <View style={styles.tableRow}>
                                <View style={styles.tableCol}>
                                    <Text style={styles.tableCell}>
                                        Received
                                    </Text>
                                </View>
                                <View style={styles.tableCol}>
                                    <Text style={styles.tableCell}>
                                        {grblInfo.sender.status.remainingTime}
                                    </Text>
                                </View>
                            </View>
                            <View style={styles.tableRow}>
                                <View style={styles.tableCol}>
                                    <Text style={styles.tableCell}>
                                        Total
                                    </Text>
                                </View>
                                <View style={styles.tableCol}>
                                    <Text style={styles.tableCell}>
                                        {grblInfo.sender.status.total}
                                    </Text>
                                </View>
                            </View>
                        </View>
                    ) : (
                        <View style={styles.table}>
                            {/* TableHeader */}
                            <View style={styles.tableRow}>
                                <View style={styles.tableCol}>
                                    <Text style={[styles.tableCell, { fontFamily: 'Helvetica-Bold' }]}>
                                        Status
                                    </Text>
                                </View>
                                <View style={styles.tableCol}>
                                    <Text style={[styles.tableCell, { fontFamily: 'Helvetica-Bold' }]}>
                                        Value
                                    </Text>
                                </View>
                            </View>
                        </View>
                    )
                }
                <View style={styles.container}>
                    <Text style={styles.text}>
                        { gcode || 'No File Loaded' }
                    </Text>
                </View>
            </Page>
        </Document>
    );

    const submitForm = async (event) => {
        event.preventDefault(); // prevent page reload
        const blob = await pdf(<SupportFile />).toBlob();
        const date = new Date();
        const currentDate = date.toLocaleDateString().replaceAll('/', '-');
        const currentTime = date.toLocaleTimeString('it-IT').replaceAll(':', '-');

        saveAs(blob, 'diagnostics_' + currentDate + '_' + currentTime + '.pdf');
    };

    return (
        <ToolModalButton icon="fas fa-file-pdf" onClick={submitForm}>Download Now!</ToolModalButton>
    );
}

export default generateSupportFile;
