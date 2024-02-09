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
import Widget from 'app/components/Widget';
import { connect } from 'react-redux';
import CoolantControls from 'app/widgets/Coolant/CoolantControls';
import CoolantActiveIndicator from 'app/widgets/Coolant/CoolantActiveIndicator';

const CoolantWidget = ({ widgetId, embedded }) => {
    return (
        <Widget>
            <Widget.Header embedded={embedded} />
            <Widget.Content style={{ height: '100%', overflowY: 'auto' }}>
                <div
                    style={{
                        position: 'absolute',
                        display: 'grid',
                        gridTemplateRows: '1fr 1fr',
                        width: '100%',
                        left: '0',
                        top: '0',
                        padding: '0 1rem 0 1rem',
                    }}
                >
                    <CoolantActiveIndicator />
                    <CoolantControls />
                </div>
            </Widget.Content>
        </Widget>
    );
};

export default connect((store) => {
    return {};
})(CoolantWidget);
