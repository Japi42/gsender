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
import styles from '../../index.styl';

const Tool = ({ metricDiameter, imperialDiameter, type, onDelete }) => {
    return (
        <div className={styles.tool}>
            <div className={styles.toolDimensions}>
                <div><b>{metricDiameter}</b>mm</div>
                <div><b>{imperialDiameter}</b>in</div>
            </div>
            <div>{type}</div>
            <button
                type="button"
                className={styles.delete}
                alt="Delete Tool"
                onClick={onDelete}
            >
                <i className="far fa-trash-alt" />
            </button>

        </div>
    );
};

export default Tool;
