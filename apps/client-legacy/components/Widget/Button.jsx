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

import classNames from 'classnames';
import PropTypes from 'prop-types';
import React, { PureComponent } from 'react';
import Anchor from '../Anchor';
import styles from './index.styl';

class Button extends PureComponent {
    static propTypes = {
        ...Anchor.propTypes,
        inverted: PropTypes.bool
    };

    static defaultProps = {
        ...Anchor.defaultProps,
        inverted: false
    };

    render() {
        const { inverted, className, ...props } = this.props;

        return (
            <Anchor
                {...props}
                className={classNames(className, styles.widgetButton, {
                    [styles.disabled]: !!props.disabled,
                    [styles.inverted]: inverted
                })}
            />
        );
    }
}

export default Button;
