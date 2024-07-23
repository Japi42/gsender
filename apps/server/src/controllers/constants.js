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

// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects
export const GLOBAL_OBJECTS = {
    // Function properties
    parseFloat,
    parseInt,

    // Fundamental objects
    Object,
    Function,
    Boolean,

    // Numbers and dates
    Number,
    Math,
    Date,

    // Text processing
    String,
    RegExp,

    // Structured data
    JSON,
};

// Write Source
export const WRITE_SOURCE_CLIENT = 'client';
export const WRITE_SOURCE_SERVER = 'server';
export const WRITE_SOURCE_FEEDER = 'feeder';
export const WRITE_SOURCE_SENDER = 'sender';

export const A_AXIS_COMMANDS = /A(\d+\.\d+)|A (\d+\.\d+)|A(\d+)|A (\d+)|A-(\d+\.\d+)|A-(\d+)/;
export const Y_AXIS_COMMANDS = /Y(\d+\.\d+)|Y (\d+\.\d+)|Y(\d+)|Y (\d+)|Y-(\d+\.\d+)|Y-(\d+)/;

export const REGEX_MATCHER = {
    A_AXIS_COMMAND: /A(\d+\.\d+)|A (\d+\.\d+)|A(\d+)|A (\d+)|A-(\d+\.\d+)|A-(\d+)/,
    Y_AXIS_COMMAND_REGEX: /Y(\d+\.\d+)|Y (\d+\.\d+)|Y(\d+)|Y (\d+)|Y-(\d+\.\d+)|Y-(\d+)/,
    COMMENT_SEMI_COLON: /\s*;.*/g,
    COMMENT_BRACKETS: /\([^\)]*\)/gm,
};
