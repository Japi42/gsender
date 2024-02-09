import { createContext } from 'react';
import get from 'lodash/get';
import download from 'downloadjs';
import ip from 'ip';

import controller from 'app/lib/controller';
import WidgetConfig from 'app/widgets/WidgetConfig';
import {
    Toaster,
    TOASTER_SUCCESS,
    TOASTER_INFO,
    TOASTER_DANGER,
} from 'app/lib/toaster/ToasterLib';
// import store from 'app/store';
import { GRBL } from 'app/constants';

import defaultGRBLSettings from '../eepromFiles/DefaultGrblSettings.json';
import {
    AXIS_MASK_ID,
    BITFIELD_ID,
    BOOLEAN_ID,
    DECIMAL_ID,
    EXCLUSIVE_BITFIELD_ID,
    INTEGER_ID,
    IPV4_ID,
    PASSWORD_ID,
    RADIO_BUTTON_ID,
    STRING_ID,
} from 'Containers/Firmware/components/HalSettings/constants';
import BooleanInput from 'Containers/Firmware/components/HalSettings/inputs/BooleanInput';
import BitfieldInput from 'Containers/Firmware/components/HalSettings/inputs/BitfieldInput';
import ExclusiveBitfieldInput from 'Containers/Firmware/components/HalSettings/inputs/ExclusiveBitfieldInput';
import RadioButtonInput from 'Containers/Firmware/components/HalSettings/inputs/RadioButtonInput';
import AxisMaskInput from 'Containers/Firmware/components/HalSettings/inputs/AxisMaskInput';
import IntegerInput from 'Containers/Firmware/components/HalSettings/inputs/IntegerInput';
import DecimalInput from 'Containers/Firmware/components/HalSettings/inputs/DecimalInput';
import StringInput from 'Containers/Firmware/components/HalSettings/inputs/StringInput';
import PasswordInput from 'Containers/Firmware/components/HalSettings/inputs/PasswordInput';
import Ipv4Input from 'Containers/Firmware/components/HalSettings/inputs/Ipv4Input';

export const FirmwareContext = createContext({});

export const controllerSettingsLoaded = () => {
    const { settings } = controller.settings;
    if (settings) {
        return Object.keys(settings).length > 0;
    }
    return false;
};

export const connectToLastDevice = (callback) => {
    const connectionConfig = new WidgetConfig('connection');

    const port = connectionConfig.get('port');
    const baudrate = connectionConfig.get('baudrate');
    const controllerType = connectionConfig.get('controller.type') || GRBL;

    const isNetwork = ip.isV4Format(port); // Do we look like an IP address?

    controller.openPort(
        port,
        controllerType,
        {
            baudrate,
            rtscts: false,
            network: isNetwork,
        },
        (err) => {
            if (err) {
                return;
            }
            callback && callback();
        },
    );
};

export const getResetToDefaultMessage = ({ name, type } = {}) => {
    const supportedMachines = ['Mill One', 'LongMill', 'LongMill MK2'];
    const message = supportedMachines.includes(name)
        ? `Are you sure you want to restore your ${name} ${type} back to its default state?`
        : `We dont have the default settings for your ${name} ${type}. Would you like to Restore your machine to the Grbl defaults?`;

    return message;
};

export const getMachineProfileVersion = (profile) => {
    return get(profile, 'version', 'MK1');
};

export const startFlash = (port, profile, hex = null, isHal = false) => {
    if (!port) {
        Toaster.pop({
            msg: 'No port specified - please connect to the device to determine what is being flashed',
            type: TOASTER_DANGER,
            duration: 15000,
        });
        return;
    }
    Toaster.pop({
        msg: `Flashing started on port: ${port} `,
        type: TOASTER_INFO,
        duration: 10000,
    });
    const imageType = getMachineProfileVersion(profile);

    controller.flashFirmware(port, imageType, isHal, hex);
};

export const restoreDefaultSettings = (machineProfile) => {
    const eepromSettings =
        machineProfile?.eepromSettings ?? defaultGRBLSettings;
    const values = Object.entries(eepromSettings).map(
        ([key, value]) => `${key}=${value}`,
    );
    values.push('$$');

    controller.command('gcode', values);

    Toaster.pop({
        msg: 'Default Settings Restored',
        type: TOASTER_INFO,
    });
};

export const restoreSingleDefaultSetting = (setting, machineProfile) => {
    const eepromSettings =
        machineProfile?.eepromSettings ?? defaultGRBLSettings;
    const defaultValue = eepromSettings[setting];

    controller.command('gcode', [`${setting}=${defaultValue}`, '$$']);

    Toaster.pop({
        msg: `Restored Default Value for ${setting}`,
        type: TOASTER_INFO,
    });
};

export const addControllerEvents = (controllerEvents) => {
    Object.keys(controllerEvents).forEach((eventName) => {
        const callback = controllerEvents[eventName];
        controller.addListener(eventName, callback);
    });
};

export const removeControllerEvents = (controllerEvents) => {
    Object.keys(controllerEvents).forEach((eventName) => {
        const callback = controllerEvents[eventName];
        controller.removeListener(eventName, callback);
    });
};

export const convertValueToArray = (value, possibilities) => {
    let index = Number(value);

    if (index > possibilities.length - 1) {
        index = possibilities.length - 1;
    }

    return possibilities[index];
};

export const applyNewSettings = (settings, eeprom, setSettingsToApply) => {
    let index22 = 200; // index of $22 - default is 200 because we have less eeprom values than that, so it will never be set to this value
    let index2021 = -1; // index of $20 or $21, whichever comes first
    let changedSettings = settings
        .filter((item) => eeprom[item.setting] !== item.value) // Only retrieve settings that have been modified
        .map((item, i) => {
            // Create array of set eeprom value strings (ex. "$0=1")
            if (item.setting === '$22') {
                // always find where $22 is
                index22 = i;
            } else if (
                (item.setting === '$20' || item.setting === '$21') &&
                i < index22 &&
                index2021 === -1
            ) {
                // if $20 or $21 come before $22,
                // and this is the first occurence of $20 or $21,
                // we are going to have to switch it with $20, so save the index.
                index2021 = i;
            }
            return `${item.setting}=${item.value}`;
        });

    // switch commands so $20 comes first
    // check that the indexes have been set for both, otherwise there's no need to switch
    if (index2021 >= 0 && index22 < 200) {
        const setting22 = changedSettings[index22];
        changedSettings[index22] = changedSettings[index2021];
        changedSettings[index2021] = setting22;
    }
    changedSettings.push('$$'); // Add setting refresh to end so tool updates values
    controller.command('gcode', changedSettings);
    setSettingsToApply(false);
    Toaster.pop({
        msg: 'Firmware Settings Updated',
        type: TOASTER_SUCCESS,
    });
};

export const importFirmwareSettings = (file, callback) => {
    const reader = new FileReader();

    reader.onload = callback;
    reader.readAsText(file);
};

export const exportFirmwareSettings = (settings) => {
    const output = JSON.stringify(settings, null, 1);

    const blob = new Blob([output], { type: 'application/json' });

    const today = new Date();
    const filename = `gSender-firmware-settings-${today.toLocaleDateString()}-${today.toLocaleTimeString()}`;

    download(blob, filename, 'json');
};

export const descriptionLookup = (key, descriptions) => {
    let metadata = get(descriptions, key, {});

    let message =
        metadata.description ||
        `$${key} EEPROM Value - no detailed title found`;
    let description =
        metadata.details ||
        `Configure the value of $${key} in the firmware - no detailed description found.`;
    // Non-newline newlines from parser need to be replaced
    description = description.replace(/\\n/gim, '\n');

    return {
        ...metadata,
        message,
        description,
    };
};

export const halDatatypeMap = {
    [BOOLEAN_ID]: BooleanInput,
    [BITFIELD_ID]: BitfieldInput,
    [EXCLUSIVE_BITFIELD_ID]: ExclusiveBitfieldInput,
    [RADIO_BUTTON_ID]: RadioButtonInput,
    [AXIS_MASK_ID]: AxisMaskInput,
    [INTEGER_ID]: IntegerInput,
    [DECIMAL_ID]: DecimalInput,
    [STRING_ID]: StringInput,
    [PASSWORD_ID]: PasswordInput,
    [IPV4_ID]: Ipv4Input,
};

export const getDatatypeInput = (type) => {
    type = Number(type);
    return halDatatypeMap[type] || String;
};

// Convert integer to base 2 string, split and reverse it so index 0 is the lowest bit
