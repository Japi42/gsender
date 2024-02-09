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
import store from 'app/store';
import styles from '../index.styl';
import Fieldset from '../components/Fieldset';
import CustomPieChart from '../components/CustomPieChart';

const Charts = ({ state, actions }) => {
    const jobsFinished = store.get('workspace.jobsFinished', 0);
    const jobsCancelled = store.get('workspace.jobsCancelled', 0);
    const data = [
        { name: 'Cancelled', value: jobsCancelled, color: '#C13C37' },
        { name: 'Completed', value: jobsFinished, color: '#E38627' },
    ];

    return (
        <Fieldset legend="Charts">
            <div
                className={[styles.addMargin, styles.chartsContainer].join(' ')}
            >
                {jobsFinished === 0 && jobsCancelled === 0 ? (
                    <span>No jobs run</span>
                ) : (
                    <CustomPieChart
                        propsData={data}
                        height={300}
                        width={340}
                        showAnimation={false}
                    />
                )}
            </div>
        </Fieldset>
    );
};

export default Charts;
