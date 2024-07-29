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

import PropTypes from 'prop-types';
import React from 'react';
import WidgetListItem from './WidgetListItem';

const WidgetList = (props) => {
    const { list, onChange } = props;
    const style = {
        maxHeight: Math.max(window.innerHeight / 2, 200),
        overflowY: 'scroll',
        padding: 15
    };

    return (
        <div className="container-fluid" style={style}>
            <div className="row">
                {list.map((o, key) => (
                    <div className="col-xs-6 col-md-4" key={o.id}>
                        <WidgetListItem
                            id={o.id}
                            caption={o.caption}
                            details={o.details}
                            checked={o.visible}
                            disabled={o.disabled}
                            onChange={onChange}
                        />
                    </div>
                ))}
            </div>
        </div>
    );
};

WidgetList.propTypes = {
    list: PropTypes.array.isRequired,
    onChange: PropTypes.func
};

export default WidgetList;
