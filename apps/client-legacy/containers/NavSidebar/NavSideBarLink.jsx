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

/* eslint-disable react/button-has-type */
import React from 'react';
import PropTypes from 'prop-types';
import cx from 'classnames';
import styles from './index.styl';

const NavSidebarLink = ({ label, url = '#', icon, onClick, className, disabled = false }) => {
    return (
        <button
            onClick={onClick}
            className={cx(styles.linkButton, className)}
            disabled={disabled}
        >
            <i className={icon} /> {label}
        </button>
    );
};

NavSidebarLink.propTypes = {
    label: PropTypes.string.isRequired,
    url: PropTypes.string,
    icon: PropTypes.string.isRequired,
    onClick: PropTypes.func,
    className: PropTypes.string,
    disabled: PropTypes.bool
};

export default NavSidebarLink;
