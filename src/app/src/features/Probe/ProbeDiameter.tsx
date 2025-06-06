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

import { useState, useEffect, KeyboardEvent, useCallback, useRef } from 'react';
import cx from 'classnames';
import { X, Plus } from 'lucide-react';

import {
    TOUCHPLATE_TYPE_AUTOZERO,
    PROBE_TYPE_AUTO,
    PROBE_TYPE_TIP,
    PROBE_TYPE_DIAMETER,
} from 'app/lib/constants';
import { UNITS_EN } from 'app/definitions/general';
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from 'app/components/shadcn/Select';

import { Input } from 'app/components/shadcn/Input';
import { Button } from 'app/components/Button';

import { METRIC_UNITS, PROBING_CATEGORY } from '../../constants';
import {
    Actions,
    AvailableTool,
    PROBE_TYPES_T,
    ProbeCommand,
    State,
} from './definitions';
import useShuttleEvents from 'app/hooks/useShuttleEvents';
import useKeybinding from 'app/lib/useKeybinding';
import store from 'app/store';

interface Props {
    actions: Actions;
    state: State;
    probeCommand: ProbeCommand;
}

const convertAvailableTools = (tools: AvailableTool[], units: UNITS_EN) => {
    return tools.map((tool) => ({
        value: String(
            tool[
                units === METRIC_UNITS ? 'metricDiameter' : 'imperialDiameter'
            ],
        ),
        label: String(
            tool[
                units === METRIC_UNITS ? 'metricDiameter' : 'imperialDiameter'
            ],
        ),
        isCustom: tool.isCustom,
    }));
};

const ProbeDiameter = ({ actions, state, probeCommand }: Props) => {
    const { touchplate, toolDiameter } = state;
    const { touchplateType } = touchplate;
    let { availableTools, units } = state;

    // Add refs to track current state
    const valueRef = useRef<string>(
        touchplateType === TOUCHPLATE_TYPE_AUTOZERO
            ? PROBE_TYPE_AUTO
            : String(toolDiameter),
    );
    console.log(toolDiameter);
    const unitsRef = useRef<UNITS_EN>(units);
    const availableToolsRef = useRef<AvailableTool[]>(availableTools);
    const actionsRef = useRef(actions);
    // Add ref for the input element
    const inputRef = useRef<HTMLInputElement>(null);

    const [value, setValue] = useState(
        touchplateType === TOUCHPLATE_TYPE_AUTOZERO
            ? PROBE_TYPE_AUTO
            : String(toolDiameter),
    );
    const [existingTools, setExistingTools] =
        useState<AvailableTool[]>(availableTools);

    // Update refs when state changes
    useEffect(() => {
        valueRef.current = value;
    }, [value]);

    useEffect(() => {
        availableToolsRef.current = existingTools;
        store.replace('workspace.tools', existingTools);
    }, [existingTools]);

    useEffect(() => {
        unitsRef.current = units;
    }, [units]);

    useEffect(() => {
        actionsRef.current = actions;
    }, [actions]);

    useEffect(() => {
        // Keep local state in sync with prop changes
        setValue(
            touchplateType === TOUCHPLATE_TYPE_AUTOZERO
                ? PROBE_TYPE_AUTO
                : String(toolDiameter),
        );
    }, [touchplateType]);

    // Create stable callback that doesn't change on each render
    const handleChange = useCallback((value: string): void => {
        const currentActions = actionsRef.current;
        if (value === PROBE_TYPE_AUTO || value === PROBE_TYPE_TIP) {
            currentActions._setProbeType(value);
            currentActions._setToolDiameter({ value: null });
        } else {
            currentActions._setProbeType(PROBE_TYPE_DIAMETER);
            currentActions._setToolDiameter({ value: Number(value) });
        }
        setValue(value);
        inputRef.current.value = '';
    }, []);

    const handleCreateOption = useCallback(
        (inputValue: string) => {
            const newValue = Number(inputValue);
            if (isNaN(newValue) || newValue <= 0) {
                return;
            }
            const formattedValue = String(newValue);
            const toolUnits =
                unitsRef.current === METRIC_UNITS
                    ? 'metricDiameter'
                    : 'imperialDiameter';
            const existingToolValues = availableToolsRef.current.map((tool) =>
                String(tool[toolUnits]),
            );

            if (
                existingToolValues.includes(formattedValue) //||
                // existingCustomValues.includes(formattedValue)
            ) {
                handleChange(formattedValue);
                return;
            }

            const newTool: AvailableTool = {
                metricDiameter: Number(formattedValue),
                imperialDiameter: Number(formattedValue),
                type: '',
                isCustom: true,
            };

            console.log("hi, we're adding to the list");

            const updatedValues = [...availableToolsRef.current, newTool];

            setExistingTools(updatedValues);
            availableToolsRef.current = updatedValues;

            handleChange(formattedValue);
        },
        [handleChange],
    );

    const handleDeleteOption = useCallback(
        (valueToDelete: string) => {
            const toolUnits =
                unitsRef.current === METRIC_UNITS
                    ? 'metricDiameter'
                    : 'imperialDiameter';

            const updatedValues = availableToolsRef.current.filter(
                (tool) => String(tool[toolUnits]) !== valueToDelete,
            );

            setExistingTools(updatedValues);
            availableToolsRef.current = updatedValues;

            if (valueRef.current === valueToDelete) {
                const firstTool = updatedValues[0];
                if (firstTool) {
                    const toolUnits =
                        unitsRef.current === METRIC_UNITS
                            ? 'metricDiameter'
                            : 'imperialDiameter';
                    const diameter = String(firstTool[toolUnits]);
                    handleChange(diameter);
                }
            }
        },
        [handleChange],
    );

    // Create stable callback functions for shuttle events
    const probeDiameterScrollUp = useCallback(() => {
        const currentValue = valueRef.current;
        const currentUnits = unitsRef.current;
        const currentTools = availableToolsRef.current;

        if (
            currentValue === PROBE_TYPE_AUTO ||
            currentValue === PROBE_TYPE_TIP
        ) {
            return;
        }

        const toolUnits =
            currentUnits === METRIC_UNITS
                ? 'metricDiameter'
                : 'imperialDiameter';

        const allOptions = currentTools.map((tool) => String(tool[toolUnits]));

        allOptions.sort((a, b) => Number(a) - Number(b));

        const currentIndex = allOptions.indexOf(currentValue);

        if (currentIndex === -1) {
            return;
        }

        let newIndex = currentIndex - 1;
        if (newIndex < 0) {
            newIndex = allOptions.length - 1;
        }

        handleChange(allOptions[newIndex]);
    }, [handleChange]);

    const probeDiameterScrollDown = useCallback(() => {
        const currentValue = valueRef.current;
        const currentUnits = unitsRef.current;
        const currentTools = availableToolsRef.current;

        if (
            currentValue === PROBE_TYPE_AUTO ||
            currentValue === PROBE_TYPE_TIP
        ) {
            return;
        }

        const toolUnits =
            currentUnits === METRIC_UNITS
                ? 'metricDiameter'
                : 'imperialDiameter';

        const allOptions = currentTools.map((tool) => String(tool[toolUnits]));

        allOptions.sort((a, b) => Number(a) - Number(b));

        const currentIndex = allOptions.indexOf(currentValue);

        if (currentIndex === -1) {
            return;
        }

        let newIndex = currentIndex + 1;
        if (newIndex >= allOptions.length) {
            newIndex = 0;
        }

        handleChange(allOptions[newIndex]);
    }, [handleChange]);

    const shuttleControlEvents = useRef({
        PROBE_DIAMETER_SCROLL_UP: {
            title: 'Probe Diameter Scroll Up',
            keys: '',
            cmd: 'PROBE_DIAMETER_SCROLL_UP',
            preventDefault: false,
            isActive: true,
            category: PROBING_CATEGORY,
            callback: probeDiameterScrollUp,
        },
        PROBE_DIAMETER_SCROLL_DOWN: {
            title: 'Probe Diameter Scroll Down',
            keys: '',
            cmd: 'PROBE_DIAMETER_SCROLL_DOWN',
            preventDefault: false,
            isActive: true,
            category: PROBING_CATEGORY,
            callback: probeDiameterScrollDown,
        },
    }).current;

    useKeybinding(shuttleControlEvents);
    useShuttleEvents(shuttleControlEvents);

    const options = [];

    const toolsObjects = convertAvailableTools(existingTools, units);

    if (touchplateType === TOUCHPLATE_TYPE_AUTOZERO) {
        options.push(
            { value: PROBE_TYPE_AUTO, label: PROBE_TYPE_AUTO, isCustom: false },
            { value: PROBE_TYPE_TIP, label: PROBE_TYPE_TIP, isCustom: false },
        );
    }

    function getUnitString(option: PROBE_TYPES_T) {
        if (option === 'Tip' || option === 'Auto') {
            return '';
        }
        return units;
    }

    options.push(...toolsObjects);
    options.sort((a, b) => {
        const isNumR = /^\d+.?\d*$/;
        const isANum = isNumR.test(a.value);
        const isBNum = isNumR.test(b.value);
        // check if number
        if (isANum && isBNum) {
            return Number(a.value) - Number(b.value);
        } else if (!isANum && !isBNum) {
            return a.value.localeCompare(b.value); // we want letters first
        } else {
            return isANum ? 1 : -1; // we want words at the top
        }
    });

    return (
        <div className={cx('w-full', { hidden: !probeCommand.tool })}>
            <div className="flex flex-col space-y-2">
                <Select
                    value={value}
                    onValueChange={handleChange}
                    disabled={!probeCommand.tool}
                >
                    <SelectTrigger className="w-full bg-white">
                        <SelectValue placeholder="Select diameter" />
                    </SelectTrigger>
                    <SelectContent className="bg-white">
                        <SelectGroup>
                            {options.map((option) => (
                                <div
                                    key={option.value}
                                    className="flex items-center justify-between"
                                >
                                    <SelectItem
                                        value={option.value}
                                        className={cx(
                                            'flex items-center justify-between pr-8',
                                        )}
                                    >
                                        <div className="flex items-center justify-between w-full">
                                            <span>
                                                {option.label}{' '}
                                                {getUnitString(option.value)}
                                            </span>
                                            {/^\d+.?\d*$/.test(
                                                option.value,
                                            ) && (
                                                <div
                                                    className="ml-2"
                                                    onMouseDown={(e) => {
                                                        // This prevents the dropdown from closing
                                                        e.stopPropagation();
                                                        e.preventDefault();
                                                        // Add a small delay to ensure the event doesn't bubble
                                                        setTimeout(() => {
                                                            handleDeleteOption(
                                                                option.value,
                                                            );
                                                        }, 0);
                                                    }}
                                                >
                                                    <X className="h-4 w-4 cursor-pointer hover:text-red-500" />
                                                </div>
                                            )}
                                        </div>
                                    </SelectItem>
                                </div>
                            ))}
                        </SelectGroup>
                        <div className="p-2 border-t">
                            <div className="flex items-center space-x-2">
                                <Input
                                    type="decimal"
                                    placeholder={`Custom diameter (${units})`}
                                    onKeyDown={(
                                        e: KeyboardEvent<HTMLInputElement>,
                                    ) => {
                                        if (e.key === 'Enter') {
                                            handleCreateOption(
                                                inputRef.current.value,
                                            );
                                        }
                                    }}
                                    sizing="sm"
                                    ref={inputRef}
                                />
                                <Button
                                    variant="ghost"
                                    onClick={() => {
                                        if (inputRef.current.value) {
                                            handleCreateOption(
                                                inputRef.current.value,
                                            );
                                        }
                                    }}
                                    size="sm"
                                >
                                    <Plus className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    </SelectContent>
                </Select>
            </div>
        </div>
    );
};

export default ProbeDiameter;
